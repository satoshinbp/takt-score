-- name: InsertHit :exec
INSERT INTO hits (beat_id, part_id, step_index, velocity, ornament)
VALUES ($1, $2, $3, $4, $5);

-- name: ListHitsByScore :many
SELECT h.beat_id, h.part_id, h.step_index, h.velocity, h.ornament,
       b.position AS beat_position, m.position AS measure_position
FROM hits h
JOIN beats b ON b.id = h.beat_id
JOIN measures m ON m.id = b.measure_id
WHERE m.score_id = $1
ORDER BY m.position ASC, b.position ASC, h.part_id, h.step_index;

-- name: ListHitsByBeatIDs :many
SELECT beat_id, part_id, step_index, velocity, ornament
FROM hits
WHERE beat_id = ANY($1::uuid[]);
