-- Rename the single profile row to the canonical full name.
-- Targets only the two name fields; nothing else in the profile changes.
UPDATE profiles
SET name = 'Robert Kameni Namou',
    intro = jsonb_set(intro, '{name}', '"Robert Kameni Namou"'),
    "updatedAt" = now()
WHERE name <> 'Robert Kameni Namou'
   OR intro ->> 'name' IS DISTINCT FROM 'Robert Kameni Namou';
