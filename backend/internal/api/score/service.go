package score

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shinyasato/takt-score/backend/internal/domain"
	"github.com/shinyasato/takt-score/backend/internal/store"
)

var ErrNotFound = errors.New("score not found")

type Service struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service { return &Service{pool: pool} }

func (s *Service) Get(ctx context.Context, id uuid.UUID) (*ScoreDetail, error) {
	q := store.New(s.pool)
	sc, err := q.GetScore(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return loadDetail(ctx, q, sc)
}

func (s *Service) List(ctx context.Context, maxItems, offset int) ([]ScoreSummary, error) {
	q := store.New(s.pool)
	scores, err := q.ListScores(ctx, store.ListScoresParams{
		Limit:  int32(maxItems),
		Offset: int32(offset),
	})
	if err != nil {
		return nil, err
	}
	if len(scores) == 0 {
		return []ScoreSummary{}, nil
	}

	scoreIDs := make([]uuid.UUID, len(scores))
	for i, sc := range scores {
		scoreIDs[i] = sc.ID
	}

	counts, err := q.CountMeasuresForScores(ctx, scoreIDs)
	if err != nil {
		return nil, err
	}
	countByScore := make(map[uuid.UUID]int, len(counts))
	for _, c := range counts {
		countByScore[c.ScoreID] = int(c.MeasuresCount)
	}

	firstMeasures, err := q.ListFirstMeasureForScores(ctx, scoreIDs)
	if err != nil {
		return nil, err
	}
	measureByScore := make(map[uuid.UUID]store.Measure, len(firstMeasures))
	measureIDs := make([]uuid.UUID, 0, len(firstMeasures))
	for _, m := range firstMeasures {
		measureByScore[m.ScoreID] = m
		measureIDs = append(measureIDs, m.ID)
	}

	var beats []store.Beat
	var hits []store.Hit
	if len(measureIDs) > 0 {
		beats, err = q.ListBeatsByMeasureIDs(ctx, measureIDs)
		if err != nil {
			return nil, err
		}
		beatIDs := make([]uuid.UUID, len(beats))
		for i, b := range beats {
			beatIDs[i] = b.ID
		}
		hits, err = q.ListHitsByBeatIDs(ctx, beatIDs)
		if err != nil {
			return nil, err
		}
	}

	out := make([]ScoreSummary, 0, len(scores))
	for _, sc := range scores {
		var preview Measure
		if m, ok := measureByScore[sc.ID]; ok {
			// assembleMeasures groups by measure ID, so passing all beats/hits is
			// fine — only the matching measure's rows are picked up.
			assembled := assembleMeasures([]store.Measure{m}, beats, hits)
			if len(assembled) > 0 && len(assembled[0]) > 0 {
				preview = assembled[0]
			}
		}
		out = append(out, summaryFromScore(sc, countByScore[sc.ID], preview))
	}
	return out, nil
}

func (s *Service) Create(ctx context.Context, in *ScoreInput) (*ScoreDetail, error) {
	if err := ValidateInput(in); err != nil {
		return nil, err
	}
	scoreID, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()

	err = pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		q := store.New(tx)
		if err := q.CreateScore(ctx, store.CreateScoreParams{
			ID:        scoreID,
			Title:     in.Title,
			Bpm:       int16(in.BPM),
			CreatedAt: tsFromTime(now),
			UpdatedAt: tsFromTime(now),
		}); err != nil {
			return err
		}
		return insertMeasures(ctx, q, scoreID, in.Measures)
	})
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, scoreID)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, in *ScoreInput) (*ScoreDetail, error) {
	if err := ValidateInput(in); err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	err := pgx.BeginFunc(ctx, s.pool, func(tx pgx.Tx) error {
		q := store.New(tx)
		affected, err := q.UpdateScoreMeta(ctx, store.UpdateScoreMetaParams{
			ID:        id,
			Title:     in.Title,
			Bpm:       int16(in.BPM),
			UpdatedAt: tsFromTime(now),
		})
		if err != nil {
			return err
		}
		if affected == 0 {
			return ErrNotFound
		}
		// Cascade through measures -> beats -> hits, then re-insert.
		if err := q.DeleteMeasuresByScore(ctx, id); err != nil {
			return err
		}
		return insertMeasures(ctx, q, id, in.Measures)
	})
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, id)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	q := store.New(s.pool)
	affected, err := q.DeleteScore(ctx, id)
	if err != nil {
		return err
	}
	if affected == 0 {
		return ErrNotFound
	}
	return nil
}

func loadDetail(ctx context.Context, q *store.Queries, sc store.Score) (*ScoreDetail, error) {
	measures, err := q.ListMeasuresByScore(ctx, sc.ID)
	if err != nil {
		return nil, err
	}
	measureIDs := make([]uuid.UUID, len(measures))
	for i, m := range measures {
		measureIDs[i] = m.ID
	}
	var beats []store.Beat
	var hits []store.Hit
	if len(measureIDs) > 0 {
		beats, err = q.ListBeatsByMeasureIDs(ctx, measureIDs)
		if err != nil {
			return nil, err
		}
		beatIDs := make([]uuid.UUID, len(beats))
		for i, b := range beats {
			beatIDs[i] = b.ID
		}
		hits, err = q.ListHitsByBeatIDs(ctx, beatIDs)
		if err != nil {
			return nil, err
		}
	}

	measuresOut := assembleMeasures(measures, beats, hits)
	var preview Measure
	if len(measuresOut) > 0 && len(measuresOut[0]) > 0 {
		preview = measuresOut[0]
	}
	summary := summaryFromScore(sc, len(measuresOut), preview)
	return &ScoreDetail{ScoreSummary: summary, Measures: measuresOut}, nil
}

func summaryFromScore(sc store.Score, count int, preview Measure) ScoreSummary {
	return ScoreSummary{
		ID:             sc.ID,
		Title:          sc.Title,
		BPM:            int(sc.Bpm),
		PreviewMeasure: preview,
		MeasuresCount:  count,
		CreatedAt:      sc.CreatedAt.Time,
		UpdatedAt:      sc.UpdatedAt.Time,
	}
}

// InsertMeasuresForSeed exposes insertMeasures to the seed CLI so it can reuse
// the same Measure/Beat/Hit insertion logic against its own transaction.
// Production code paths should go through Service methods instead.
func InsertMeasuresForSeed(ctx context.Context, q *store.Queries, scoreID uuid.UUID, measures []Measure) error {
	return insertMeasures(ctx, q, scoreID, measures)
}

// insertMeasures writes the full nested Measure/Beat/Hit graph for a score.
// Caller must ensure the score row already exists and is in the same tx.
func insertMeasures(ctx context.Context, q *store.Queries, scoreID uuid.UUID, measures []Measure) error {
	for mi, m := range measures {
		mID, err := uuid.NewV7()
		if err != nil {
			return err
		}
		if err := q.CreateMeasure(ctx, store.CreateMeasureParams{
			ID:       mID,
			ScoreID:  scoreID,
			Position: int16(mi),
		}); err != nil {
			return err
		}
		for bi, b := range m {
			bID, err := uuid.NewV7()
			if err != nil {
				return err
			}
			if err := q.CreateBeat(ctx, store.CreateBeatParams{
				ID:          bID,
				MeasureID:   mID,
				Position:    int16(bi),
				Subdivision: int16(b.Subdivision),
			}); err != nil {
				return err
			}
			if err := insertHits(ctx, q, bID, b); err != nil {
				return err
			}
		}
	}
	return nil
}

func insertHits(ctx context.Context, q *store.Queries, beatID uuid.UUID, b Beat) error {
	for _, part := range domain.PartIDs {
		steps := b.Steps[part]
		var orns []int
		if b.Ornaments != nil {
			orns = b.Ornaments[part]
		}
		for i, v := range steps {
			if domain.Step(v) == domain.StepOff {
				continue
			}
			vel, ok := velocityFromStepValue(v)
			if !ok {
				return fmt.Errorf("invalid step value %d for %s[%d]", v, part, i)
			}
			var orn *store.Ornament
			if i < len(orns) {
				o, ok := ornamentEnumFromValue(orns[i])
				if !ok {
					return fmt.Errorf("invalid ornament value %d for %s[%d]", orns[i], part, i)
				}
				orn = o
			}
			if err := q.InsertHit(ctx, store.InsertHitParams{
				BeatID:    beatID,
				PartID:    store.PartID(part),
				StepIndex: int16(i),
				Velocity:  vel,
				Ornament:  orn,
			}); err != nil {
				return err
			}
		}
	}
	return nil
}

func tsFromTime(t time.Time) pgtype.Timestamptz {
	return pgtype.Timestamptz{Time: t, Valid: true}
}
