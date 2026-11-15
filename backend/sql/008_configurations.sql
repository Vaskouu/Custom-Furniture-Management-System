-- 008: Saved customer furniture designs.
CREATE TABLE IF NOT EXISTS fp_configurations (
    id VARCHAR(80) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    product_id VARCHAR(80) NOT NULL REFERENCES fp_products(id) ON DELETE RESTRICT,
    payload TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_fp_configurations_user_id ON fp_configurations(user_id);
CREATE INDEX IF NOT EXISTS ix_fp_configurations_product_id ON fp_configurations(product_id);
