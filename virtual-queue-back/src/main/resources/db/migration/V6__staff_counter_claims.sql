-- Staff claims one counter (caja) per place for their session.
ALTER TABLE users
    ADD COLUMN claimed_counter INT;

ALTER TABLE users
    ADD CONSTRAINT users_claimed_counter_positive CHECK (
        claimed_counter IS NULL OR claimed_counter >= 1
    );

-- One staff member per (place, counter) at a time.
CREATE UNIQUE INDEX uq_users_place_claimed_counter
    ON users (place_id, claimed_counter)
    WHERE place_id IS NOT NULL AND claimed_counter IS NOT NULL;
