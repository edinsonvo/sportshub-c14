-- SportHub - Esquema PostgreSQL 16 - Dominio deportivo (Épica E9)
-- Se ejecuta la primera vez que se inicializa el volumen (docker-entrypoint-initdb.d).
-- Las tablas también se crean en arranque por JPA (ddl-auto=update); este archivo
-- es la definición autoritativa con constraints para despliegues nuevos.

CREATE TABLE IF NOT EXISTS instalacion (
    id UUID PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES provider(id),
    tipo VARCHAR(20) NOT NULL,
    nombre VARCHAR(160) NOT NULL,
    capacidad INTEGER NOT NULL,
    tarifa_por_hora NUMERIC(10,2) NOT NULL,
    hora_apertura TIME NOT NULL,
    hora_cierre TIME NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_instalacion_horario CHECK (hora_apertura < hora_cierre),
    CONSTRAINT ck_instalacion_capacidad CHECK (capacidad > 0)
);

CREATE TABLE IF NOT EXISTS instalacion_mantenimiento (
    id UUID PRIMARY KEY,
    instalacion_id UUID NOT NULL REFERENCES instalacion(id),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    motivo VARCHAR(500),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mantenimiento_rango CHECK (hora_inicio < hora_fin)
);

CREATE TABLE IF NOT EXISTS reserva_instalacion (
    id UUID PRIMARY KEY,
    instalacion_id UUID NOT NULL REFERENCES instalacion(id),
    client_id UUID NOT NULL REFERENCES user_account(id),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_reserva_instalacion_rango CHECK (hora_inicio < hora_fin)
);

CREATE TABLE IF NOT EXISTS lista_espera_instalacion (
    id UUID PRIMARY KEY,
    instalacion_id UUID NOT NULL REFERENCES instalacion(id),
    client_id UUID NOT NULL REFERENCES user_account(id),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    estado VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clase_grupal (
    id UUID PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES provider(id),
    instalacion_id UUID NOT NULL REFERENCES instalacion(id),
    entrenador_staff_id UUID NOT NULL REFERENCES provider_staff(id),
    nombre VARCHAR(160) NOT NULL,
    nivel VARCHAR(40) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    duracion_min INTEGER NOT NULL,
    cupo INTEGER NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_clase_cupo CHECK (cupo > 0)
);

CREATE TABLE IF NOT EXISTS inscripcion_clase (
    id UUID PRIMARY KEY,
    clase_grupal_id UUID NOT NULL REFERENCES clase_grupal(id),
    client_id UUID NOT NULL REFERENCES user_account(id),
    estado VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plan_membresia (
    id UUID PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES provider(id),
    nombre VARCHAR(160) NOT NULL,
    vigencia_dias INTEGER NOT NULL,
    descuento_porcentaje INTEGER NOT NULL DEFAULT 0,
    precio NUMERIC(10,2) NOT NULL,
    beneficios VARCHAR(1000),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_plan_vigencia CHECK (vigencia_dias > 0),
    CONSTRAINT ck_plan_descuento CHECK (descuento_porcentaje BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS membresia (
    id UUID PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES plan_membresia(id),
    client_id UUID NOT NULL REFERENCES user_account(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) NOT NULL,
    motivo VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_membresia_rango CHECK (fecha_inicio <= fecha_fin)
);

CREATE TABLE IF NOT EXISTS implemento (
    id UUID PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES provider(id),
    nombre VARCHAR(160) NOT NULL,
    tipo VARCHAR(80) NOT NULL,
    cantidad_total INTEGER NOT NULL,
    tarifa NUMERIC(10,2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_implemento_stock CHECK (cantidad_total >= 0)
);

CREATE TABLE IF NOT EXISTS reserva_implemento (
    id UUID PRIMARY KEY,
    implemento_id UUID NOT NULL REFERENCES implemento(id),
    client_id UUID NOT NULL REFERENCES user_account(id),
    fecha DATE NOT NULL,
    cantidad INTEGER NOT NULL,
    estado VARCHAR(20) NOT NULL,
    condicion VARCHAR(20) NOT NULL DEFAULT 'BUENO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_reserva_implemento_cantidad CHECK (cantidad > 0)
);

CREATE TABLE IF NOT EXISTS torneo (
    id UUID PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES provider(id),
    nombre VARCHAR(160) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    formato VARCHAR(30) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    cupo INTEGER NOT NULL,
    estado VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_torneo_fechas CHECK (fecha_inicio <= fecha_fin),
    CONSTRAINT ck_torneo_cupo CHECK (cupo >= 2)
);

CREATE TABLE IF NOT EXISTS participante_torneo (
    id UUID PRIMARY KEY,
    torneo_id UUID NOT NULL REFERENCES torneo(id),
    client_id UUID NOT NULL REFERENCES user_account(id),
    nombre_equipo VARCHAR(120),
    estado VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_participante UNIQUE (torneo_id, client_id)
);

CREATE TABLE IF NOT EXISTS partido_torneo (
    id UUID PRIMARY KEY,
    torneo_id UUID NOT NULL REFERENCES torneo(id),
    ronda INTEGER NOT NULL,
    participante_a_id UUID NOT NULL REFERENCES participante_torneo(id),
    participante_b_id UUID NOT NULL REFERENCES participante_torneo(id),
    fecha DATE NOT NULL,
    marcador_a INTEGER,
    marcador_b INTEGER,
    ganador_id UUID REFERENCES participante_torneo(id),
    estado VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de dominio deportivo (rendimiento HU-57 / RN-1 por instalación)
CREATE INDEX IF NOT EXISTS idx_reserva_instalacion_franja
    ON reserva_instalacion (instalacion_id, fecha, estado, hora_inicio);
CREATE INDEX IF NOT EXISTS idx_reserva_instalacion_cliente
    ON reserva_instalacion (client_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_mantenimiento_fecha
    ON instalacion_mantenimiento (instalacion_id, fecha, activo);
CREATE INDEX IF NOT EXISTS idx_inscripcion_clase_estado
    ON inscripcion_clase (clase_grupal_id, estado);
CREATE INDEX IF NOT EXISTS idx_reserva_implemento_fecha
    ON reserva_implemento (implemento_id, fecha, estado);
CREATE INDEX IF NOT EXISTS idx_participante_torneo
    ON participante_torneo (torneo_id, estado);
CREATE INDEX IF NOT EXISTS idx_partido_torneo
    ON partido_torneo (torneo_id, ronda);

-- ============================================================
-- Datos semilla del dominio deportivo (DEMO). Contraseña: "password"
-- ============================================================
INSERT INTO user_account (id, email, password_hash, full_name, phone, active, role, created_at, updated_at) VALUES
    ('10000000-0000-0000-0000-000000000005', 'deportes@sporthub.co',
     '$2b$12$r.EesXLGTnswYp2dQDjSgexV.rEWQHfb2Ej6tBblVRxPdYKnnu9Wu',
     'Centro Deportivo SportHub', '3000000005', TRUE, 'PROVIDER', now(), now()),
    ('10000000-0000-0000-0000-000000000006', 'entrenador@sporthub.co',
     '$2b$12$r.EesXLGTnswYp2dQDjSgexV.rEWQHfb2Ej6tBblVRxPdYKnnu9Wu',
     'Entrenador Demo', '3000000006', TRUE, 'STAFF', now(), now())
ON CONFLICT (email) DO NOTHING;

INSERT INTO provider (id, user_id, business_name, document_number, identity_verified, verified_at, logo_url, active) VALUES
    ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005',
     'Centro Deportivo SportHub', 'CC-987654321', TRUE, now(), NULL, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO provider_staff (id, provider_id, user_id, position, active) VALUES
    ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000006', 'Entrenador', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO instalacion (id, provider_id, tipo, nombre, capacidad, tarifa_por_hora, hora_apertura, hora_cierre, activa, created_at)
VALUES
    ('50000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001',
     'CANCHA', 'Cancha sintética A', 2, 80000, '06:00', '22:00', TRUE, now()),
    ('50000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001',
     'SALA', 'Sala de spinning', 6, 15000, '06:00', '21:00', TRUE, now())
ON CONFLICT DO NOTHING;

INSERT INTO plan_membresia (id, provider_id, nombre, vigencia_dias, descuento_porcentaje, precio, beneficios, activo, created_at)
VALUES
    ('50000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000001',
     'Mensual total', 30, 15, 120000, 'Acceso a todas las instalaciones con 15% de descuento en tarifas', TRUE, now())
ON CONFLICT DO NOTHING;

INSERT INTO implemento (id, provider_id, nombre, tipo, cantidad_total, tarifa, activo, created_at)
VALUES
    ('50000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000001',
     'Balón de fútbol', 'Balones', 10, 10000, TRUE, now())
ON CONFLICT DO NOTHING;