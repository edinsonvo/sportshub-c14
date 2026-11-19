-- HU-39: ejecutar solo si la BD no usa Hibernate ddl-auto=update.
-- Repetible; no altera las citas existentes.
ALTER TABLE appointment ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
