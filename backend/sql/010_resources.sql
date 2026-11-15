CREATE TABLE IF NOT EXISTS fp_resources (
    id SERIAL PRIMARY KEY,
    kind VARCHAR(30) NOT NULL,
    external_id VARCHAR(80) NOT NULL,
    payload TEXT NOT NULL,
    UNIQUE(kind, external_id)
);
CREATE INDEX IF NOT EXISTS ix_fp_resources_kind ON fp_resources(kind);
