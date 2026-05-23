from typing import Literal

PartId = Literal[
    "CRASH",
    "RIDE",
    "HH_OPEN",
    "HH",
    "HI_TOM",
    "MID_TOM",
    "SNARE",
    "LO_TOM",
    "BD",
]
Subdivision = Literal[4, 3, 6]

PART_IDS: tuple[PartId, ...] = (
    "CRASH",
    "RIDE",
    "HH_OPEN",
    "HH",
    "HI_TOM",
    "MID_TOM",
    "SNARE",
    "LO_TOM",
    "BD",
)
BEATS_PER_MEASURE = 4
