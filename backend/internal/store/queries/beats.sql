-- name: CreateBeat :exec
INSERT INTO beats (id, measure_id, position, subdivision)
VALUES ($1, $2, $3, $4);

-- name: ListBeatsByScore :many
SELECT b.id, b.measure_id, b.position, b.subdivision, m.position AS measure_position
FROM beats b
JOIN measures m ON m.id = b.measure_id
WHERE m.score_id = $1
ORDER BY m.position ASC, b.position ASC;

-- name: ListBeatsByMeasureIDs :many
SELECT id, measure_id, position, subdivision
FROM beats
WHERE measure_id = ANY($1::uuid[])
ORDER BY measure_id, position ASC;
