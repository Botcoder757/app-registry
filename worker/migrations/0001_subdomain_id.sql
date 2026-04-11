-- Add per-app nanoid subdomain so each published app gets a unique,
-- unguessable hostname under construct.computer (covered by Universal SSL).
--
-- Hostname pattern: `${id}-${subdomain_id}.construct.computer`
-- subdomain_label caches the full label for O(1) host lookup at the edge.

ALTER TABLE apps ADD COLUMN subdomain_id TEXT;
ALTER TABLE apps ADD COLUMN subdomain_label TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_apps_subdomain_label ON apps(subdomain_label);
