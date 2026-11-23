# Entorno de Gestión en Azure DevOps — Fabrica_escuela_2026_1 (Caso 14)

Guía para replicar el entorno operativo de gestión del proyecto **SportHub** en Azure DevOps,
alineada con los *Lineamientos Integrados CodeF@ctory v2.0* (proyecto avanzado).

---

## 1. Entornos y cuentas

| Recurso                | Proveedor | Uso                                                            |
|------------------------|-----------|----------------------------------------------------------------|
| Código fuente          | Azure Repos (`jisaacrios/Fabrica_escuela_2026_1`) | Monorepo `sportshub-backend`, ramas `develop` y `main` |
| Espejo de despliegue   | GitHub (`edinsonvo/sportshub-c14`) | Rama `develop`; Render no soporta Azure Repos |
| Backlog + métricas     | Azure DevOps (org `jisaacrios`) | Proyecto `Fabrica_escuela_2026_1` |
| CI/CD                  | Azure Pipelines | `azure-devops/azure-pipelines.yml` (validación→pruebas→calidad→seguridad→empaquetado→despliegue→posdepliegue) |
| Control de calidad     | SonarCloud, proyecto `sporthub` | Quality Gate: cobertura ≥65 %, deuda ≤2 días, complejidad <50, 0 vulnerabilidades críticas |
| Nube de despliegue     | Render (blueprint `infra/render/render.yaml`) | Backend + frontend contenerizados + PostgreSQL administrado |
| Observabilidad         | Prometheus + Grafana | Dashboards y alertas (`infra/`) |

## 2. Creación del proyecto

1. **Organización**: `https://dev.azure.com/jisaacrios` — proyecto privado **`Fabrica_escuela_2026_1`**.
2. **Proceso**: elegir **Scrum** (Backlog Items) para usar épicas, features, HU y sprints.
3. **Áreas**: Área raíz `Fabrica_escuela_2026_1` + sub-áreas opcionales `Reservas`, `Seguridad`, `Reportes`.
4. **Iteraciones** (Sprints de 3 semanas):
   - `Fabrica_escuela_2026_1\Sprint 1` (registro/auth + KYC + agendar cita)
   - `Fabrica_escuela_2026_1\Sprint 2` (servicios, agenda, personal, confirmación)
   - `Fabrica_escuela_2026_1\Sprint 3` (historiales, filtros, reportes, MFA, auditoría)
5. **Repositorio**: Azure Repos `Fabrica_escuela_2026_1/sportshub-backend`; proteger `main` y `develop`
   (*branch protection*: mínimo 1 reviewer, comprobaciones obligatorias = pipeline PR).
6. **Espejo GitHub**: `edinsonvo/sportshub-c14` en rama `develop`. El pipeline lo actualiza
   automáticamente si existe `GITHUB_TOKEN` en el grupo `sporthub-vars`.

## 3. Importar el backlog

```powershell
./azure-devops/scripts/import-backlog.ps1 `
    -Organization "<org>" `
    -Project "Fabrica_escuela_2026_1" `
    -Pat "$env:AZURE_DEVOPS_PAT" `
    -CsvPath "azure-devops/backlog/backlog-fabrica_escuela_2026_1_import.csv" `
    -Iteration "Sprint 1"
```

El script crea 8 **épicas** y 57 **historias de usuario** con criterios de aceptación Gherkin en `Description`,
prioridad MoSCoW y jerarquía padre→hijo. Los IDs internos los asigna Azure DevOps (para trazabilidad en ramas
use `feature/HU-XX-<descripción>`).

## 4. Tablero y sprints

- Configurar **Sprint 1** con tareas por historia (día, responsable, estimación de horas).
- Cada tarea desglosada: `Crear prototipo` → `Crear Front-End` → `Crear Back-End` → `Integrar Front y Back` → `Pruebas` (como las del CSV original).
- Estados: `New → Active → Resolved → Closed`; mover el estado de HU solo cuando cumpla DoD.

## 5. Definition of Ready / Definition of Done (DoR/DoD)

- **DoR**: HU clara, criterios de aceptación Gherkin, prioridad, tamaño estimado, sin dependencias bloqueantes.
- **DoD** (lineamiento 9.1): cumple criterios funcionales → código revisado por PR con pipeline verde →
  pruebas unitarias/integración ejecutadas → Quality Gate y controles de seguridad OK →
  documentación/API/migraciones actualizadas → accesibilidad verificada (si UI) → despliegue probado con logs/métricas → cero defectos y vulnerabilidades críticas.

## 6. Dashboards y métricas

- **Burndown del proyecto** y de **cada sprint** (widgets nativo de Azure DevOps).
- **Métricas de flujo** (adicionales al conteo): *Cycle Time*, *Lead Time* y *Throughput*
  (widget `Analytics` → consultas de estado de WIP).
- **Query de control**: "HU cerradas en sprint vs comprometidas" para velocidad del equipo.
- **SAMM**: evaluación inicial en Sprint 1 y final en Sprint 3 (evidencia adjunta en wiki del proyecto).

## 7. Retrospectivas y cierre

- Retrospectiva al final de cada sprint con acciones verificables (asignadas a un dueño y fecha).
- Lecciones aprendidas y cierre formal con validación de métricas y SAMM final.

## 8. Enlaces de referencia

- Azure Repos: https://dev.azure.com/jisaacrios/Fabrica_escuela_2026_1/_git/sportshub-backend
- GitHub (espejo): https://github.com/edinsonvo/sportshub-c14
- Frontend Render: https://sporthub-c14-frontend.onrender.com
- Backend Render: https://sporthub-c14-backend.onrender.com
- Health: https://sporthub-c14-backend.onrender.com/api/v1/health