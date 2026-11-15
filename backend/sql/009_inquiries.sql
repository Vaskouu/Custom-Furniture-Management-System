-- 009: Guest/customer inquiries and private staff notes.
CREATE TABLE IF NOT EXISTS fp_inquiries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
    email VARCHAR(254) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Нова заявка',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_fp_inquiries_user_id ON fp_inquiries(user_id);
CREATE INDEX IF NOT EXISTS ix_fp_inquiries_email ON fp_inquiries(email);
