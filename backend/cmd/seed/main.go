// Seeds the database from seeds/scores.json. Idempotent: titles already
// present are skipped. UUIDs are generated fresh on insert (the seed file's
// legacy string IDs are ignored).
package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	scoreapi "github.com/shinyasato/takt-score/backend/internal/api/score"
	"github.com/shinyasato/takt-score/backend/internal/config"
	"github.com/shinyasato/takt-score/backend/internal/db"
	"github.com/shinyasato/takt-score/backend/internal/store"
)

type seedEntry struct {
	Title     string             `json:"title"`
	BPM       int                `json:"bpm"`
	Measures  []scoreapi.Measure `json:"measures"`
	CreatedAt int64              `json:"createdAt"`
	UpdatedAt int64              `json:"updatedAt"`
}

func main() {
	log := slog.New(slog.NewTextHandler(os.Stdout, nil))

	seedPath := flag.String("file", "seeds/scores.json", "path to seed JSON")
	flag.Parse()

	cfg, err := config.Load()
	if err != nil {
		fail(log, "config load", err)
	}

	absPath, err := filepath.Abs(*seedPath)
	if err != nil {
		fail(log, "resolve seed path", err)
	}
	raw, err := os.ReadFile(absPath)
	if err != nil {
		fail(log, "read seed file", err)
	}
	var entries []seedEntry
	if err := json.Unmarshal(raw, &entries); err != nil {
		fail(log, "parse seed file", err)
	}

	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		fail(log, "db connect", err)
	}
	defer pool.Close()

	q := store.New(pool)
	inserted := 0
	for _, e := range entries {
		input := &scoreapi.ScoreInput{Title: e.Title, BPM: e.BPM, Measures: e.Measures}
		if err := scoreapi.ValidateInput(input); err != nil {
			fail(log, fmt.Sprintf("validate %q", e.Title), err)
		}

		_, err := q.FindScoreIDByTitle(ctx, e.Title)
		if err == nil {
			log.Info("seed skip (exists)", "title", e.Title)
			continue
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			fail(log, "lookup by title", err)
		}

		scoreID, err := uuid.NewV7()
		if err != nil {
			fail(log, "uuid", err)
		}
		createdAt := timeFromMs(e.CreatedAt)
		updatedAt := timeFromMs(e.UpdatedAt)

		err = pgx.BeginFunc(ctx, pool, func(tx pgx.Tx) error {
			tq := store.New(tx)
			if err := tq.CreateScore(ctx, store.CreateScoreParams{
				ID:        scoreID,
				Title:     e.Title,
				Bpm:       int16(e.BPM),
				CreatedAt: pgtype.Timestamptz{Time: createdAt, Valid: true},
				UpdatedAt: pgtype.Timestamptz{Time: updatedAt, Valid: true},
			}); err != nil {
				return err
			}
			return scoreapi.InsertMeasuresForSeed(ctx, tq, scoreID, e.Measures)
		})
		if err != nil {
			fail(log, fmt.Sprintf("insert %q", e.Title), err)
		}
		inserted++
		log.Info("seed insert", "title", e.Title, "id", scoreID)
	}
	log.Info("seed done", "inserted", inserted, "total", len(entries))
}

func timeFromMs(ms int64) time.Time {
	if ms == 0 {
		return time.Now().UTC()
	}
	return time.UnixMilli(ms).UTC()
}

func fail(log *slog.Logger, msg string, err error) {
	log.Error(msg, "err", err)
	os.Exit(1)
}
