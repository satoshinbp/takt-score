-- +goose Up
-- +goose StatementBegin
CREATE TYPE part_id AS ENUM (
    'CRASH', 'RIDE', 'HH_OPEN', 'HH',
    'HI_TOM', 'MID_TOM', 'SNARE', 'LO_TOM', 'BD'
);

CREATE TYPE velocity AS ENUM ('NORMAL', 'ACCENT', 'GHOST');

CREATE TYPE ornament AS ENUM ('FLAM', 'DRAG', 'RUFF');

CREATE TABLE scores (
    id         uuid        PRIMARY KEY,
    title      text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
    bpm        smallint    NOT NULL CHECK (bpm BETWEEN 1 AND 400),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX scores_updated_at_idx ON scores (updated_at DESC);

CREATE TABLE measures (
    id       uuid     PRIMARY KEY,
    score_id uuid     NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
    position smallint NOT NULL CHECK (position >= 0),
    UNIQUE (score_id, position)
);

CREATE INDEX measures_score_id_position_idx ON measures (score_id, position);

CREATE TABLE beats (
    id          uuid     PRIMARY KEY,
    measure_id  uuid     NOT NULL REFERENCES measures(id) ON DELETE CASCADE,
    position    smallint NOT NULL CHECK (position BETWEEN 0 AND 3),
    subdivision smallint NOT NULL CHECK (subdivision IN (3, 4, 6)),
    UNIQUE (measure_id, position)
);

CREATE INDEX beats_measure_id_position_idx ON beats (measure_id, position);

-- hits stores only active steps; OFF positions have no row.
-- step_index is bounded by the parent beat's subdivision (enforced in app layer).
CREATE TABLE hits (
    beat_id    uuid     NOT NULL REFERENCES beats(id) ON DELETE CASCADE,
    part_id    part_id  NOT NULL,
    step_index smallint NOT NULL CHECK (step_index >= 0 AND step_index < 6),
    velocity   velocity NOT NULL,
    ornament   ornament,
    PRIMARY KEY (beat_id, part_id, step_index)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS hits;
DROP TABLE IF EXISTS beats;
DROP TABLE IF EXISTS measures;
DROP TABLE IF EXISTS scores;
DROP TYPE IF EXISTS ornament;
DROP TYPE IF EXISTS velocity;
DROP TYPE IF EXISTS part_id;
-- +goose StatementEnd
