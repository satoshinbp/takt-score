-- +goose Up
-- +goose StatementBegin
ALTER TABLE scores
    ADD COLUMN spotify_track_id text
        CHECK (spotify_track_id IS NULL OR char_length(spotify_track_id) BETWEEN 1 AND 64);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE scores DROP COLUMN spotify_track_id;
-- +goose StatementEnd
