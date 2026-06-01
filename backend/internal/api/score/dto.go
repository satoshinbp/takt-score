package score

import (
	"time"

	"github.com/google/uuid"
	"github.com/shinyasato/takt-score/backend/internal/domain"
)

// Beat is the wire-format representation of a single beat within a measure.
// A nil-or-omitted Ornaments map signals every step is OrnamentNone.
type Beat struct {
	Subdivision int                       `json:"subdivision"`
	Steps       map[domain.PartID][]int   `json:"steps"`
	Ornaments   map[domain.PartID][]int   `json:"ornaments,omitempty"`
}

// Measure is the wire-format representation of one measure. Always
// domain.BeatsPerMeasure beats long.
type Measure []Beat

type ScoreSummary struct {
	ID             uuid.UUID `json:"id"`
	Title          string    `json:"title"`
	BPM            int       `json:"bpm"`
	SpotifyTrackID *string   `json:"spotifyTrackId"`
	PreviewMeasure Measure   `json:"previewMeasure"`
	MeasuresCount  int       `json:"measuresCount"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

type ScoreDetail struct {
	ScoreSummary
	Measures []Measure `json:"measures"`
}

// ScoreInput is the wire format for POST/PUT request bodies.
type ScoreInput struct {
	Title          string    `json:"title"`
	BPM            int       `json:"bpm"`
	SpotifyTrackID *string   `json:"spotifyTrackId,omitempty"`
	Measures       []Measure `json:"measures"`
}
