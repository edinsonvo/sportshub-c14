# Informe de avance y novedades — SportHub (Caso 14)

**Fecha:** 2026-11-23  
**Alcance:** revisión **local únicamente**. No se hicieron push, merges remotos ni despliegues en Azure DevOps, GitLab ni Render.

---

## 1. Estado actual de la copia local

| Concepto | Valor |
|---|---|
| Repositorio | `/home/edinsonvo/Documentos/Default Project/Caso14-PlataformaReservas` |
| Rama | `develop` |
| HEAD local | `df5577d` — `Merged PR 7: feat(reservas): consultar y validar citas agendadas HU-35 (#227, #229)` |
| Origen del HEAD | `git fetch` de Azure DevOps `origin/develop` (lectura) |
| Actualización | **fast-forward** desde `3b5a362` → `df5577d` (14 commits nuevos) |
| Árbol de trabajo | Limpio; este informe queda como archivo nuevo sin commitear |
| Cambios en la nube | **Ninguno en esta sesión** |

Se recuperaron 14 commits que estaban solo en Azure (noviembre 12–23) y se incorporaron al historial local sin resolver conflictos (fast-forward).

---

## 2. Evolución: de la versión inicial a la actual

| Fecha | Hitos / commits | Descripción |
|---|---|---|
| 2026-09-19 | `2ac7587` | Implementación inicial del backend para sistema de reservas. |
| 2026-09-21 | `3cac6c4`, `f251026` | Actualización de HU-06 y HU-12; merge del modelo y Sprint 1. |
| 2026-10-13 | `cfb36b4`, `5a66f45` | Control de accesos por roles en frontend e identidad visual (logo). |
| 2026-10-16/18 | `0c5d10d`, `281421b`, `89afb8c`, `9ec68b2` | Frontend Sprint 2, ampliación de servicios y merge del PR 2. |
| 2026-10-18 | `94fbfc1`, `426992b` | Configuración de despliegue: URLs públicas, normalización de API, blueprint de Render en rama `develop`. |
| 2026-11-06 | `59ddad7` | **Fase 3 local:** portales admin, proveedor, staff y cliente; seguridad y pruebas. |
| 2026-11-06 | `80a1e0e`, `b8a9f10` | README y pipeline v1.0.0; integración de Azure + GitLab + trabajo local. |
| 2026-11-06 | `454331b`, `3b5a362` | Hotfix de arranque (`findFirstByUserId`) y documentación de la limpieza de duplicados. |
| 2026-11-12 | `b8321b3` | Frontend: reportes de uso y agenda accesible. |
| 2026-11-19 | `643c91f` → `601dd04` | HU-39: finalización de citas en backend (campo `completed_at`, lógica, pruebas y migración SQL). |
| 2026-11-20 | `474768c`, `e971c3b`, `af27ecc` | Vistas de historial del cliente y citas del cliente; merge del PR 4. |
| 2026-11-23 | `034523d`, `c801d74`, `14c2cea`, `df5577d` | Vista finalizar-cita; HU-35 consultar y validar citas agendadas; merge del PR 7. |

Total en el historial: **31 commits**, con aportes de 10 autores.

---

## 3. Novedades incorporadas en los 14 commits de Azure

### Backend

- **HU-39 — Finalización de citas**
  - `Appointment` tiene un campo `completed_at` (`Instant`) y el método `markCompleted(...)` junto con el cambio de estado a `COMPLETADA`.
  - `AppointmentResponse` expone `completedAt` al frontend.
  - `AppointmentService.complete(...)` registra auditoría con `completedAt=...` y valida que **la hora de fin programada ya haya pasado**, interpretando las fechas en `America/Bogota`. Si no, lanza `CITA_NO_CONCLUIDA` (409).
  - Migración repeatable: `infra/postgres/migrations/2026-11-19_hu39_completed_at.sql` (`ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ`) y columna añadida al esquema inicial `infra/postgres/init/01-schema.sql`.
  - Nuevas pruebas unitarias: `AppointmentServiceTest` (+208 líneas).

- **HU-35 — Consultar y validar citas**
  - Nuevo endpoint `GET /api/v1/appointments/{id}` (`AppointmentController.getById`).
  - `AppointmentService.getById(...)`: el rol `CLIENT` solo puede consultar sus propias citas (403 en caso contrario); proveedor/staff pasan por `requireProviderAccess(...)`.
  - `listMine(...)` valida que `from` no sea posterior a `to` (`RANGO_FECHAS_INVALIDO`, 400).

### Frontend

- Nuevas rutas: `/agenda`, `/reportes`, `/mis-citas`, `/citas-clientes`, `/historial-cliente`, `/finalizar-cita`.
- `/agendar-cita` recibe un ajuste menor.
- El build genera **32 páginas estáticas** y todas las rutas nuevas se prerenderizan correctamente.
- Solo `/mis-citas` consume la API real (`GET /appointments` mediante `api<...>` y sesión local).

---

## 4. Pruebas ejecutadas en local

| Prueba | Comando | Resultado |
|---|---|---|
| Backend (Spring Boot) | `mvn -o -q test` (Docker `maven:3.9.9-eclipse-temurin-17`, Java 17, H2) | **17 suites, 83 tests, 0 fallos, 0 errores, 0 omitidos** |
| Frontend (Vitest) | `npm test` (Docker `node:20-alpine`) | **1 archivo, 6 tests, 0 fallos** |
| Frontend (build) | `npm run build` | **OK**, 32 rutas generadas |

Advertencias no bloqueantes del build de Next/ESLint: uso de `<img>` en varias páginas y dependencia faltante en un `useEffect` de `/proveedor`.

---

## 5. Hallazgos a revisar antes de cualquier cambio en la nube

1. **Páginas nuevas con datos mock.** `/reportes`, `/historial-cliente` y `/finalizar-cita` usan constantes `*_MOCK`; `/agenda` y `/citas-clientes` se inicializan con arreglos `CITAS_INICIALES`. Únicamente `/mis-citas` llama a la API real. Si se publica tal cual, esas vistas no reflejarán información de PostgreSQL.
2. **Migración manual.** `2026-11-19_hu39_completed_at.sql` no se aplica automáticamente. En Render el backend usa `JPA_DDL_AUTO=update`, por lo que Hibernate debería crear `completed_at` solo; la migración es de respaldo para esquemas gestionados a mano. Verificar antes de ejecutarla (es repetible, `IF NOT EXISTS`).
3. **Cambio de regla de negocio.** Finalizar una cita ahora falla con 409 si aún no llegó su hora de fin. Afecta flujos de prueba rápidos que marcan citas futuras como completadas.
4. **Control de acceso nuevo.** `GET /appointments/{id}` puede devolver 403 si el frontend no envía el token o si el proveedor no es dueño del servicio; conviene probarlo con los usuarios demo.
5. **Sincronización de repos.** Los 14 commits nuevos están en Azure y ahora en local, pero **no se empujaron a GitLab**. Render despliega desde GitLab `develop`, así que esos cambios aún no están disponibles allí.
6. **Estado cloud sin verificar en esta sesión.** No se consultó el estado actual de Render/GitLab; el último estado conocido (7 nov) era backend `454331b` en `live`. No se realizó ninguna acción sobre la nube.

---

## 6. Próximos pasos propuestos (no ejecutados)

1. Confirmar con el equipo si las páginas con mock son prototipos aceptados o si deben conectarse a endpoints reales.
2. Validar en un entorno local con PostgreSQL que `completed_at` se crea correctamente y que los flujos HU-39/HU-35 responden como se espera.
3. Revisar la compatibilidad del cambio de "finalización anticipada" con las pruebas de aceptación.
4. Si se aprueba: sincronizar `develop` a GitLab y dejar que Render despliegue; verificar health, login y nuevas rutas.
5. Solo después de esa revisión, actualizar README e informe de despliegue con la nueva versión.

---

## Anexo — comandos utilizados

```bash
git fetch <azure-url> develop
git merge --ff-only FETCH_HEAD
mvn -o -q test                    # backend, vía Docker maven:3.9.9-eclipse-temurin-17
npm test && npm run build         # frontend, vía Docker node:20-alpine
```

> Este documento se creó originalmente solo en local. La sección 7 registra la conexión posterior de los mocks y la publicación autorizada.

---

## 7. Actualización: conexión de mocks y publicación (2026-11-23)

### Cambios implementados

- **Backend**: nuevo endpoint `GET /api/v1/appointments/clients`, que devuelve el directorio de clientes derivado de las citas visibles según el rol del usuario autenticado (`ClientSummaryResponse`, `ClientDirectoryService`, `ClientDirectoryController`).
- **Helper compartido** `frontend/src/lib/appointments.ts`: carga de citas, servicios y clientes; mapeo de estados a las etiquetas de cada vista; acciones PATCH (`confirm`, `complete`, `cancel`) y formateo de fechas/horas/nombres.
- **Vistas conectadas a la API real** (sin datos mock):
  - `/reportes`: cuenta solicitudes por servicio desde `/appointments` + `/services/mine` para el rango de fechas.
  - `/finalizar-cita`: selector real de citas, validación local de hora de fin en `America/Bogota` y llamada a `/appointments/{id}/complete`.
  - `/agenda`: carga citas/clientes/servicios, filtro por fecha y acciones reales de confirmar/finalizar/cancelar.
  - `/citas-clientes`: listado real, búsqueda/filtros y cambio de estado mediante PATCH.
  - `/historial-cliente`: selector de cliente desde `/appointments/clients`, historial filtrable por rango/estado y resumen calculado con datos reales.
- Las vistas muestran estados de carga, errores con opción de reintento y botones deshabilitados cuando no hay una transición válida.

### Verificación local tras los cambios

| Prueba | Resultado |
|---|---|
| Backend `mvn -o -q test` | **17 suites, 83 tests, 0 fallos** |
| Frontend `npm test` | **1 archivo, 6 tests, 0 fallos** |
| Frontend `npx tsc --noEmit` | **OK** |
| Frontend `npm run build` | **OK**, 32 rutas generadas |

### Publicación (según pipeline)

El pipeline `azure-devops/azure-pipelines.yml` espeja `develop` a GitLab (`git push gitlab HEAD:develop`) y Render despliega automáticamente porque `infra/render/render.yaml` define `autoDeploy: true` para ambos servicios web contra la rama `develop` de `https://gitlab.com/udea-fe2026-2/sporthub`. La verificación posterior consiste en los smoke tests documentados: health del backend, frontend HTTP 200, métricas y login demo.
