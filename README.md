# SportHub — Plataforma de Reservas de Servicios (Caso 14)

Proyecto de la asignatura según el perfil **Avanzado**: código funcional, entorno operativo
completo y despliegue automatizado en Azure DevOps.

| Módulo                     | Carpeta                              |
|----------------------------|--------------------------------------|
| Documento de Diseño Básico | `docs/Documento-Diseno-Basico-PlataformaReservas.md` |
| Decisión de arquitectura   | `docs/adr/ADR.md`                    |
| Backlog + Azure DevOps     | `azure-devops/`                      |
| Backend (Spring Boot 3 / Java 17) | `backend/`                     |
| Frontend (Next.js 15 + Tailwind)  | `frontend/`                     |
| Infraestructura y despliegue | `infra/`                            |

## Stack

- **Backend**: Spring Boot 3.3.5, Spring Security (JWT + RBAC + bloqueo de intentos), JPA/Hibernate con UUIDs,
  PostgreSQL 16 (H2 en tests), Springdoc OpenAPI, Actuator + Micrometer (Prometheus), JaCoCo, Spotless.
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 3, vitest.
- **Infra**: Docker Compose (db/backend/frontend/Prometheus/Grafana), Render Blueprint, Azure Pipelines multi-etapa
  (Validación → Pruebas → SonarCloud QG → Seguridad → Empaquetado → Despliegue → Posdepliegue).

## Inicio rápido (local)

```bash
cd infra
cp .env.example .env          # ajustar secretos
docker compose up --build -d
```

- Frontend: http://localhost:3000 · Backend API: http://localhost:8080/api/v1
- Swagger UI: http://localhost:8080/swagger-ui.html
- Prometheus: http://localhost:9090 · Grafana: http://localhost:3001 (admin/admin)

Usuarios demo (contraseña `password`, solo demo): `admin@sporthub.co`, `cliente@sporthub.co`,
`belleza@sporthub.co`, `laura@sporthub.co`. Creados por `infra/postgres/init/01-schema.sql`.


## Documentos de referencia

Manual del enunciado (Caso 14), lineamientos y plantilla en `/tmp/caso14/*.txt`.