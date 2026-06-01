-- name: CreateScore :exec
INSERT INTO scores (id, title, bpm, spotify_track_id, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: GetScore :one
SELECT id, title, bpm, created_at, updated_at, spotify_track_id
FROM scores
WHERE id = $1;

-- name: UpdateScoreMeta :execrows
UPDATE scores
SET title = $2, bpm = $3, spotify_track_id = $4, updated_at = $5
WHERE id = $1;

-- name: DeleteScore :execrows
DELETE FROM scores WHERE id = $1;

-- name: ListScores :many
SELECT id, title, bpm, created_at, updated_at, spotify_track_id
FROM scores
ORDER BY updated_at DESC
LIMIT $1 OFFSET $2;

-- name: CountMeasures :one
SELECT COUNT(*)::int AS measures_count
FROM measures
WHERE score_id = $1;

-- name: CountMeasuresForScores :many
SELECT score_id, COUNT(*)::int AS measures_count
FROM measures
WHERE score_id = ANY($1::uuid[])
GROUP BY score_id;

-- name: FindScoreIDByTitle :one
SELECT id FROM scores WHERE title = $1 LIMIT 1;
