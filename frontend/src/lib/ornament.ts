import type { PartId } from "@/lib/constants";
import { ORNAMENT, PART_IDS } from "@/lib/constants";
import type { Beat } from "@/types/common";

export const readOrnament = (
  beat: Beat,
  partId: PartId,
  stepIdx: number,
): number => beat.ornaments?.[partId]?.[stepIdx] ?? ORNAMENT.NONE;

// If every entry in the ornaments map is NONE, drop the ornaments field entirely
// so it doesn't leave an empty field in the JSON output.
const isAllNone = (
  ornaments: Record<PartId, number[]> | undefined,
): boolean => {
  if (!ornaments) return true;
  return PART_IDS.every((id) =>
    (ornaments[id] ?? []).every((v) => v === ORNAMENT.NONE),
  );
};

export const writeOrnament = (
  beat: Beat,
  partId: PartId,
  stepIdx: number,
  value: number,
): Beat => {
  const stepCount = beat.steps[partId]?.length ?? beat.subdivision;

  if (value === ORNAMENT.NONE && !beat.ornaments?.[partId]) return beat;

  const nextOrnaments: Record<PartId, number[]> = beat.ornaments
    ? (Object.fromEntries(
        PART_IDS.map((id) => [id, [...(beat.ornaments![id] ?? [])]]),
      ) as Record<PartId, number[]>)
    : (Object.fromEntries(
        PART_IDS.map((id) => [
          id,
          Array<number>(beat.steps[id]?.length ?? beat.subdivision).fill(0),
        ]),
      ) as Record<PartId, number[]>);

  const arr = nextOrnaments[partId];
  if (arr.length < stepCount) arr.length = stepCount;
  arr[stepIdx] = value;

  if (isAllNone(nextOrnaments)) {
    const { ornaments: _, ...rest } = beat;
    return rest;
  }

  return { ...beat, ornaments: nextOrnaments };
};
