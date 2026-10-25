-- FurniPro: Order materials table
-- Third relational table for the November 4 demo

CREATE TABLE IF NOT EXISTS order_materials (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    material_name VARCHAR(100) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),

    CONSTRAINT fk_order_materials_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
);