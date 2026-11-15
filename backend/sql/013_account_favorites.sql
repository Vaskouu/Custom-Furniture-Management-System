CREATE TABLE IF NOT EXISTS fp_favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(80) NOT NULL REFERENCES fp_products(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, product_id)
);
