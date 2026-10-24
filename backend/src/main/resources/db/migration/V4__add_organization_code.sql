-- Add organization code column with unique constraint
ALTER TABLE organizations ADD COLUMN code VARCHAR(20);

-- Create unique index on code (will allow NULLs initially for backfill)
CREATE UNIQUE INDEX idx_organizations_code ON organizations(code) WHERE code IS NOT NULL;

-- Backfill existing organizations with unique codes based on name
-- Using a CTE to generate unique codes from organization names
WITH numbered_orgs AS (
    SELECT
        id,
        name,
        ROW_NUMBER() OVER (PARTITION BY UPPER(SUBSTRING(REGEXP_REPLACE(name, '[^A-Z0-9]', '', 'g'), 1, 10)) ORDER BY created_at) as rn,
        UPPER(SUBSTRING(REGEXP_REPLACE(name, '[^A-Z0-9]', '', 'g'), 1, 10)) as base_code
    FROM organizations
    WHERE code IS NULL
),
final_codes AS (
    SELECT
        id,
        CASE
            WHEN rn = 1 THEN base_code
            ELSE base_code || LPAD(rn::text, 3, '0')
        END as new_code
    FROM numbered_orgs
)
UPDATE organizations o
SET code = fc.new_code
FROM final_codes fc
WHERE o.id = fc.id;

-- Make code column NOT NULL after backfill
ALTER TABLE organizations ALTER COLUMN code SET NOT NULL;

-- Drop the partial unique index and create a full unique index
DROP INDEX idx_organizations_code;
CREATE UNIQUE INDEX idx_organizations_code ON organizations(code);