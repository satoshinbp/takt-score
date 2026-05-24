-- name: CreateMeasure :exec
INSERT INTO measures (id, score_id, position) VALUES ($1, $2, $3);

-- name: ListMeasuresByScore :many
SELECT id, score_id, position
FROM measures
WHERE score_id = $1
ORDER BY position ASC;

-- name: DeleteMeasuresByScore :exec
DELETE FROM measures WHERE score_id = $1;

-- name: ListMeasuresByScoreLimited :many
SELECT id, score_id, position
FROM measures
WHERE score_id = $1
ORDER BY position ASC
LIMIT $2;

-- name: ListFirstMeasureForScores :many
SELECT id, score_id, position
FROM measures
WHERE score_id = ANY($1::uuid[]) AND position = 0;
