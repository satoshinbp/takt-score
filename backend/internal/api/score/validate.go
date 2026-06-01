package score

import (
	"errors"
	"fmt"
	"regexp"

	"github.com/shinyasato/takt-score/backend/internal/domain"
)

// Spotify track IDs are base62 strings of exactly 22 characters. Validating
// against this format rejects malformed IDs at the API boundary, before they
// can be persisted and later surface as a 404 at playback time.
var spotifyTrackIDPattern = regexp.MustCompile(`^[A-Za-z0-9]{22}$`)

// ErrValidation wraps every error returned by ValidateInput so handlers can
// distinguish bad-request input from internal failures.
var ErrValidation = errors.New("validation failed")

// ValidateInput enforces the same invariants as the previous Pydantic schema:
// title length, BPM range, fixed beats-per-measure, valid subdivision,
// every PartID present in steps, array lengths equal to subdivision,
// and step / ornament values in the allowed integer range. Every returned
// error wraps ErrValidation.
func ValidateInput(in *ScoreInput) error {
	if err := validateAll(in); err != nil {
		return errors.Join(ErrValidation, err)
	}
	return nil
}

func validateAll(in *ScoreInput) error {
	if l := len(in.Title); l < 1 || l > domain.MaxTitleLen {
		return fmt.Errorf("title length %d not in [1,%d]", l, domain.MaxTitleLen)
	}
	if in.BPM < domain.MinBPM || in.BPM > domain.MaxBPM {
		return fmt.Errorf("bpm %d not in [%d,%d]", in.BPM, domain.MinBPM, domain.MaxBPM)
	}
	if in.SpotifyTrackID != nil && !spotifyTrackIDPattern.MatchString(*in.SpotifyTrackID) {
		return fmt.Errorf("spotifyTrackId %q is not a valid Spotify track ID (expected 22 base62 chars)", *in.SpotifyTrackID)
	}
	if len(in.Measures) == 0 {
		return fmt.Errorf("measures must contain at least one measure")
	}
	for mi, measure := range in.Measures {
		if err := validateMeasure(measure); err != nil {
			return fmt.Errorf("measure[%d]: %w", mi, err)
		}
	}
	return nil
}

func validateMeasure(m Measure) error {
	if len(m) != domain.BeatsPerMeasure {
		return fmt.Errorf("expected %d beats, got %d", domain.BeatsPerMeasure, len(m))
	}
	for bi, beat := range m {
		if err := validateBeat(beat); err != nil {
			return fmt.Errorf("beat[%d]: %w", bi, err)
		}
	}
	return nil
}

func validateBeat(b Beat) error {
	if !domain.IsValidSubdivision(b.Subdivision) {
		return fmt.Errorf("subdivision %d not in {3,4,6}", b.Subdivision)
	}
	if err := validateStepMap(b.Steps, b.Subdivision, "steps", true); err != nil {
		return err
	}
	if b.Ornaments != nil {
		if err := validateStepMap(b.Ornaments, b.Subdivision, "ornaments", false); err != nil {
			return err
		}
		// An ornament is a decoration on a played note; it has no meaning on an
		// OFF step and cannot be persisted (hits row keyed by step_index).
		for part, orns := range b.Ornaments {
			steps, ok := b.Steps[part]
			if !ok {
				continue
			}
			for i, o := range orns {
				if o != int(domain.OrnamentNone) && i < len(steps) && steps[i] == int(domain.StepOff) {
					return fmt.Errorf("ornaments[%s][%d] is %d but the underlying step is OFF", part, i, o)
				}
			}
		}
	}
	return nil
}

// validateStepMap checks that the map covers every PartID (when requireAll),
// has no unknown keys, and that each slice length equals subdivision with
// values in [0,3].
func validateStepMap(m map[domain.PartID][]int, subdivision int, label string, requireAll bool) error {
	if requireAll {
		for _, p := range domain.PartIDs {
			if _, ok := m[p]; !ok {
				return fmt.Errorf("%s missing key %s", label, p)
			}
		}
	}
	for part, values := range m {
		if !domain.IsValidPartID(string(part)) {
			return fmt.Errorf("%s has unknown part %q", label, part)
		}
		if len(values) != subdivision {
			return fmt.Errorf("%s[%s] length %d != subdivision %d", label, part, len(values), subdivision)
		}
		for i, v := range values {
			if v < 0 || v > 3 {
				return fmt.Errorf("%s[%s][%d] value %d out of [0,3]", label, part, i, v)
			}
		}
	}
	return nil
}
