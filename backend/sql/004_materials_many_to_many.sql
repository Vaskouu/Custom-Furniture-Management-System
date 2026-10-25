-- FurniPro - Materials catalog and many-to-many relationship
-- Migration 004
-- Run after 003_order_materials.sql

BEGIN;

-- 1. Create materials catalog
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    unit VARCHAR(20) NOT NULL DEFAULT 'бр.',
    price_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0
        CHECK (price_per_unit >= 0)
);

-- 2. Copy existing material names into catalog
INSERT INTO materials (name)
SELECT DISTINCT material_name
FROM order_materials
ON CONFLICT (name) DO NOTHING;

-- 3. Add the new reference column
ALTER TABLE order_materials
ADD COLUMN IF NOT EXISTS material_id INTEGER;

-- 4. Link existing records to catalog entries
UPDATE order_materials AS om
SET material_id = m.id
FROM materials AS m
WHERE om.material_name = m.name
  AND om.material_id IS NULL;

-- 5. Ensure every order material references a catalog material
ALTER TABLE order_materials
ALTER COLUMN material_id SET NOT NULL;

-- 6. Create the foreign key if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_order_materials_material'
          AND conrelid = 'order_materials'::regclass
    ) THEN
        ALTER TABLE order_materials
        ADD CONSTRAINT fk_order_materials_material
        FOREIGN KEY (material_id)
        REFERENCES materials(id);
    END IF;
END
$$;

COMMIT;