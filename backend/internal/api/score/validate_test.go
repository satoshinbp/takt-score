package score

import (
	"errors"
	"testing"

	"github.com/shinyasato/takt-score/backend/internal/domain"
)

func validBeat() Beat {
	steps := make(map[domain.PartID][]int, len(domain.PartIDs))
	for _, p := range domain.PartIDs {
		steps[p] = []int{0, 0, 0, 0}
	}
	return Beat{Subdivision: 4, Steps: steps}
}

func validMeasure() Measure {
	return Measure{validBeat(), validBeat(), validBeat(), validBeat()}
}

func validInput() *ScoreInput {
	return &ScoreInput{Title: "T", BPM: 120, Measures: []Measure{validMeasure()}}
}

func TestValidateInput_OK(t *testing.T) {
	if err := ValidateInput(validInput()); err != nil {
		t.Fatalf("valid input rejected: %v", err)
	}
}

func TestValidateInput_AllErrorsWrapErrValidation(t *testing.T) {
	cases := []struct {
		name  string
		mutate func(*ScoreInput)
	}{
		{"empty title", func(in *ScoreInput) { in.Title = "" }},
		{"bpm too low", func(in *ScoreInput) { in.BPM = 0 }},
		{"bpm too high", func(in *ScoreInput) { in.BPM = 9999 }},
		{"no measures", func(in *ScoreInput) { in.Measures = nil }},
		{"bad subdivision", func(in *ScoreInput) { in.Measures[0][0].Subdivision = 5 }},
		{"missing part", func(in *ScoreInput) {
			delete(in.Measures[0][0].Steps, domain.PartBD)
		}},
		{"step out of range", func(in *ScoreInput) {
			in.Measures[0][0].Steps[domain.PartHH] = []int{0, 0, 0, 4}
		}},
		{"length mismatches subdivision", func(in *ScoreInput) {
			in.Measures[0][0].Steps[domain.PartHH] = []int{0, 0, 0}
		}},
		{"wrong number of beats", func(in *ScoreInput) {
			in.Measures[0] = Measure{validBeat()}
		}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			in := validInput()
			c.mutate(in)
			err := ValidateInput(in)
			if err == nil {
				t.Fatal("expected error, got nil")
			}
			if !errors.Is(err, ErrValidation) {
				t.Errorf("error %v does not wrap ErrValidation", err)
			}
		})
	}
}
