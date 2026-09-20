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
| Personal| laura@sporthub.co    |

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

1. Subir el repositorio a GitHub (`main` protegida; ramas `feature/<HU>-<desc>`).
2. Crear en Render: **New + → Blueprint** apuntando al repo; seleccionar `infra/render/render.yaml`.
3. Definir secretos en cada servicio (el blueprint marca `sync: false`):
   - `JWT_SECRET` (≥32 bytes).
   - (Neon/Supabase) `DATABASE_URL` según servicio admin.
4. Verificar health: `https://sporthub-backend.onrender.com/api/v1/health`.
5. Conectar el Deploy Hook de cada servicio a Azure Pipelines (`RENDER_DEPLOY_HOOK_DEV`, etc.).

## 3. Pipeline CI/CD (Azure DevOps)

- Subir `azure-devops/azure-pipelines.yml` a la raíz del repo y crear el pipeline en la organización.
- Variable groups: `sporthub-vars` (PAT, Deploy Hooks, URLs) y `sonarcloud-service` (token/org/projectKey).
- Etapas: Validación → Pruebas → Calidad (SonarCloud Quality Gate) → Seguridad (SCA/SAST/secretos/Trivy) → Empaquetado (imágenes inmutables) → Despliegue (promoción dev) → Posdepliegue (smoke tests + evidencia de reversión).
- **PR policy**: comprobaciones obligatorias = pipeline en PR; mínimo 1 reviewer.

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