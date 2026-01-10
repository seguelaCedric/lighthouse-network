-- Add placed_by tracking to placements
-- This tracks who made the placement (different from job owner who brought the enquiry)

-- Add placed_by user ID and name to placements
ALTER TABLE placements ADD COLUMN IF NOT EXISTS vincere_placed_by_id INTEGER;
ALTER TABLE placements ADD COLUMN IF NOT EXISTS placed_by_name TEXT;

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_placements_vincere_placed_by_id
ON placements(vincere_placed_by_id)
WHERE vincere_placed_by_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_placements_placed_by_name
ON placements(placed_by_name)
WHERE placed_by_name IS NOT NULL;

-- Add comment explaining the fields
COMMENT ON COLUMN placements.vincere_placed_by_id IS 'Vincere user ID of the person who made this placement';
COMMENT ON COLUMN placements.placed_by_name IS 'Name of the team member who made this placement';
