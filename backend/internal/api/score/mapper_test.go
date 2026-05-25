package score

import (
	"testing"

	"github.com/google/uuid"
	"github.com/shinyasato/takt-score/backend/internal/domain"
	"github.com/shinyasato/takt-score/backend/internal/store"
)

func TestAssembleMeasures_BuildsCompleteGrid(t *testing.T) {
	measureID := uuid.New()
	beatID := uuid.New()

	measures := []store.Measure{
		{ID: measureID, ScoreID: uuid.New(), Position: 0},
	}
	beats := []store.Beat{
		{ID: beatID, MeasureID: measureID, Position: 0, Subdivision: 4},
	}
	flam := store.OrnamentFLAM
	hits := []store.Hit{
		{BeatID: beatID, PartID: store.PartID(domain.PartBD), StepIndex: 0, Velocity: store.VelocityNORMAL},
		{BeatID: beatID, PartID: store.PartID(domain.PartSnare), StepIndex: 2, Velocity: store.VelocityACCENT, Ornament: &flam},
	}

	out := assembleMeasures(measures, beats, hits)
	if len(out) != 1 || len(out[0]) != 1 {
		t.Fatalf("expected 1 measure with 1 beat, got %#v", out)
	}
	beat := out[0][0]
	if beat.Subdivision != 4 {
		t.Errorf("subdivision = %d, want 4", beat.Subdivision)
	}
	// Every PartID is present with subdivision-length slice.
	for _, p := range domain.PartIDs {
		if got := len(beat.Steps[p]); got != 4 {
			t.Errorf("steps[%s] length = %d, want 4", p, got)
		}
	}
	if beat.Steps[domain.PartBD][0] != int(domain.StepNormal) {
		t.Errorf("BD[0] = %d, want %d", beat.Steps[domain.PartBD][0], domain.StepNormal)
	}
	if beat.Steps[domain.PartSnare][2] != int(domain.StepAccent) {
		t.Errorf("SNARE[2] = %d, want %d", beat.Steps[domain.PartSnare][2], domain.StepAccent)
	}
	if beat.Ornaments == nil {
		t.Fatal("expected ornaments map to be populated when a hit has an ornament")
	}
	if beat.Ornaments[domain.PartSnare][2] != int(domain.OrnamentFlam) {
		t.Errorf("ornaments[SNARE][2] = %d, want %d",
			beat.Ornaments[domain.PartSnare][2], domain.OrnamentFlam)
	}
	if beat.Ornaments[domain.PartBD][0] != int(domain.OrnamentNone) {
		t.Errorf("ornaments[BD][0] = %d, want %d (NONE)",
			beat.Ornaments[domain.PartBD][0], domain.OrnamentNone)
	}
}

func TestAssembleMeasures_NoHits_OmitsOrnaments(t *testing.T) {
	measureID := uuid.New()
	beatID := uuid.New()
	out := assembleMeasures(
		[]store.Measure{{ID: measureID, Position: 0}},
		[]store.Beat{{ID: beatID, MeasureID: measureID, Position: 0, Subdivision: 3}},
		nil,
	)
	if out[0][0].Ornaments != nil {
		t.Errorf("ornaments should be nil when no hit carries an ornament")
	}
	if len(out[0][0].Steps[domain.PartHH]) != 3 {
		t.Errorf("steps slice should match subdivision 3")
	}
}

func TestStepValueRoundTrip(t *testing.T) {
	cases := []domain.Step{domain.StepNormal, domain.StepAccent, domain.StepGhost}
	for _, want := range cases {
		v, ok := velocityFromStepValue(int(want))
		if !ok {
			t.Fatalf("velocityFromStepValue(%d) returned !ok", want)
		}
		got := stepValueFromVelocity(v)
		if domain.Step(got) != want {
			t.Errorf("round-trip step %d -> %s -> %d", want, v, got)
		}
	}
}

func TestOrnamentValueRoundTrip(t *testing.T) {
	cases := []domain.Ornament{domain.OrnamentFlam, domain.OrnamentDrag, domain.OrnamentRuff}
	for _, want := range cases {
		enum, ok := ornamentEnumFromValue(int(want))
		if !ok || enum == nil {
			t.Fatalf("ornamentEnumFromValue(%d) returned (%v, %v)", want, enum, ok)
		}
		got := ornamentValueFromEnum(enum)
		if domain.Ornament(got) != want {
			t.Errorf("round-trip ornament %d -> %v -> %d", want, *enum, got)
		}
	}
	// NONE maps to nil (no row persisted).
	enum, ok := ornamentEnumFromValue(int(domain.OrnamentNone))
	if !ok || enum != nil {
		t.Errorf("OrnamentNone should map to (nil, true), got (%v, %v)", enum, ok)
	}
}
