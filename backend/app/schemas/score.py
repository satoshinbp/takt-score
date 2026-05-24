from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.music import Measure


class ScoreBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    bpm: int = Field(ge=1, le=400)
    measures: list[Measure]


class ScoreCreate(ScoreBase):
    pass


class ScoreUpdate(ScoreBase):
    pass


class ScoreSummaryRead(BaseModel):
    id: str
    title: str
    bpm: int
    preview_measure: Measure | None
    measures_count: int = Field(ge=0)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScoreRead(ScoreSummaryRead):
    measures: list[Measure]
