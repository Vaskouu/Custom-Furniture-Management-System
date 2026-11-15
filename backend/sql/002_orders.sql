-- 002: Furniture orders belonging to clients.
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    furniture_type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Нова',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
