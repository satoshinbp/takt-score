// This file is hand-maintained alongside sqlc-generated code in the same
// package. It re-exports selected unexported SQL constants for callers
// that genuinely cannot go through a *Queries method — for example, when
// feeding a query string directly to pgx.Batch.Queue, which has no
// *Queries overload. Prefer the generated method when one is available
// so sqlc keeps owning parameter binding as well.

package store

// InsertHitSQL re-exports the SQL backing Queries.InsertHit so callers
// using pgx.Batch (which cannot invoke a *Queries method) keep sending
// the same statement as Queries.InsertHit. If queries/hits.sql is
// regenerated with a different column list, this constant tracks the
// change automatically; the batch.Queue argument list must then be
// updated to match (mismatches surface at runtime, not compile time).
const InsertHitSQL = insertHit
