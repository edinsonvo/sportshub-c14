# SportHub — Plataforma de Reservas de Servicios (Caso 14)

> **Versión 1.0.0 — Fase 3** · Commit local de referencia: `59ddad7` · Rama de despliegue: `develop`

Proyecto de la asignatura según el perfil **Avanzado**: código funcional, entorno operativo
completo y despliegue automatizado con Azure DevOps, espejo en GitLab y Render.

## Versión actual

| Dato | Valor |
|------|-------|
| Versión de la aplicación | **1.0.0** |
| Fase | **3** (admin, proveedor, personal, cliente, seguridad y pruebas) |
| Commit local de referencia | `59ddad7` — `feat: complete phase 3 - admin, provider, staff, client portals, security and tests` |
| Repositorio origen | Azure Repos `Fabrica_escuela_2026_1/sportshub-backend` (`develop`) |
| Espejo de despliegue | GitLab `udea-fe2026-2/sporthub` (`develop`) |
| Plataforma cloud | Render (blueprint `infra/render/render.yaml`) |

## Stack

- **Backend**: Spring Boot 3.3.5 / Java 17, Spring Security (JWT + RBAC, bloqueo de intentos,
  MFA TOTP/email), JPA/Hibernate con UUIDs, PostgreSQL 16 (H2 en tests), Springdoc OpenAPI,
  Actuator + Micrometer (Prometheus), auditoría, JaCoCo y Spotless.
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 3, TypeScript y vitest.
- **Infra**: Docker Compose (db/backend/frontend/Prometheus/Grafana), Render Blueprint y
  Azure Pipelines multi-etapa.

## Funcionalidades principales

- Autenticación con JWT, refresh token, recuperación de contraseña, MFA y bloqueo por intentos.
- Catálogo de deportes: instalaciones, clases, membresías, implementos y torneos.
- Reservas y agenda con disponibilidad por servicio y control de cupos.
- **Portal de administración**: usuarios, proveedores, estadísticas y auditoría.
- **Portal de proveedor**: perfil, servicios, horarios, personal, membresías e implementos.
- **Portal de personal**: agenda y gestión de citas asignadas.
- **Portal de cliente**: perfil, reservas e historial.
- Reglas de negocio y permisos por rol validadas en backend y reflejadas en la UI.

## Inicio rápido (local)

```bash
cd infra
cp .env.example .env          # ajustar secretos (JWT_SECRET = openssl rand -hex 32)
docker compose up --build -d
docker compose ps             # todos los servicios deben estar "healthy"
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Health | http://localhost:8080/api/v1/health |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin/admin) |

## Entorno desplegado (Render)

| Servicio | URL |
|----------|-----|
| Frontend | https://sporthub-c14-frontend.onrender.com |
| Backend | https://sporthub-c14-backend.onrender.com |
| Health | https://sporthub-c14-backend.onrender.com/api/v1/health |
| Swagger UI | https://sporthub-c14-backend.onrender.com/swagger-ui.html |
| Métricas | https://sporthub-c14-backend.onrender.com/actuator/prometheus |

> Los servicios usan el plan gratuito de Render: el backend puede tardar en responder
> tras un periodo de inactividad (cold start de 30–60 s).

## Usuarios demo

Contraseña para todos: `password` (solo demo; cambiar en producción).
Los datos se crean de forma idempotente con `DemoDataInitializer` (`DEMO_DATA_SEED=true`).

| Rol | Correo |
|-----|--------|
| ADMIN | `admin@sporthub.co` |
| CLIENT | `cliente@sporthub.co` |
| PROVIDER | `belleza@sporthub.co` |
| PROVIDER | `deportes@sporthub.co` |
| STAFF | `laura@sporthub.co` |
| STAFF | `entrenador@sporthub.co` |

## Pipeline CI/CD (Azure DevOps)

Archivo: `azure-devops/azure-pipelines.yml`. Se dispara en `develop` y `main` (push y PR).

| Etapa | Contenido |
|-------|-----------|
| Validación | `spotless:check` + compilación backend; `npm ci` + lint + build frontend |
| Pruebas | JUnit + Testcontainers + JaCoCo; vitest con reporte JUnit |
| Calidad | SonarCloud Quality Gate (se omite si no hay `sonarProjectKey`) |
| Seguridad | gitleaks, trivy (SCA/SAST) y OWASP dependency-check informativo |
| Empaquetado | Docker build de backend/frontend y **espejo Azure → GitLab `develop`** |
| Despliegue | Deploy hooks opcionales + espera de health checks en Render |
| Posdepliegue | Smoke tests (health, frontend, métricas, login demo) y evidencia de reversión |

Variables y secretos recomendados en el grupo `sporthub-vars`:

- `GITLAB_TOKEN`: PAT con permiso `write_repository` sobre `udea-fe2026-2/sporthub`.
- `RENDER_DEPLOY_HOOK_BACKEND` / `RENDER_DEPLOY_HOOK_FRONTEND`: hooks opcionales de Render.
- `sonarProjectKey`, `sonarOrganization`: configuración de SonarCloud.
- `dockerRegistry`, `dockerRegistryUser`, `dockerRegistryPassword`: opcionales para publicar imágenes.
- `securityStrict`: `true` para bloquear la etapa de seguridad ante hallazgos HIGH/CRITICAL.

El push a GitLab `develop` dispara automáticamente los dos servicios de Render
(`autoDeploy: true` en `infra/render/render.yaml`).

## Estructura del repositorio

| Módulo | Carpeta |
|--------|---------|
| Backend (Spring Boot 3 / Java 17) | `backend/` |
| Frontend (Next.js 15 + Tailwind) | `frontend/` |
| Infraestructura y despliegue | `infra/` |
| Pipeline y scripts de Azure DevOps | `azure-devops/` |
| Documentación y diseño | `docs/` |

## Documentos de referencia

- `docs/Documento-Diseno-Basico-EBV03.md`
- `docs/Informe-Despliegue-Render-EBV03.md`
- `docs/adr/ADR.md`
- `azure-devops/README-AZURE-DEVOPS.md`
- `infra/README-DEPLOY.md`
