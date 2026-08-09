-- Corrige hashes BCrypt inválidos del seed y asegura datos de desarrollo.
-- Password para todos: password

UPDATE users
SET password_hash = '$2a$10$BrVSM2MSRsm6LhYXSc6Q6ubNKXw.TKDL1K8pCuCuQv.l/yJokLcNC',
    updated_at = NOW()
WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
);

INSERT INTO users (id, full_name, email, username, password_hash, role, enabled, created_at, updated_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Admin Sistema', 'admin@virtualqueue.local', 'admin',
     '$2a$10$BrVSM2MSRsm6LhYXSc6Q6ubNKXw.TKDL1K8pCuCuQv.l/yJokLcNC', 'ADMIN', TRUE, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'Personal Turnos', 'staff@virtualqueue.local', 'staff',
     '$2a$10$BrVSM2MSRsm6LhYXSc6Q6ubNKXw.TKDL1K8pCuCuQv.l/yJokLcNC', 'STAFF', TRUE, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'Cliente Demo', 'customer@virtualqueue.local', 'customer',
     '$2a$10$BrVSM2MSRsm6LhYXSc6Q6ubNKXw.TKDL1K8pCuCuQv.l/yJokLcNC', 'CUSTOMER', TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO places (id, name, address, category, description, active, created_at, updated_at)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BBVA Bancomer Querétaro Centro',
     'Av. Constituyentes 1, Centro, Querétaro', 'Banco',
     'Sucursal bancaria en el centro de Querétaro', TRUE, NOW(), NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'IMSS UMF 17',
     'Blvd. Bernardo Quintana 100, Querétaro', 'Salud',
     'Unidad de Medicina Familiar', TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_queues (id, place_id, prefix, last_sequence, average_service_minutes, open_counters, active, version)
VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'A', 0, 8, 2, TRUE, 0),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'B', 0, 15, 1, TRUE, 0)
ON CONFLICT (id) DO NOTHING;
