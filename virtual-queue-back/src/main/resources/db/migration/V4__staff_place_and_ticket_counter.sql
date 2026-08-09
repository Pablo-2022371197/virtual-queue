ALTER TABLE users ADD COLUMN place_id UUID REFERENCES places (id);

ALTER TABLE tickets ADD COLUMN counter_number INTEGER;
ALTER TABLE tickets ADD COLUMN assigned_staff_id UUID REFERENCES users (id);

UPDATE users
SET place_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    updated_at = NOW()
WHERE username = 'staff';
