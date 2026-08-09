CREATE TABLE users (
    id              UUID PRIMARY KEY,
    full_name       VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    username        VARCHAR(100) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL,
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL,
    updated_at      TIMESTAMPTZ  NOT NULL,
    CONSTRAINT users_role_check CHECK (role IN ('CUSTOMER', 'STAFF', 'ADMIN'))
);

CREATE UNIQUE INDEX idx_users_email ON users (email);
CREATE UNIQUE INDEX idx_users_username ON users (username);

CREATE TABLE places (
    id          UUID PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    address     VARCHAR(500),
    category    VARCHAR(100),
    description TEXT,
    active      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_places_active ON places (active);
CREATE INDEX idx_places_category ON places (category);

CREATE TABLE service_queues (
    id                      UUID PRIMARY KEY,
    place_id                UUID        NOT NULL REFERENCES places (id) ON DELETE CASCADE,
    prefix                  VARCHAR(10) NOT NULL DEFAULT 'A',
    last_sequence           INTEGER     NOT NULL DEFAULT 0,
    average_service_minutes INTEGER     NOT NULL DEFAULT 10,
    open_counters           INTEGER     NOT NULL DEFAULT 1,
    active                  BOOLEAN     NOT NULL DEFAULT TRUE,
    version                 BIGINT      NOT NULL DEFAULT 0,
    CONSTRAINT uq_service_queues_place UNIQUE (place_id)
);

CREATE TABLE tickets (
    id                 UUID PRIMARY KEY,
    queue_id           UUID        NOT NULL REFERENCES service_queues (id),
    user_id            UUID        NOT NULL REFERENCES users (id),
    number             VARCHAR(20) NOT NULL,
    sequence           INTEGER     NOT NULL,
    status             VARCHAR(20) NOT NULL,
    issued_at          TIMESTAMPTZ NOT NULL,
    called_at          TIMESTAMPTZ,
    service_started_at TIMESTAMPTZ,
    completed_at       TIMESTAMPTZ,
    cancelled_at       TIMESTAMPTZ,
    CONSTRAINT tickets_status_check CHECK (
        status IN ('WAITING', 'NEARLY', 'CALLED', 'SERVING', 'COMPLETED', 'CANCELLED', 'EXPIRED')
    ),
    CONSTRAINT uq_tickets_queue_sequence UNIQUE (queue_id, sequence)
);

CREATE UNIQUE INDEX idx_tickets_user_active ON tickets (user_id)
    WHERE status IN ('WAITING', 'NEARLY', 'CALLED', 'SERVING');

CREATE INDEX idx_tickets_queue_status ON tickets (queue_id, status);
CREATE INDEX idx_tickets_queue_sequence ON tickets (queue_id, sequence);

CREATE TABLE device_registrations (
    id           UUID PRIMARY KEY,
    user_id      UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    fcm_token    VARCHAR(512) NOT NULL,
    platform     VARCHAR(20)  NOT NULL,
    device_name  VARCHAR(255),
    active       BOOLEAN      NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ  NOT NULL,
    CONSTRAINT device_platform_check CHECK (platform IN ('ANDROID', 'WEB'))
);

CREATE UNIQUE INDEX idx_device_fcm_token ON device_registrations (fcm_token);
CREATE INDEX idx_device_user ON device_registrations (user_id);

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY,
    user_id    UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    family_id  UUID         NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens (token_hash);
