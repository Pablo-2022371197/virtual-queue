-- Digest HMAC-SHA256 (hex) of the staff registration key. Nullable until an admin generates one.
-- The plaintext key is never stored.
ALTER TABLE places
    ADD COLUMN IF NOT EXISTS staff_registration_key_digest VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS idx_places_staff_registration_key_digest
    ON places (staff_registration_key_digest)
    WHERE staff_registration_key_digest IS NOT NULL;
