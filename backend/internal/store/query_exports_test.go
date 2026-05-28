package store

import (
	"strings"
	"testing"
)

// TestInsertHitSQL_Shape pins the shape of the re-exported InsertHit
// statement so that an unintended sqlc regeneration (e.g. column added,
// removed, or reordered) shows up as a test failure instead of a silent
// argument-order drift against flushHitBatch in the score service.
func TestInsertHitSQL_Shape(t *testing.T) {
	sql := InsertHitSQL

	if !strings.Contains(sql, "INSERT INTO hits") {
		t.Fatalf("InsertHitSQL no longer targets hits: %q", sql)
	}

	wantCols := "(beat_id, part_id, step_index, velocity, ornament)"
	if !strings.Contains(sql, wantCols) {
		t.Fatalf("InsertHitSQL column list drifted; want %q in %q", wantCols, sql)
	}

	wantPlaceholders := "VALUES ($1, $2, $3, $4, $5)"
	if !strings.Contains(sql, wantPlaceholders) {
		t.Fatalf("InsertHitSQL placeholders drifted; want %q in %q", wantPlaceholders, sql)
	}
}
