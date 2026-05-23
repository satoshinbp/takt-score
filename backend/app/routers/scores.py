from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from ulid import ULID

from app.db import get_db
from app.models.score import Score
from app.schemas.score import ScoreCreate, ScoreRead, ScoreUpdate

router = APIRouter(prefix="/scores", tags=["scores"])


@router.get("", response_model=list[ScoreRead])
def list_scores(db: Annotated[Session, Depends(get_db)]) -> list[Score]:
    stmt = select(Score).order_by(Score.updated_at.desc())
    return list(db.scalars(stmt))


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
    data = payload.model_dump()
    score = Score(
        id=str(ULID()),
        title=data["title"],
        bpm=data["bpm"],
        measures=data["measures"],
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
    data = payload.model_dump()
    score.title = data["title"]
    score.bpm = data["bpm"]
    score.measures = data["measures"]
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
