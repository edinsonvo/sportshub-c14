# Presentación: Despliegue en Render de SportHub (Caso 14)

## Índice
1. Objetivo
2. Estado inicial del proyecto
3. Decisiones de arquitectura de despliegue
4. Análisis del código fuente y adaptaciones
5. Preparación del repositorio (Azure → GitLab, sincronización de cambios)
6. Configuración del Blueprint en Render
7. Despliegue automatizado vía API de Render
8. Ajuste de datos (workaround para inconsistencia de semilla)
9. Pruebas de validación (Smoke test)
10. Fallos, dificultades y limitaciones
11. Soluciones aplicadas
12. Conclusión
13. URLs finales


## 1. Objetivo

Desplegar la aplicación **SportHub** (Caso 14) en **Render.com** para obtener un entorno de pruebas completamente funcional, con el frontend, backend, base de datos PostgreSQL y todas las funcionalidades de deportes funcionando, respetando las reglas de negocio por rol definidas en el backend.

## 2. Estado inicial del proyecto

- **Repositorio original:** Azure DevOps Repos (`dev.azure.com/jisaacrios/Fabrica_escuela_2026_1/_git/sportshub-backend`) con rama `develop` y múltiples sprints (incluye trabajo de otros integrantes).
- **Estructura:** `backend` (Spring Boot 3.3.5 + Java 17), `frontend` (Next.js 15), `infra` (docker-compose), `azure-devops`, `docs`.
- **Sin despliegue a nube:** Existía `azure-pipelines.yml` para Azure DevOps, pero se optó por Render.
- **Trabajos realizados previamente:** Páginas de deportes completas (hub, instalaciones, clases, membresías, implementos, torneos), alineación de permisos por rol al backend, normalización de API, y configuración inicial para Render.
- **Ambiente local:** Stack completo levantado con Docker Compose (DB, backend, frontend, Prometheus, Grafana).

## 3. Decisiones de arquitectura de despliegue

### 3.1 Elección de plataforma
Se eligió **Render** (versión gratuita) por simplicidad de despliegue (Docker + Blueprint + autosync). Sin embargo, surgió una incompatibilidad crítica: **Render no soporta Azure DevOps Repos** como proveedor Git (únicamente GitHub, GitLab, Bitbucket).

### 3.2 Estrategia de repositorio
Dado que Render no integra Azure DevOps, se creó un **espejo a GitLab**: el código se mantiene sincronizado entre Azure `develop` y GitLab `develop` (con rama `main` bloqueada por protecciones). Render se conecta al repositorio GitLab.

### 3.3 Patrón de despliegue
Se optó por desplegar mediante **servicios Docker** (no buildpacks nativos de Render), ya que:
- El proyecto ya poseía `Dockerfile` para backend y frontend.
- Requería pasar build-args (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_DEMO_SERVICE_ID`) al frontend.
- Garantizaba equivalencia con el ambiente local.

### 3.4 Base de datos
Se utilizó **Render PostgreSQL (free tier)**. Render entrega variables de conexión internas (no un DSN JDBC completo con `postgres://` usable directo), por lo que el backend construye `jdbc:postgresql://host:port/db` a partir de `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

### 3.5 URLs públicas entre servicios
Para referenciar la URL pública del backend en el frontend y las CORS del backend hacia el frontend, **no es válido** usar `fromService.property: url` para servicios tipo `web` en el Blueprint de Render. La propiedad correcta es `fromService.envVarKey: RENDER_EXTERNAL_URL`, que expone la URL pública del servicio (`https://<service>.onrender.com`) sin esquema de formato interno.

## 4. Análisis del código fuente y adaptaciones

Se comparó la copia local de trabajo con el clon de Azure `develop` (origen de verdad). Se detectaron diferencias relevantes:

### 4.1 Archivos de despliegue
- `frontend/src/lib/api.ts`: Se **normalizó** para asegurar que `API_URL` termine siempre en `/api/v1`. El código toma `NEXT_PUBLIC_API_URL` (puede venir con o sin `/api/v1`), le remueve barras finales y concatena `/api/v1` si falta.
- `.gitignore`: Se fusionó conservando las exclusiones del repo de Azure (más completas) y añadiendo exclusiones para despliegue local (`.Rhistory`, `.RData`, `render-local.yaml`).
- `infra/render/render.yaml`: **Reescrito completamente**. Puntos clave: usa `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` desde `fromDatabase` (no `connectionString` JDBC), usa `fromService.envVarKey: RENDER_EXTERNAL_URL` para cross-references entre servicios, fija `region: oregon`, planes `free`, `autoDeploy: true`, `healthCheckPath: /api/v1/health`, `DEMO_DATA_SEED=true`, `JPA_DDL_AUTO=update`, `JWT_SECRET` marcado como `sync: false` (definido al crear el servicio).

### 4.2 Revisión de seed de datos
El `DemoDataInitializer` (rama Azure) ya incluía:
- Usuarios demo: `admin@sporthub.co`, `cliente@sporthub.co`, `belleza@sporthub.co`/`laura@sporthub.co` (STAFF), `deportes@sporthub.co` (PROVIDER), `entrenador@sporthub.co` (STAFF)
- Datos de deportes (DEPORTES_PROVIDER_ID, DEPORTES_STAFF_ID, instalaciones, clases, plan, implemento, torneo, horarios)

Se detectó una **inconsistencia crítica** entre `@UuidGenerator` (Hibernate 6) y los IDs manualmente asignados en el seed. Al utilizar `setId()` con UUIDs fijos, Hibernate **sobrescribe** esos IDs con UUIDs generados al persistir (momento de flush), pero las referencias FK dentro de la misma transacción a veces leen el valor "pre-flush", generando desajuste entre `provider.id` (generado) y `provider_staff.provider_id` / otras entidades (quedando con IDs constantes). Esto explica por qué `/proveedor/me` devolvía 404 para STAFF tras el primer despliegue.

## 5. Preparación del repositorio (Azure → GitLab, sincronización de cambios)

Dado que Azure DevOps no es soportado por Render, se realizó la sincronización:

1. **Clonado base**: Se clonó Azure `develop` a `/tmp/opencode/azure-clone` (preservando historia completa del equipo).
2. **Comparación**: Se detectó que Azure `develop` estaba **adelantado** (incluía páginas de Sprint 2 del compañero) respecto a la copia local, pero esta última contenía los deltas de despliegue. Se decidió **tomar Azure como base** y aplicar únicamente los deltas de despliegue.
3. **Deltas aplicados**: 
   - `frontend/src/lib/api.ts` (normalización de URL)
   - `infra/render/render.yaml` (Blueprint finalizado con GitLab y `RENDER_EXTERNAL_URL`)
   - `.gitignore` (merge entre ambos)
4. **Commit a Azure**: `chore(deploy): configurar Render (URLs públicas, normalización API, gitignore)`, posteriormente `chore(deploy): usar rama develop en el blueprint de Render`. Ambos commits fueron empujados exitosamente a Azure `develop`.
5. **Espejo a GitLab**: Se creó el proyecto `udea-fe2026-2/sporthub` en GitLab (privado). Inicialmente hubo **bloqueo por protección de rama `main`** (el token Project Access Token con rol Developer no podía hacer el commit inicial a rama protegida). Tras relajar la protección temporalmente, se logró empujar `develop` (y `main` → forzado a nuestro árbol; Render usa `develop`). El repo GitLab quedó con el commit `426992bf`.
6. **Versión final 1.0.0 (Fase 3)**: se integró el trabajo local `59ddad7` con Azure `426992b` y el ajuste de GitLab `9ec68b2`. El commit de integración desplegado es `b8a9f10`; el pipeline de Azure espeja automáticamente `develop` a GitLab cuando existe `GITLAB_TOKEN`.

## 6. Configuración del Blueprint en Render

El archivo `infra/render/render.yaml` quedó con la siguiente configuración crítica:

- **Base de datos**: `sporthub-db` (free, oregon). Variables inyectadas como `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` vía `fromDatabase.property`.
- **Backend**: `sporthub-c14-backend`, runtime `docker`, rootDir `backend`, Dockerfile `./Dockerfile`, `healthCheckPath: /api/v1/health`, `autoDeploy: true`, branch `develop`. Env vars: DB_* desde DB, `JWT_SECRET: sync:false`, `DEMO_DATA_SEED: true`, `JPA_DDL_AUTO: update`, `MAX_LOGIN_ATTEMPTS:5`, `LOGIN_LOCKOUT_MINUTES:30`, `CORS_ALLOWED_ORIGINS` via `fromService.envVarKey: RENDER_EXTERNAL_URL` apuntando al frontend.
- **Frontend**: `sporthub-c14-frontend`, runtime `docker`, rootDir `frontend`, build args vía env `NEXT_PUBLIC_API_URL` via `fromService.envVarKey: RENDER_EXTERNAL_URL` apuntando al backend, `NEXT_PUBLIC_DEMO_SERVICE_ID: 8f0a1e2d-3b4c-5d6e-7f80-9a1b2c3d4e5f`.

**Validación del Blueprint:** Tras conectar GitLab a Render (OAuth con acceso al grupo `udea-fe2026-2`), `render blueprints validate` retornó `valid: true` con 4 acciones (crear DB + backend + frontend).

## 7. Despliegue automatizado vía API de Render

Dado que el CLI no soportaba creación del Blueprint (endpoint en early access/no disponible), se realizó el despliegue **directamente vía Render REST API** con token Bearer del CLI (`~/.render/cli.yaml`):

1. **Crear PostgreSQL** `POST /v1/postgres` (name `sporthub-db`, free, oregon, version 16). Render generó DB name/user con sufijo (`sporthub_6um3_user`, `sporthub_6um3`). Se obtuvo `connection-info` (host interno `dpg-dbaiktm1egvs73aru20g-a`, puerto 5432) para construir las variables internas.
2. **Generar JWT_SECRET** con `openssl rand -hex 32`.
3. **Crear backend** `POST /v1/services` tipo `web_service` con `runtime: docker`, `rootDir: backend`, `repo: https://gitlab.com/udea-fe2026-2/sporthub`, `branch: develop`, `healthCheckPath: /api/v1/health`, env vars con DB_* internos + JWT_SECRET + DEMO_DATA_SEED + JPA_DDL_AUTO + limits + `CORS_ALLOWED_ORIGINS=https://sporthub-c14-frontend.onrender.com`. Resultado: `srv-dbailou1egvs73as0t0g`, URL pública `https://sporthub-c14-backend.onrender.com`.
4. **Crear frontend** `POST /v1/services` con `rootDir: frontend`, env vars `NEXT_PUBLIC_API_URL=https://sporthub-c14-backend.onrender.com`, `NEXT_PUBLIC_DEMO_SERVICE_ID` fijo. Resultado: `srv-dbailum1egvs73as1i3g`, URL pública `https://sporthub-c14-frontend.onrender.com`.

Ambos servicios iniciaron `build_in_progress` sobre el commit de integración `b8a9f10` (versión 1.0.0, Fase 3). Se monitorizaron los `deploys` vía API: el frontend pasó a `live` primero (build de Next rápido) y respondió `200`. El backend también pasó a `live`, pero su proceso entraba en *crash loop* por los proveedores/staff duplicados descritos en la sección 8.3. Se corrigió con el commit `454331b` y un nuevo despliegue automático desde GitLab `develop`.

## 8. Corrección de la semilla de datos y arranque del backend

### 8.1 Antecedente: UUIDs generados por Hibernate
En Spring Data JPA con Hibernate 6, cuando una entidad tiene `@UuidGenerator` en su clave primaria, cualquier valor asignado manualmente vía `setId(...)` es sobrescrito por el generador al momento del flush. Esto provocaba que entidades hijas (`ProviderService`, `ServiceSchedule`, `ProviderStaff`, `Instalacion`) quedaran asociadas a UUIDs antiguos o nulos mientras la entidad padre recibía un nuevo identificador autogenerado.

### 8.2 Solución Fase 3: encadenamiento de entidades persistidas
Se refactorizó `DemoDataInitializer.java` para capturar la entidad persistida después de cada `save(...)` y usar sus identificadores generados reales (`provider.getId()`, `staff.getId()`, `service.getId()`). Las instalaciones y horarios se asocian directamente a esos IDs. Con esto, un despliegue limpio inicializa los datos y relaciones sin scripts SQL manuales.

### 8.3 Incidencia del despliegue 1.0.0: duplicados históricos
Al desplegar la versión 1.0.0 (commit `b8a9f10`) el backend entró en *crash loop* y Render devolvió `502/503`:

- **Síntoma en logs:** `IncorrectResultSizeDataAccessException: Query did not return a unique result: 15 results were returned` en `DemoDataInitializer.seedServicios`.
- **Causa raíz:** versiones anteriores del inicializador creaban `Provider` y `ProviderStaff` sin comprobar si ya existían para el usuario. Quince reinicios acumularon 15 filas por usuario. El nuevo código usaba `findByUserId(...)` con retorno `Optional`, que falla cuando hay más de una fila.
- **Limpieza de datos:** se conservaron los IDs canónicos y se eliminaron las filas duplicadas y heredadas (proveedores 30→2, staff 30→2, `provider_service` 15→0, `service_schedule` 75→0). El seed recrea los datos dependientes al arrancar.
- **Endurecimiento en código:** `ProviderRepository` y `ProviderStaffRepository` ahora exponen `findFirstByUserId(...)`; se actualizaron todas las llamadas y pruebas (commit `454331b`). Así el arranque no falla aunque vuelvan a existir filas duplicadas.

## 9. Pruebas de validación (Smoke test)

Validación ejecutada tras el despliegue del commit `454331b` (password demo: `password`):

- **Health backend:** `GET /api/v1/health` → `200` con `{"status":"UP","service":"sporthub-backend"}`.
- **Autenticación:** login `200` para `admin@sporthub.co` (ADMIN), `belleza@sporthub.co` y `deportes@sporthub.co` (PROVIDER), `laura@sporthub.co` y `entrenador@sporthub.co` (STAFF).
- **Panel admin:** `GET /api/v1/admin/stats` → `200` con `totalUsers: 7`, `totalProviders: 2`, `totalStaff: 2`, `totalFacilities: 2`, `totalClasses: 1`, `totalTournaments: 1`. `GET /api/v1/admin/users` → `200`.
- **Portales proveedor/staff:** `GET /api/v1/providers/profile` → `200` para los cuatro usuarios, con los IDs canónicos:
  - Belleza: `002d6edf-c02f-4967-8d50-534b90bb084d`
  - Deportes: `1f04e0d1-71d9-4ae4-be6a-943824dda611`
- **Integridad de datos tras el seed:** `provider=2`, `provider_staff=2`, `provider_service=1`, `service_schedule=5`, `instalacion=2`, `clase_grupal=1`, `plan_membresia=1`, `implemento=1`, `torneo=1`; exactamente **1 proveedor y 1 staff por usuario**.
- **Frontend:** `https://sporthub-c14-frontend.onrender.com` → `200`, mostrando `Fase 3 Final` y `Portales Integrados por Perfil de Usuario`.

## 10. Fallos, dificultades y limitaciones

### 10.1 Fallos técnicos
- **Render no soporta Azure DevOps**: Incompatibilidad directa entre plataforma elegida y repositorio existente.
- **Blueprint `property: url` inválido**: El primer intento con `fromService.property: url` fue rechazado por validación (propiedad inexistente para servicios tipo `web`). La documentación de Blueprint requiere `envVarKey: RENDER_EXTERNAL_URL` para URLs públicas.
- **Protección de rama GitLab**: Token Project Access Token (rol Developer) no podía empujar commit inicial a rama `main` protegida. Solucionado relajando protección temporalmente.
- **UUID override en seed**: Inconsistencia `@UuidGenerator` vs IDs manuales → referencias FK desalineadas en BD fresca. Corregido en Fase 3 encadenando las entidades persistidas en `DemoDataInitializer`.
- **Duplicados históricos en PostgreSQL**: versiones anteriores del seed crearon repetidamente `Provider`/`ProviderStaff`, acumulando 15 filas por usuario. El arranque fallaba con `IncorrectResultSizeDataAccessException`. Se limpiaron los duplicados y se cambió a `findFirstByUserId` (commit `454331b`).
- **Rutas no mapeadas devuelven 500**: Endpoints inexistentes como `/deportes` raíz retornaban 500 en lugar de 404 debido al manejador global de excepciones. Es un comportamiento preexistente (no introducido por despliegue).

### 10.2 Dificultades
- **Sincronización entre repos**: Azure `develop` ya contenía trabajo del equipo (páginas adicionales) mientras la copia local aportaba deltas de despliegue → necesidad de fusión cuidadosa (tomar Azure como base).
- **Creación del Blueprint via CLI/API**: `render blueprints create` no disponible públicamente (early access). Se optó por crear recursos individualmente vía `POST /v1/services` y `POST /v1/postgres` (más verboso, requiere conocer esquemas exactos).
- **Esquemas de API Render**: Necesidad de inspeccionar OpenAPI de Render para armar payloads correctos (`webServiceDetailsPOST`, `envSpecificDetailsPOST`, `envVarInputArray`).
- **Conexión a PostgreSQL**: Acceso externo bloqueado por IP allowlist; `render psql` no tenía `psql` client local → uso de Docker `postgres:16` + allowlist temporal de IP.
- **Diagnóstico de seed**: Confirmar el mismatch requirió inspeccionar tablas y corregir por SQL (rápido) vs refactorizar el seed (más completo).

### 10.3 Limitaciones
- **Tier gratuito Render**: PostgreSQL free expira (~30 días), web services free entran en suspensión por inactividad (cold start prolongado tras inactividad), CPU/memoria limitados.
- **Sincronización Azure→GitLab**: el pipeline de Azure incluye un job de espejo (`git push` a GitLab `develop`) que se ejecuta cuando existe `GITLAB_TOKEN` en el grupo `sporthub-vars`. Si el token no está configurado, el job se omite y la sincronización debe hacerse manualmente.
- **Fix definitivo en código (Resuelto en Fase 3)**: Se refactorizó `DemoDataInitializer.java` para encadenar las entidades persistidas (`provider.getId()`), garantizando que cualquier inicialización o reinicio de base de datos sea 100% automático y consistente.
- **Rutas 500 para no mapeadas**: Pequeña molestia para pruebas (no afecta flujos funcionales).
- **Branch `develop` para Render**: Por protección de `main` en GitLab, se usó `develop` como rama de despliegue.

## 11. Soluciones aplicadas

- **BluePrint corregido**: Reemplazo de `property: url` por `envVarKey: RENDER_EXTERNAL_URL`.
- **Espejo Azure→GitLab**: push directo a Azure `develop` y GitLab `develop`; a partir de la Fase 3 el pipeline puede repetir el espejo automáticamente con `GITLAB_TOKEN`.
- **Despliegue por API**: Orquestación directa de DB + backend + frontend con payloads conformes a OpenAPI.
- **Normalización de API**: `api.ts` asegura sufijo `/api/v1`.
- **Reparación de datos**: seed encadenado a los IDs generados por persistencia; sin IDs manuales.
- **Limpieza de duplicados**: se conservaron los registros canónicos por usuario y se eliminaron las filas repetidas y heredadas de `provider`, `provider_staff`, `provider_service`, `service_schedule` y catálogos de deportes.
- **Arranque tolerante**: `findFirstByUserId` en `ProviderRepository`/`ProviderStaffRepository` evita el fallo si existen filas duplicadas.
- **Validación exhaustiva**: smoke test de health, login por rol, panel admin, portales proveedor/staff, integridad de datos y frontend.

## 12. Conclusión

El despliegue quedó **operativo y verificado** sobre el commit `454331b`: backend y frontend en Render responden `200`, PostgreSQL conectado, autenticación demo funcionando para ADMIN/PROVIDER/STAFF, panel admin con métricas correctas y portales de proveedor/staff accesibles. Las principales complejidades fueron la **no-soportación de Azure DevOps por Render**, el detalle de **`RENDER_EXTERNAL_URL`** en el Blueprint, el **bug de semilla por UUIDs** y los **duplicados históricos de proveedores/staff**; todos quedaron resueltos en código (`DemoDataInitializer` + `findFirstByUserId`) y en datos (limpieza de registros canónicos). La solución es reproducible y está documentada para futuros despliegues.

## 13. URLs finales

- **Frontend:** https://sporthub-c14-frontend.onrender.com
- **Backend:** https://sporthub-c14-backend.onrender.com
- **Health:** https://sporthub-c14-backend.onrender.com/api/v1/health
- **GitHub (repo activo desde 2026-11-23):** https://github.com/edinsonvo/sportshub-c14 (rama `develop`)
- **GitLab (espejo histórico, ya no usado por Render):** https://gitlab.com/udea-fe2026-2/sporthub
- **Azure (origen):** https://dev.azure.com/jisaacrios/Fabrica_escuela_2026_1/_git/sportshub-backend (rama `develop`)
- **Commit desplegado:** `454331b` (hotfix sobre `b8a9f10`, versión 1.0.0 Fase 3)
- **Servicios Render:** backend `srv-dbailou1egvs73as0t0g`, frontend `srv-dbailum1egvs73as1i3g`

**Credenciales demo:** `admin@sporthub.co`, `cliente@sporthub.co`, `belleza@sporthub.co`/`laura@sporthub.co` (STAFF), `deportes@sporthub.co` (PROVIDER), `entrenador@sporthub.co` (STAFF) | `password`
