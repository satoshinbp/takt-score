package score

import (
	"github.com/google/uuid"
	"github.com/shinyasato/takt-score/backend/internal/domain"
	"github.com/shinyasato/takt-score/backend/internal/store"
)

// stepValueFromVelocity maps the DB enum to the wire-format integer.
// OFF (= 0) never appears here because OFF steps are not persisted.
func stepValueFromVelocity(v store.Velocity) int {
	switch v {
	case store.VelocityNORMAL:
		return int(domain.StepNormal)
	case store.VelocityACCENT:
		return int(domain.StepAccent)
	case store.VelocityGHOST:
		return int(domain.StepGhost)
	}
	return int(domain.StepOff)
}

func velocityFromStepValue(v int) (store.Velocity, bool) {
	switch domain.Step(v) {
	case domain.StepNormal:
		return store.VelocityNORMAL, true
	case domain.StepAccent:
		return store.VelocityACCENT, true
	case domain.StepGhost:
		return store.VelocityGHOST, true
	}
	return "", false
}

func ornamentValueFromEnum(o *store.Ornament) int {
	if o == nil {
		return int(domain.OrnamentNone)
	}
	switch *o {
	case store.OrnamentFLAM:
		return int(domain.OrnamentFlam)
	case store.OrnamentDRAG:
		return int(domain.OrnamentDrag)
	case store.OrnamentRUFF:
		return int(domain.OrnamentRuff)
	}
	return int(domain.OrnamentNone)
}

func ornamentEnumFromValue(v int) (*store.Ornament, bool) {
	var o store.Ornament
	switch domain.Ornament(v) {
	case domain.OrnamentNone:
		return nil, true
	case domain.OrnamentFlam:
		o = store.OrnamentFLAM
	case domain.OrnamentDrag:
		o = store.OrnamentDRAG
	case domain.OrnamentRuff:
		o = store.OrnamentRUFF
	default:
		return nil, false
	}
	return &o, true
}

// emptyBeat builds a wire-format Beat with every PartID present and all
// steps set to OFF, ready for hits to be layered on top.
func emptyBeat(subdivision int) Beat {
	steps := make(map[domain.PartID][]int, len(domain.PartIDs))
	for _, p := range domain.PartIDs {
		steps[p] = make([]int, subdivision)
	}
	return Beat{Subdivision: subdivision, Steps: steps}
}

// assembleMeasures stitches flat DB rows back into the nested wire format.
// Inputs are assumed to belong to the same score.
func assembleMeasures(
	measureRows []store.Measure,
	beatRows []store.Beat,
	hitRows []store.Hit,
) []Measure {
	// Group beats by measure_id while preserving the existing sort by position.
	beatsByMeasure := make(map[uuid.UUID][]store.Beat, len(measureRows))
	for _, b := range beatRows {
		beatsByMeasure[b.MeasureID] = append(beatsByMeasure[b.MeasureID], b)
	}
	hitsByBeat := make(map[uuid.UUID][]store.Hit, len(beatRows))
	for _, h := range hitRows {
		hitsByBeat[h.BeatID] = append(hitsByBeat[h.BeatID], h)
	}

	out := make([]Measure, 0, len(measureRows))
	for _, m := range measureRows {
		beats := beatsByMeasure[m.ID]
		measure := make(Measure, 0, domain.BeatsPerMeasure)
		for _, b := range beats {
			beat := emptyBeat(int(b.Subdivision))
			for _, h := range hitsByBeat[b.ID] {
				partID := domain.PartID(h.PartID)
				if _, ok := beat.Steps[partID]; !ok {
					continue
				}
				if int(h.StepIndex) >= int(b.Subdivision) {
					continue
				}
				beat.Steps[partID][h.StepIndex] = stepValueFromVelocity(h.Velocity)
				if h.Ornament != nil {
					if beat.Ornaments == nil {
						beat.Ornaments = make(map[domain.PartID][]int, len(domain.PartIDs))
						for _, p := range domain.PartIDs {
							beat.Ornaments[p] = make([]int, b.Subdivision)
						}
					}
					beat.Ornaments[partID][h.StepIndex] = ornamentValueFromEnum(h.Ornament)
				}
			}
			measure = append(measure, beat)
		}
		out = append(out, measure)
	}
	return out
}
