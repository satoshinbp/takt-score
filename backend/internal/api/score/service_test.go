package score_test

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"

	"github.com/shinyasato/takt-score/backend/internal/api/score"
	"github.com/shinyasato/takt-score/backend/internal/domain"
)

var testPool *pgxpool.Pool

func TestMain(m *testing.M) {
	os.Exit(runTests(m))
}

func runTests(m *testing.M) int {
	ctx := context.Background()

	// BasicWaitStrategies waits for the port to be ready on Mac/Windows
	// in addition to the log-based readiness check.
	ctr, err := tcpostgres.Run(ctx,
		"postgres:16-alpine",
		tcpostgres.WithDatabase("taktscore"),
		tcpostgres.WithUsername("taktscore"),
		tcpostgres.WithPassword("taktscore"),
		tcpostgres.BasicWaitStrategies(),
	)
	if err != nil {
		panic("postgres container failed to start: " + err.Error())
	}
	defer func() { _ = ctr.Terminate(ctx) }()

	connStr, err := ctr.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		panic("connection string unavailable: " + err.Error())
	}

	testPool, err = pgxpool.New(ctx, connStr)
	if err != nil {
		panic("pool creation failed: " + err.Error())
	}
	defer testPool.Close()

	if err := applyMigrations(ctx, testPool); err != nil {
		panic("migration failed: " + err.Error())
	}

	return m.Run()
}

// applyMigrations reads the goose Up section from the first migration file and
// executes it against the given pool.
func applyMigrations(ctx context.Context, pool *pgxpool.Pool) error {
	_, thisFile, _, _ := runtime.Caller(0)
	migrationsDir := filepath.Join(filepath.Dir(thisFile), "../../../migrations")

	raw, err := os.ReadFile(filepath.Join(migrationsDir, "00001_init.sql"))
	if err != nil {
		return err
	}

	upSQL := extractGooseUpSQL(string(raw))
	_, err = pool.Exec(ctx, upSQL)
	return err
}

// extractGooseUpSQL returns the concatenated SQL of every StatementBegin/End
// block in the Up section of a goose migration file. If no StatementBegin
// markers are present, the entire Up section is returned.
func extractGooseUpSQL(content string) string {
	const upMarker = "-- +goose Up"
	const downMarker = "-- +goose Down"
	const beginMarker = "-- +goose StatementBegin"
	const endMarker = "-- +goose StatementEnd"

	upStart := strings.Index(content, upMarker)
	if upStart < 0 {
		return content
	}
	upSection := content[upStart+len(upMarker):]
	if downIdx := strings.Index(upSection, downMarker); downIdx >= 0 {
		upSection = upSection[:downIdx]
	}

	var statements []string
	rest := upSection
	for {
		bIdx := strings.Index(rest, beginMarker)
		if bIdx < 0 {
			break
		}
		rest = rest[bIdx+len(beginMarker):]

		eIdx := strings.Index(rest, endMarker)
		if eIdx < 0 {
			statements = append(statements, strings.TrimSpace(rest))
			rest = ""
			break
		}
		statements = append(statements, strings.TrimSpace(rest[:eIdx]))
		rest = rest[eIdx+len(endMarker):]
	}

	if len(statements) == 0 {
		return strings.TrimSpace(upSection)
	}
	// Insert a bare `;` between blocks so a block whose last line lacks a
	// terminator (e.g. PL/pgSQL `END $$`) is still safely separated when
	// executed as a single string.
	return strings.Join(statements, "\n;\n")
}

// truncateScores removes all scores (cascades to measures/beats/hits) before a test
// so each test starts with a clean slate.
func truncateScores(t *testing.T) {
	t.Helper()
	_, err := testPool.Exec(context.Background(), "TRUNCATE scores CASCADE")
	if err != nil {
		t.Fatalf("truncate failed: %v", err)
	}
}

// buildBeat returns a Beat where all parts have subdivision-length OFF slices.
func buildBeat(subdivision int) score.Beat {
	steps := make(map[domain.PartID][]int, len(domain.PartIDs))
	for _, p := range domain.PartIDs {
		steps[p] = make([]int, subdivision)
	}
	return score.Beat{Subdivision: subdivision, Steps: steps}
}

// buildMeasure returns a Measure of domain.BeatsPerMeasure silent beats.
func buildMeasure(subdivision int) score.Measure {
	m := make(score.Measure, domain.BeatsPerMeasure)
	for i := range m {
		m[i] = buildBeat(subdivision)
	}
	return m
}

// buildInput constructs a minimal valid ScoreInput with the given number of measures.
func buildInput(title string, measureCount int) *score.ScoreInput {
	measures := make([]score.Measure, measureCount)
	for i := range measures {
		measures[i] = buildMeasure(4)
	}
	return &score.ScoreInput{Title: title, BPM: 120, Measures: measures}
}

// ---- tests -----------------------------------------------------------------

func TestService_CreateGet_RoundTrip(t *testing.T) {
	truncateScores(t)
	ctx := context.Background()
	svc := score.NewService(testPool)

	// Build a beat with specific hits so the round-trip verifies persistence.
	beat := buildBeat(4)
	beat.Steps[domain.PartBD][0] = int(domain.StepNormal)
	beat.Steps[domain.PartSnare][2] = int(domain.StepAccent)
	beat.Steps[domain.PartHH][0] = int(domain.StepNormal)
	beat.Steps[domain.PartHH][1] = int(domain.StepGhost)

	measure := score.Measure{beat, buildBeat(4), buildBeat(4), buildBeat(4)}
	in := &score.ScoreInput{Title: "Round Trip", BPM: 140, Measures: []score.Measure{measure, buildMeasure(4)}}

	created, err := svc.Create(ctx, in)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if created.Title != in.Title {
		t.Errorf("Title = %q, want %q", created.Title, in.Title)
	}
	if created.BPM != in.BPM {
		t.Errorf("BPM = %d, want %d", created.BPM, in.BPM)
	}
	if created.MeasuresCount != len(in.Measures) {
		t.Errorf("MeasuresCount = %d, want %d", created.MeasuresCount, len(in.Measures))
	}

	fetched, err := svc.Get(ctx, created.ID)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}

	if len(fetched.Measures) != len(in.Measures) {
		t.Fatalf("Measures count = %d, want %d", len(fetched.Measures), len(in.Measures))
	}
	firstBeat := fetched.Measures[0][0]
	if firstBeat.Subdivision != beat.Subdivision {
		t.Errorf("Subdivision = %d, want %d", firstBeat.Subdivision, beat.Subdivision)
	}
	if firstBeat.Steps[domain.PartBD][0] != int(domain.StepNormal) {
		t.Errorf("BD[0] = %d, want NORMAL(%d)", firstBeat.Steps[domain.PartBD][0], domain.StepNormal)
	}
	if firstBeat.Steps[domain.PartSnare][2] != int(domain.StepAccent) {
		t.Errorf("SNARE[2] = %d, want ACCENT(%d)", firstBeat.Steps[domain.PartSnare][2], domain.StepAccent)
	}
	if firstBeat.Steps[domain.PartHH][0] != int(domain.StepNormal) {
		t.Errorf("HH[0] = %d, want NORMAL(%d)", firstBeat.Steps[domain.PartHH][0], domain.StepNormal)
	}
	if firstBeat.Steps[domain.PartHH][1] != int(domain.StepGhost) {
		t.Errorf("HH[1] = %d, want GHOST(%d)", firstBeat.Steps[domain.PartHH][1], domain.StepGhost)
	}
	// Verify all OFF steps are actually 0.
	if firstBeat.Steps[domain.PartBD][1] != int(domain.StepOff) {
		t.Errorf("BD[1] = %d, want OFF(0)", firstBeat.Steps[domain.PartBD][1])
	}
}

func TestService_Update_ReplacesAllMeasures(t *testing.T) {
	truncateScores(t)
	ctx := context.Background()
	svc := score.NewService(testPool)

	original := buildInput("Before Update", 1)
	created, err := svc.Create(ctx, original)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	// Update with 3 measures of subdivision 6 to verify full replacement.
	updated := buildInput("After Update", 3)
	for i := range updated.Measures {
		updated.Measures[i] = buildMeasure(6)
	}
	updated.BPM = 200

	result, err := svc.Update(ctx, created.ID, updated)
	if err != nil {
		t.Fatalf("Update: %v", err)
	}

	if result.Title != updated.Title {
		t.Errorf("Title = %q, want %q", result.Title, updated.Title)
	}
	if result.BPM != updated.BPM {
		t.Errorf("BPM = %d, want %d", result.BPM, updated.BPM)
	}
	if result.MeasuresCount != 3 {
		t.Errorf("MeasuresCount = %d, want 3", result.MeasuresCount)
	}

	fetched, err := svc.Get(ctx, created.ID)
	if err != nil {
		t.Fatalf("Get after Update: %v", err)
	}
	if len(fetched.Measures) != 3 {
		t.Fatalf("Measures = %d, want 3 (old single measure must be gone)", len(fetched.Measures))
	}
	if fetched.Measures[0][0].Subdivision != 6 {
		t.Errorf("Subdivision = %d, want 6", fetched.Measures[0][0].Subdivision)
	}
}

func TestService_Delete_CascadesAndErrNotFound(t *testing.T) {
	truncateScores(t)
	ctx := context.Background()
	svc := score.NewService(testPool)

	// Add a hit to confirm cascade removes hits too.
	beat := buildBeat(4)
	beat.Steps[domain.PartBD][0] = int(domain.StepNormal)
	in := &score.ScoreInput{
		Title:    "To Be Deleted",
		BPM:      100,
		Measures: []score.Measure{{beat, buildBeat(4), buildBeat(4), buildBeat(4)}},
	}
	created, err := svc.Create(ctx, in)
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	if err := svc.Delete(ctx, created.ID); err != nil {
		t.Fatalf("Delete: %v", err)
	}

	_, err = svc.Get(ctx, created.ID)
	if !errors.Is(err, score.ErrNotFound) {
		t.Errorf("Get after Delete: got %v, want ErrNotFound", err)
	}

	// Verify no orphaned rows remain.
	var hitCount int
	row := testPool.QueryRow(ctx,
		"SELECT COUNT(*) FROM hits h JOIN beats b ON b.id = h.beat_id JOIN measures m ON m.id = b.measure_id WHERE m.score_id = $1",
		created.ID,
	)
	if err := row.Scan(&hitCount); err != nil {
		t.Fatalf("count hits: %v", err)
	}
	if hitCount != 0 {
		t.Errorf("hits after Delete = %d, want 0 (cascade failed)", hitCount)
	}
}

func TestService_Get_ErrNotFound(t *testing.T) {
	ctx := context.Background()
	svc := score.NewService(testPool)

	_, err := svc.Get(ctx, uuid.New())
	if !errors.Is(err, score.ErrNotFound) {
		t.Errorf("got %v, want ErrNotFound", err)
	}
}

func TestService_Update_ErrNotFound(t *testing.T) {
	ctx := context.Background()
	svc := score.NewService(testPool)

	_, err := svc.Update(ctx, uuid.New(), buildInput("Ghost", 1))
	if !errors.Is(err, score.ErrNotFound) {
		t.Errorf("got %v, want ErrNotFound", err)
	}
}

func TestService_Delete_ErrNotFound(t *testing.T) {
	ctx := context.Background()
	svc := score.NewService(testPool)

	err := svc.Delete(ctx, uuid.New())
	if !errors.Is(err, score.ErrNotFound) {
		t.Errorf("got %v, want ErrNotFound", err)
	}
}

func TestService_Create_RejectsInvalidInput(t *testing.T) {
	ctx := context.Background()
	svc := score.NewService(testPool)

	cases := []struct {
		name   string
		mutate func(*score.ScoreInput)
	}{
		{"empty title", func(in *score.ScoreInput) { in.Title = "" }},
		{"bpm zero", func(in *score.ScoreInput) { in.BPM = 0 }},
		{"bpm too high", func(in *score.ScoreInput) { in.BPM = 9999 }},
		{"no measures", func(in *score.ScoreInput) { in.Measures = nil }},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			in := buildInput("Valid Title", 1)
			c.mutate(in)
			_, err := svc.Create(ctx, in)
			if !errors.Is(err, score.ErrValidation) {
				t.Errorf("Create(%s): got %v, want ErrValidation", c.name, err)
			}
		})
	}
}

func TestService_List_PaginatesAndSetsPreview(t *testing.T) {
	truncateScores(t)
	ctx := context.Background()
	svc := score.NewService(testPool)

	// Create 3 scores: the first beat of score A has a known hit to verify preview.
	beatWithHit := buildBeat(4)
	beatWithHit.Steps[domain.PartBD][0] = int(domain.StepNormal)
	previewMeasure := score.Measure{beatWithHit, buildBeat(4), buildBeat(4), buildBeat(4)}

	scoreA, err := svc.Create(ctx, &score.ScoreInput{
		Title:    "Score A",
		BPM:      120,
		Measures: []score.Measure{previewMeasure, buildMeasure(4)},
	})
	if err != nil {
		t.Fatalf("Create A: %v", err)
	}
	_, err = svc.Create(ctx, buildInput("Score B", 1))
	if err != nil {
		t.Fatalf("Create B: %v", err)
	}
	_, err = svc.Create(ctx, buildInput("Score C", 3))
	if err != nil {
		t.Fatalf("Create C: %v", err)
	}

	// Page 1: maxItems=2, offset=0 → 2 results.
	page1, err := svc.List(ctx, 2, 0)
	if err != nil {
		t.Fatalf("List page1: %v", err)
	}
	if len(page1) != 2 {
		t.Errorf("page1 len = %d, want 2", len(page1))
	}

	// Page 2: maxItems=2, offset=2 → 1 result.
	page2, err := svc.List(ctx, 2, 2)
	if err != nil {
		t.Fatalf("List page2: %v", err)
	}
	if len(page2) != 1 {
		t.Errorf("page2 len = %d, want 1", len(page2))
	}

	// Locate Score A in the combined results and verify its summary fields.
	all := append(page1, page2...)
	var summaryA *score.ScoreSummary
	for i := range all {
		if all[i].ID == scoreA.ID {
			summaryA = &all[i]
			break
		}
	}
	if summaryA == nil {
		t.Fatal("Score A not found in List results")
	}
	if summaryA.MeasuresCount != 2 {
		t.Errorf("MeasuresCount = %d, want 2", summaryA.MeasuresCount)
	}
	if len(summaryA.PreviewMeasure) == 0 {
		t.Fatal("PreviewMeasure is empty")
	}
	if summaryA.PreviewMeasure[0].Steps[domain.PartBD][0] != int(domain.StepNormal) {
		t.Errorf("PreviewMeasure BD[0] = %d, want NORMAL(%d)",
			summaryA.PreviewMeasure[0].Steps[domain.PartBD][0], domain.StepNormal)
	}
}

func TestService_List_EmptyReturnsSlice(t *testing.T) {
	truncateScores(t)
	ctx := context.Background()
	svc := score.NewService(testPool)

	results, err := svc.List(ctx, 10, 0)
	if err != nil {
		t.Fatalf("List on empty DB: %v", err)
	}
	if results == nil {
		t.Error("List returned nil, want empty slice")
	}
	if len(results) != 0 {
		t.Errorf("len = %d, want 0", len(results))
	}
}

func TestExtractGooseUpSQL(t *testing.T) {
	cases := []struct {
		name    string
		content string
		want    string
	}{
		{
			name: "single statement block",
			content: `-- +goose Up
-- +goose StatementBegin
CREATE TABLE a (id int);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE a;
-- +goose StatementEnd
`,
			want: "CREATE TABLE a (id int);",
		},
		{
			name: "multiple statement blocks in Up",
			content: `-- +goose Up
-- +goose StatementBegin
CREATE TABLE a (id int);
-- +goose StatementEnd

-- +goose StatementBegin
CREATE TABLE b (id int);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE b;
-- +goose StatementEnd
-- +goose StatementBegin
DROP TABLE a;
-- +goose StatementEnd
`,
			want: "CREATE TABLE a (id int);\n;\nCREATE TABLE b (id int);",
		},
		{
			name: "no statement markers returns Up section",
			content: `-- +goose Up
CREATE TABLE a (id int);

-- +goose Down
DROP TABLE a;
`,
			want: "CREATE TABLE a (id int);",
		},
		{
			name: "Down statement blocks are not included",
			content: `-- +goose Up
-- +goose StatementBegin
CREATE TABLE a (id int);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE a;
-- +goose StatementEnd
`,
			want: "CREATE TABLE a (id int);",
		},
		{
			name: "StatementBegin without StatementEnd consumes rest of Up section",
			content: `-- +goose Up
-- +goose StatementBegin
CREATE TABLE a (id int);

-- +goose Down
-- +goose StatementBegin
DROP TABLE a;
-- +goose StatementEnd
`,
			want: "CREATE TABLE a (id int);",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := extractGooseUpSQL(tc.content)
			if got != tc.want {
				t.Errorf("extractGooseUpSQL() =\n%q\nwant\n%q", got, tc.want)
			}
		})
	}
}
