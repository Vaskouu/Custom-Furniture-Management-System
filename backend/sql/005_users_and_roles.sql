-- FurniPro - Users and roles
-- Migration 005
-- Run after migration 004

BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('admin', 'designer', 'client')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS user_id INTEGER UNIQUE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_customers_user'
          AND conrelid = 'customers'::regclass
    ) THEN
        ALTER TABLE customers
        ADD CONSTRAINT fk_customers_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL;
    END IF;
END
$$;

COMMIT;
