// Package domain mirrors the typed constants defined in
// frontend/src/lib/constants.ts. Keep the two in sync when changing values.
package domain

const (
	BeatsPerMeasure       = 4
	MinBPM                = 1
	MaxBPM                = 400
	MaxTitleLen           = 200
	MaxSpotifyTrackIDLen  = 64
)

type PartID string

const (
	PartCrash  PartID = "CRASH"
	PartRide   PartID = "RIDE"
	PartHHOpen PartID = "HH_OPEN"
	PartHH     PartID = "HH"
	PartHiTom  PartID = "HI_TOM"
	PartMidTom PartID = "MID_TOM"
	PartSnare  PartID = "SNARE"
	PartLoTom  PartID = "LO_TOM"
	PartBD     PartID = "BD"
)

// PartIDs lists every PartID in display order. Order matches PART_IDS in
// frontend/src/lib/constants.ts.
var PartIDs = [...]PartID{
	PartCrash, PartRide, PartHHOpen, PartHH,
	PartHiTom, PartMidTom, PartSnare, PartLoTom, PartBD,
}

func IsValidPartID(s string) bool {
	for _, p := range PartIDs {
		if string(p) == s {
			return true
		}
	}
	return false
}

// Subdivision counts equal-length steps within a single beat.
type Subdivision int16

const (
	SubdivSixteenth Subdivision = 4 // straight sixteenth notes
	SubdivTriplet   Subdivision = 3 // eighth-note triplet
	SubdivSextuplet Subdivision = 6 // sixteenth-note triplet
)

func IsValidSubdivision(n int) bool {
	return n == 3 || n == 4 || n == 6
}

// Step encodes the wire-format integer for a single grid cell.
// Matches STEP in frontend/src/lib/constants.ts.
type Step int

const (
	StepOff    Step = 0
	StepNormal Step = 1
	StepAccent Step = 2
	StepGhost  Step = 3
)

// Ornament encodes the wire-format integer for an optional decoration on a step.
// Matches ORNAMENT in frontend/src/lib/constants.ts.
type Ornament int

const (
	OrnamentNone Ornament = 0
	OrnamentFlam Ornament = 1
	OrnamentDrag Ornament = 2
	OrnamentRuff Ornament = 3
)
