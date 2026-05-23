from typing import Annotated

from pydantic import BaseModel, Field, model_validator

from app.constants import BEATS_PER_MEASURE, PART_IDS, PartId, Subdivision

StepValue = Annotated[int, Field(ge=0, le=3)]
OrnamentValue = Annotated[int, Field(ge=0, le=3)]


class Beat(BaseModel):
    subdivision: Subdivision
    steps: dict[PartId, list[StepValue]]
    ornaments: dict[PartId, list[OrnamentValue]] | None = None

    @model_validator(mode="after")
    def _check_shape(self) -> "Beat":
        expected = set(PART_IDS)
        actual = set(self.steps.keys())
        if actual != expected:
            missing = expected - actual
            extra = actual - expected
            raise ValueError(
                f"steps keys mismatch (missing={sorted(missing)}, extra={sorted(extra)})"
            )
        for part, values in self.steps.items():
            if len(values) != self.subdivision:
                raise ValueError(
                    f"steps[{part}] length {len(values)} != subdivision {self.subdivision}"
                )
        if self.ornaments is not None:
            for part, values in self.ornaments.items():
                if part not in expected:
                    raise ValueError(f"ornaments has unknown part {part}")
                if len(values) != self.subdivision:
                    raise ValueError(
                        f"ornaments[{part}] length {len(values)} != subdivision {self.subdivision}"
                    )
        return self


Measure = Annotated[
    list[Beat], Field(min_length=BEATS_PER_MEASURE, max_length=BEATS_PER_MEASURE)
]
