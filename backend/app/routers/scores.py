from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from ulid import ULID

from app.db import get_db
from app.models.score import Score
from app.schemas.score import ScoreCreate, ScoreRead, ScoreSummaryRead, ScoreUpdate

# TODO: add authentication. The API is currently public and trusts any caller.
router = APIRouter(prefix="/scores", tags=["scores"])


@router.get("", response_model=list[ScoreSummaryRead])
def list_scores(
    db: Annotated[Session, Depends(get_db)],
    max_items: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[ScoreSummaryRead]:
    stmt = (
        select(Score)
        .order_by(Score.updated_at.desc())
        .offset(offset)
        .limit(max_items)
    )
    scores = list(db.scalars(stmt))
    return [
        ScoreSummaryRead.model_validate(
            {
                "id": score.id,
                "title": score.title,
                "bpm": score.bpm,
                "preview_measure": score.measures[0] if score.measures else None,
                "measures_count": len(score.measures),
                "created_at": score.created_at,
                "updated_at": score.updated_at,
            }
        )
        for score in scores
    ]


@router.get("/{score_id}", response_model=ScoreRead)
def get_score(score_id: str, db: Annotated[Session, Depends(get_db)]) -> Score:
    score = db.get(Score, score_id)
    if score is None:
        raise HTTPException(status_code=404, detail="Score not found")
    return score


@router.post("", response_model=ScoreRead, status_code=status.HTTP_201_CREATED)
def create_score(
    payload: ScoreCreate, db: Annotated[Session, Depends(get_db)]
) -> Score:
    score = Score(
        id=str(ULID()),
        title=payload.title,
        bpm=payload.bpm,
        measures=payload.model_dump()["measures"],
    )
    db.add(score)
    db.commit()
    db.refresh(score)
    return score


@router.put("/{score_id}", response_model=ScoreRead)
def update_score(
    score_id: str,
    payload: ScoreUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> Score:
    score = db.get(Score, score_id)
    if score is None:
        raise HTTPException(status_code=404, detail="Score not found")
    score.title = payload.title
    score.bpm = payload.bpm
    score.measures = payload.model_dump()["measures"]
    db.commit()
    db.refresh(score)
    return score


@router.delete("/{score_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_score(
    score_id: str, db: Annotated[Session, Depends(get_db)]
) -> Response:
    score = db.get(Score, score_id)
    if score is None:
        raise HTTPException(status_code=404, detail="Score not found")
    db.delete(score)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
