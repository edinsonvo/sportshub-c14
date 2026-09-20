-- SportHub - Esquema PostgreSQL 16
-- Se ejecuta la primera vez que se inicializa el volumen (docker-entrypoint-initdb.d).

CREATE TABLE IF NOT EXISTS user_account (
    id UUID PRIMARY KEY,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(30),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provider (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_account(id),
    business_name VARCHAR(160) NOT NULL,
    document_number VARCHAR(40),
    identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    logo_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_provider_user UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS provider_staff (
    id UUID PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES provider(id),
    user_id UUID NOT NULL REFERENCES user_account(id),
    position VARCHAR(80),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_staff_user UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS provider_service (
    id UUID PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES provider(id),
    name VARCHAR(160) NOT NULL,
    description VARCHAR(1000),
    duration_minutes INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    image_url VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS service_schedule (
    id UUID PRIMARY KEY,
    provider_service_id UUID NOT NULL REFERENCES provider_service(id),
    provider_id UUID NOT NULL REFERENCES provider(id),
    staff_id UUID NOT NULL REFERENCES provider_staff(id),
    day_of_week VARCHAR(12) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT ck_schedule_range CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS appointment (
    id UUID PRIMARY KEY,
    provider_service_id UUID NOT NULL REFERENCES provider_service(id),
    client_id UUID NOT NULL REFERENCES user_account(id),
    staff_id UUID NOT NULL REFERENCES provider_staff(id),
    provider_id UUID NOT NULL REFERENCES provider(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(30) NOT NULL,
    cancellation_reason VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_appointment_range CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY,
    entity_name VARCHAR(80) NOT NULL,
    entity_id VARCHAR(64),
    action VARCHAR(60) NOT NULL,
    actor_id VARCHAR(64),
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas clave (rendimiento HU-57, RN-1 / disponibilidad)
CREATE INDEX IF NOT EXISTS idx_appointment_staff_date_status
    ON appointment (staff_id, date, status);
CREATE INDEX IF NOT EXISTS idx_appointment_client_date
    ON appointment (client_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_provider_date
    ON appointment (provider_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_service_day
    ON service_schedule (provider_service_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_audit_entity
    ON audit_log (entity_name, created_at DESC);

-- ============================================================
-- Datos semilla (DEMO). Contraseña de todos los usuarios demo: "password"
-- Hash bcrypt válido para "password".
-- ⚠ Cambiar estas credenciales antes de cualquier despliegue real.
-- ============================================================
INSERT INTO user_account (id, email, password_hash, full_name, phone, active, role, created_at, updated_at) VALUES
    ('10000000-0000-0000-0000-000000000001', 'admin@sporthub.co',
     '$2b$12$r.EesXLGTnswYp2dQDjSgexV.rEWQHfb2Ej6tBblVRxPdYKnnu9Wu',
     'Administrador Plataforma', '3000000001', TRUE, 'ADMIN', now(), now()),
    ('10000000-0000-0000-0000-000000000002', 'belleza@sporthub.co',
     '$2b$12$r.EesXLGTnswYp2dQDjSgexV.rEWQHfb2Ej6tBblVRxPdYKnnu9Wu',
     'Salón Belleza Elite', '3000000002', TRUE, 'PROVIDER', now(), now()),
    ('10000000-0000-0000-0000-000000000003', 'laura@sporthub.co',
     '$2b$12$r.EesXLGTnswYp2dQDjSgexV.rEWQHfb2Ej6tBblVRxPdYKnnu9Wu',
     'Laura Estilista', '3000000003', TRUE, 'STAFF', now(), now()),
    ('10000000-0000-0000-0000-000000000004', 'cliente@sporthub.co',
     '$2b$12$r.EesXLGTnswYp2dQDjSgexV.rEWQHfb2Ej6tBblVRxPdYKnnu9Wu',
     'Cliente Demo', '3000000004', TRUE, 'CLIENT', now(), now())
ON CONFLICT (email) DO NOTHING;

INSERT INTO provider (id, user_id, business_name, document_number, identity_verified, verified_at, logo_url, active) VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002',
     'Salón Belleza Elite', 'CC-901234567', TRUE, now(), NULL, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO provider_staff (id, provider_id, user_id, position, active) VALUES
    ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000003', 'Estilista', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO provider_service (id, provider_id, name, description, duration_minutes, price, active, image_url) VALUES
    ('8f0a1e2d-3b4c-5d6e-7f80-9a1b2c3d4e5f', '20000000-0000-0000-0000-000000000001',
     'Corte de cabello', 'Corte clásico con lavado y secado', 60, 45000, TRUE, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO service_schedule (id, provider_service_id, provider_id, staff_id, day_of_week, start_time, end_time, blocked) VALUES
    ('40000000-0000-0000-0000-000000000001', '8f0a1e2d-3b4c-5d6e-7f80-9a1b2c3d4e5f',
     '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
     'MONDAY', '09:00', '17:00', FALSE),
    ('40000000-0000-0000-0000-000000000002', '8f0a1e2d-3b4c-5d6e-7f80-9a1b2c3d4e5f',
     '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
     'TUESDAY', '09:00', '17:00', FALSE),
    ('40000000-0000-0000-0000-000000000003', '8f0a1e2d-3b4c-5d6e-7f80-9a1b2c3d4e5f',
     '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
     'WEDNESDAY', '09:00', '17:00', FALSE),
    ('40000000-0000-0000-0000-000000000004', '8f0a1e2d-3b4c-5d6e-7f80-9a1b2c3d4e5f',
     '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
     'THURSDAY', '09:00', '17:00', FALSE),
    ('40000000-0000-0000-0000-000000000005', '8f0a1e2d-3b4c-5d6e-7f80-9a1b2c3d4e5f',
     '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
     'FRIDAY', '09:00', '17:00', FALSE)
ON CONFLICT DO NOTHING;