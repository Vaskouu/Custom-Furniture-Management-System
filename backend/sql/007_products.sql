-- 007: Public catalog. Payload stores the product JSON document.
CREATE TABLE IF NOT EXISTS fp_products (
    id VARCHAR(80) PRIMARY KEY,
    payload TEXT NOT NULL
);
