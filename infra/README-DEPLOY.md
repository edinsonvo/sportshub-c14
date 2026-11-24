# Despliegue de SportHub — Entorno Operativo

Documento operativo del Caso 14. Resumen de cómo levantar el ambiente completo y desplegarlo.

## 1. Local (reproducibilidad con Docker Compose)

Requiere Docker ≥ 24 y Docker Compose v2.

```bash
cd infra
cp .env.example .env        # ajuste secretos (JWT_SECRET = openssl rand -hex 32)
docker compose up --build -d
docker compose ps           # todos los servicios deben estar "healthy"
```

| Servicio | URL                                 |
|----------|-------------------------------------|
| Frontend | http://localhost:3000               |
| Backend API + OpenAPI | http://localhost:8080/api/v1 y /swagger-ui.html |
| Prometheus | http://localhost:9090               |
| Grafana   | http://localhost:3001 (admin/admin) |

**Datos demo**: los crea el backend al arrancar `DemoDataInitializer` (siembra/actualiza de forma
idempotente con el `PasswordEncoder` real; se desactiva con `DEMO_DATA_SEED=false`).
El SQL `infra/postgres/init/01-schema.sql` es el refuerzo para volúmenes nuevos.
Contraseña de los usuarios demo = `password` (solo demo, cambiar para producción).

| Rol     | Correo                |
|---------|-----------------------|
| ADMIN   | admin@sporthub.co    |
| Cliente | cliente@sporthub.co  |
| Proveedor | belleza@sporthub.co |
| Proveedor | deportes@sporthub.co |
| Personal | laura@sporthub.co    |
| Personal | entrenador@sporthub.co |

Prueba rápida:

```bash
curl -s http://localhost:8080/api/v1/health
TOKEN=$(curl -s -XPOST -H 'Content-Type: application/json' \
  -d '{"email":"cliente@sporthub.co","password":"password"}' \
  http://localhost:8080/api/v1/auth/login | python3 -c 'import sys,json;print(json.load(sys.stdin)["accessToken"])')
# Disponibilidad para el servicio demo (agenda Lun-Vie 09:00-17:00)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/appointments/availability?serviceId=8f0a1e2d-3b4c-5d6e-7f80-9a1b2c3d4e5f&date=$(date -d 'next monday' +%F)"
```

## 2. Despliegue en nube (Render, blueprint)

1. Mantener el código en Azure Repos (`develop`) y espejarlo a GitHub (`edinsonvo/sportshub-c14`,
   rama `develop`), porque Render no integra Azure DevOps.
2. En Render: **New + → Blueprint** apuntando al repo de GitHub; seleccionar `infra/render/render.yaml`.
3. Definir secretos en cada servicio (el blueprint marca `sync: false`):
   - `JWT_SECRET` (≥32 bytes).
4. Verificar health: `https://sporthub-c14-backend.onrender.com/api/v1/health`.
5. El blueprint tiene `autoDeploy: true`: cada push a GitHub `develop` redespliega backend y frontend.
   Además, el repo `edinsonvo/sportshub-c14` tiene dos webhooks de push (evento `push`) apuntando a los
   Deploy Hooks privados de Render de backend y frontend, para garantizar el redespliegue automático.
   Las variables `RENDER_DEPLOY_HOOK_BACKEND`/`RENDER_DEPLOY_HOOK_FRONTEND` siguen siendo opcionales
   (útiles como alternativa para disparar despliegues desde CI).

| Servicio | URL |
|----------|-----|
| Frontend | https://sporthub-c14-frontend.onrender.com |
| Backend | https://sporthub-c14-backend.onrender.com |
| Health | https://sporthub-c14-backend.onrender.com/api/v1/health |
| Swagger | https://sporthub-c14-backend.onrender.com/swagger-ui.html |

## 3. Pipeline CI/CD (Azure DevOps)

- Importar `azure-devops/azure-pipelines.yml` en el proyecto `Fabrica_escuela_2026_1`.
- Variable groups: `sporthub-vars` (secretos) y `sonarcloud-service` (SonarCloud).
  Variables clave: `GITHUB_TOKEN`, `RENDER_DEPLOY_HOOK_BACKEND`, `RENDER_DEPLOY_HOOK_FRONTEND`,
  `sonarProjectKey`, `sonarOrganization`, `securityStrict`.
- Etapas: Validación → Pruebas → Calidad (SonarCloud Quality Gate) → Seguridad (gitleaks + trivy + OWASP) →
  Empaquetado (Docker + espejo a GitHub) → Despliegue (Render + health checks) → Posdepliegue (smoke tests).
- **PR policy**: comprobaciones obligatorias = pipeline en PR; mínimo 1 reviewer.
- El despliegue no se ejecuta en PR (`Build.Reason != PullRequest`).

## 4. Observabilidad

- Métricas: `http://localhost:8080/actuator/prometheus` (Prometheus todo scrapea en `backend:8080`).
- Grafana: panel "SportHub — Visión operativa" (health, latencia HTTP p95, citas creadas, heap JVM).
- Logs estructurados JSON en backend; correlación por `traceId`.
- Alertas recomendadas: `up{service="sporthub-backend"} == 0`, `http_errors_4xx_5xx` en ventana.

## 5. Reversión

- Re-desplegar el artefacto anterior (la imagen Docker queda taggeada con `$(Build.BuildId)`).
- La promoción por entorno mantiene `dev → qa → prod`; en producción el health check del blueprint impide cortar el tráfico a una instancia no saludable.

## 6. Checklist de seguridad antes de producción

- [ ] `JWT_SECRET` rotado y de ≥32 bytes (nunca el del `.env.example`).
- [ ] Cambiar contraseñas demo en la base de datos.
- [ ] Activar MFA para ADMIN (HU-56) y TLS obligatorio (Render lo entrega por defecto).
- [ ] CORS restringido al dominio del frontend.
- [ ] Quality Gate SonarCloud y escaneo Trivy pasando en el pipeline.
- [ ] Migraciones versionadas y prueba de restauración del respaldo.