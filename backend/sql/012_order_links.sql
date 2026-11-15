-- 012: Reserved link between an inquiry and an existing order.
-- The current interface creates orders separately; this link is not populated yet.
CREATE TABLE IF NOT EXISTS fp_order_links (
    id SERIAL PRIMARY KEY,
    legacy_order_id INTEGER NOT NULL UNIQUE,
    inquiry_id INTEGER NOT NULL UNIQUE REFERENCES fp_inquiries(id) ON DELETE RESTRICT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);
