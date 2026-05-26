package store

// InsertHitSQL re-exports the SQL backing InsertHit so callers that must
// feed it directly to pgx (e.g. via pgx.Batch, which cannot invoke a
// *Queries method) keep using the same query as Queries.InsertHit.
// Regenerating sqlc updates the underlying constant automatically; this
// prevents the hand-written duplicate that previously lived in the score
// service from silently drifting if a column is added to hits.
const InsertHitSQL = insertHit
