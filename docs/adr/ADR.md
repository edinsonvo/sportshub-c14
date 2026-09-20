# ADR — Decisiones de Arquitectura (SportHub, Caso 14)

## ADR-0001 — Estilo arquitectónico: monolito modular por capas

- **Fecha / Responsable**: 17/09/2026 — Equipo arquitectura
- **Contexto**: Alcance de reservas con alta cohesión y modesta escala académica; se espera evolución.
- **Alternativas**: microservicios, arquitectura hexagonal, por capas pura.
- **Decisión**: monolito modular con separación por dominios (auth, reservas, reportes) y capas (presentación→aplicación→dominio→infraestructura).
- **Consecuencias**: menor complejidad operativa; la regla de disponibilidad (RN-1/RN-2) vive en una única transacción; se puede extraer dominios a microservicios cuando el volumen lo exija.
- **Reglas de salida**: monitoreo de latencia >200 ms p95 o acoplamiento entre dominios recurrente.

## ADR-0002 — Autenticación JWT + cookies seguras (OIDC/OAuth2 compatible)

- **Fecha**: 17/09/2026
- **Contexto**: SPA necesita sesión estateless, revocación y MFA.
- **Alternativas**: sesiones server-side, JWT sin cookies (Authorization header), SSO externo.
- **Decisión**: JWT de acceso corto (15 min) con refresh rotativo; cookies `HttpOnly/Secure/SameSite=Lax` cuando el navegador lo permita y header Bearer para APIs; publicación del contrato en OpenAPI.
- **Consecuencias**: revocación por lista de refresh; MFA exigido para `ADMIN` (HU-56); integración futura con proveedor OIDC sin rediseño del filtro.

## ADR-0003 — Persistencia PostgreSQL administrado (Supabase/Neon en producción)

- **Fecha**: 17/09/2026
- **Contexto**: se requiere respaldo, TLS y mínimo privilegio; desarrollo local con Docker.
- **Alternativas**: MySQL, MongoDB, postgres autoalojado.
- **Decisión**: PostgreSQL 16 como fuente de verdad; desarrollo con `docker-compose`, producción con servicio administrado y migraciones versionadas.
- **Consecuencias**: FKs e índices de consultas clave; cuenta de servicio con mínimo privilegio; respaldos y restauración probados.

## ADR-0004 — Control de concurrencia en reservas (deuda técnica planificada)

- **Fecha**: 17/09/2026
- **Contexto**: doble reserva simultánea mitiga con restricción única + validación transaccional.
- **Decisión**: adoptar bloqueo optimista (`@Version`) y caché Redis cuando exista evidencia de picos; mientras tanto la restricción UNIQUE y el chequeo transaccional son la fuente de verdad.
- **Consecuencias**: se documenta como deuda técnica en la sección 6.2 del documento de diseño.