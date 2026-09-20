#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera el backlog CSV de Fabrica_escuela_2026_1 (Caso 14) con criterios de aceptación en Gherkin."""
import csv

# (id_humano, tipo, titulo, epic, feature, prioridad, sprint, gherkin)
HU = [
("HU-01","User Story","Registrar cuenta de usuario","E1 Cuentas de usuario","Autenticación y perfil","Must","Sprint 1",
"Característica: Registro de cuenta de usuario\n"
"  Escenario: Registro exitoso\n"
"    Dado que soy un visitante en la página de registro\n"
"    Cuando diligencio correo, nombre, teléfono y una contraseña que cumple la política\n"
"    Y acepto los términos y condiciones\n"
"    Entonces el sistema crea la cuenta con rol CLIENT\n"
"    Y envía un correo de confirmación\n"
"  Escenario: Correo ya registrado\n"
"    Dado que existe una cuenta con el correo \"pepito@mail.com\"\n"
"    Cuando intento registrarme con ese correo\n"
"    Entonces el sistema rechaza el registro con el error EMAIL_EN_USO"),
("HU-02","User Story","Actualizar datos del usuario","E1 Cuentas de usuario","Autenticación y perfil","Must","",
"Característica: Actualización de datos\n"
"  Escenario: Actualización exitosa\n"
"    Dado que soy un cliente autenticado\n"
"    Cuando actualizo mi nombre y teléfono\n"
"    Entonces el sistema guarda los cambios y muestra confirmación\n"
"  Escenario: Correo duplicado\n"
"    Dado que otro usuario usa el correo destino\n"
"    Cuando intento cambiarlo\n"
"    Entonces el sistema rechaza el cambio con EMAIL_EN_USO"),
("HU-03","User Story","Consultar perfil de la cuenta de usuario","E1 Cuentas de usuario","Autenticación y perfil","Must","",
"Característica: Consulta de perfil\n"
"  Escenario: Ver perfil\n"
"    Dado que estoy autenticado\n"
"    Cuando consulto mi perfil\n"
"    Entonces veo mis datos personales, roles y estado de la cuenta"),
("HU-04","User Story","Desactivar temporalmente la cuenta","E1 Cuentas de usuario","Autenticación y perfil","Should","",
"Característica: Desactivación temporal\n"
"  Escenario: Desactivar cuenta\n"
"    Dado que estoy autenticado\n"
"    Cuando desactivo temporalmente mi cuenta\n"
"    Entonces no puedo iniciar sesión hasta reactivarla\n"
"  Escenario: Reactivación\n"
"    Dado que desactivé mi cuenta\n"
"    Cuando vuelvo a iniciar sesión\n"
"    Entonces el sistema reactiva la cuenta y registra el evento"),
("HU-05","User Story","Eliminar cuenta de usuario","E1 Cuentas de usuario","Autenticación y perfil","Should","",
"Característica: Eliminación de cuenta\n"
"  Escenario: Eliminación con confirmación\n"
"    Dado que estoy autenticado\n"
"    Cuando solicito eliminar mi cuenta y confirmo\n"
"    Entonces el sistema elimina el acceso y anonimiza datos personales\n"
"    Y registra la acción en auditoría"),
("HU-06","User Story","Registrar cuenta de proveedor","E2 Cuentas de proveedor","Registro y KYC","Must","Sprint 1",
"Característica: Registro de proveedor\n"
"  Escenario: Registro exitoso\n"
"    Dado que soy un visitante proveedor\n"
"    Cuando diligencio datos del negocio, documento y correo de contacto\n"
"    Entonces el sistema crea la cuenta con rol PROVIDER en estado pendiente de verificación"),
("HU-07","User Story","Actualizar datos del proveedor","E2 Cuentas de proveedor","Registro y KYC","Must","",
"Característica: Actualización de proveedor\n"
"  Escenario: Edición exitosa\n"
"    Dado que soy un proveedor autenticado\n"
"    Cuando actualizo la descripción del negocio\n"
"    Entonces el sistema guarda los cambios"),
("HU-08","User Story","Verificar identidad del proveedor","E2 Cuentas de proveedor","Registro y KYC","Must","",
"Característica: Verificación de identidad\n"
"  Escenario: Verificación aprobada\n"
"    Dado que un proveedor cargó su documento\n"
"    Cuando el administrador aprueba la verificación\n"
"    Entonces el proveedor queda habilitado para publicar servicios"),
("HU-09","User Story","Verificar identidad del proveedor de forma periódica","E2 Cuentas de proveedor","Registro y KYC","Must","",
"Característica: Re-verificación periódica\n"
"  Escenario: Vigencia vencida\n"
"    Dado que la verificación del proveedor venció\n"
"    Cuando el sistema ejecuta el control periódico\n"
"    Entonces el proveedor queda en estado pendiente de verificación\n"
"    Y se le notifica por correo"),
("HU-10","User Story","Eliminar proveedor","E2 Cuentas de proveedor","Registro y KYC","Should","",
"Característica: Eliminación de proveedor\n"
"  Escenario: Eliminación con auditoría\n"
"    Dado que soy un proveedor autenticado\n"
"    Cuando elimino mi cuenta de proveedor confirmando la acción\n"
"    Entonces se desactivan sus servicios, personal y agendas\n"
"    Y la acción queda en auditoría"),
("HU-11","User Story","Cargar logotipo y fotos del proveedor","E2 Cuentas de proveedor","Registro y KYC","Should","",
"Característica: Carga de imágenes\n"
"  Escenario: Subida válida\n"
"    Dado que soy proveedor autenticado\n"
"    Cuando subo un logotipo en formato permitido y menor a 2MB\n"
"    Entonces el sistema lo guarda en el repositorio de recursos y lo muestra"),
("HU-12","User Story","Iniciar sesión","E1 Cuentas de usuario","Autenticación y perfil","Must","Sprint 1",
"Característica: Inicio de sesión\n"
"  Escenario: Credenciales correctas\n"
"    Dado que tengo una cuenta activa\n"
"    Cuando ingreso credenciales correctas\n"
"    Entonces el sistema retorna un token JWT con expiración y el rol\n"
"  Escenario: Bloqueo por intentos\n"
"    Dado que intento con credenciales incorrectas\n"
"    Cuando fallo 5 veces consecutivas\n"
"    Entonces la cuenta se bloquea 30 minutos\n"
"    Y se registra el evento de seguridad"),
("HU-13","User Story","Cerrar sesión de forma segura","E1 Cuentas de usuario","Autenticación y perfil","Must","",
"Característica: Cierre de sesión\n"
"  Escenario: Cerrar sesión\n"
"    Dado que estoy autenticado\n"
"    Cuando cierro sesión\n"
"    Entonces el token se revoca y la sesión queda inactiva en el dispositivo"),
("HU-14","User Story","Cambiar contraseña","E1 Cuentas de usuario","Autenticación y perfil","Must","",
"Característica: Cambio de contraseña\n"
"  Escenario: Cambio válido\n"
"    Dado que estoy autenticado\n"
"    Cuando ingreso la contraseña actual y una nueva que cumple la política\n"
"    Entonces el sistema actualiza el hash y me desloguea de otros dispositivos"),
("HU-15","User Story","Recuperar contraseña","E1 Cuentas de usuario","Autenticación y perfil","Must","",
"Característica: Recuperación de contraseña\n"
"  Escenario: Enlace de recuperación\n"
"    Dado que olvidé mi contraseña\n"
"    Cuando solicito recuperación con mi correo registrado\n"
"    Entonces recibo un enlace temporal de un solo uso para restablecerla"),
("HU-16","User Story","Recordar sesión en el dispositivo","E1 Cuentas de usuario","Autenticación y perfil","Could","",
"Característica: Recordar sesión\n"
"  Escenario: Mantener sesión\n"
"    Dado que marco la opción recordar sesión al iniciar sesión\n"
"    Cuando cierro el navegador\n"
"    Entonces mi sesión permanece activa mediante refresh token seguro"),
("HU-17","User Story","Registrar servicio","E3 Servicios y agenda","Catálogo","Must","",
"Característica: Registro de servicio\n"
"  Escenario: Servicio válido\n"
"    Dado que soy un proveedor verificado\n"
"    Cuando registro nombre, descripción, duración y precio\n"
"    Entonces el sistema crea el servicio en estado inactivo hasta publicar"),
("HU-18","User Story","Activar servicio","E3 Servicios y agenda","Catálogo","Must","",
"Característica: Activación\n"
"    Dado que tengo un servicio creado\n"
"    Cuando lo activo y tiene al menos un horario definido\n"
"    Entonces queda visible y reservable por clientes"),
("HU-19","User Story","Autorización de proveedor","E2 Cuentas de proveedor","Seguridad","Must","Sprint 1",
"Característica: Autorización de proveedor\n"
"  Escenario: Operación restringida\n"
"    Dado que soy proveedor autenticado\n"
"    Cuando intento modificar servicios de otro proveedor\n"
"    Entonces el sistema responde 403 FORBIDDEN\n"
"  Escenario: MFA sensible\n"
"    Dado que la operación es sensible\n"
"    Cuando el sistema lo solicita\n"
"    Entonces exige un segundo factor antes de continuar"),
("HU-20","User Story","Consultar servicio","E3 Servicios y agenda","Catálogo","Must","",
"Característica: Consulta de servicio\n"
"  Escenario: Listar servicios\n"
"    Dado que consulto el catálogo de un proveedor\n"
"    Cuando aplico filtros de tipo o búsqueda\n"
"    Entonces veo los servicios activos con precio, duración y disponibilidad"),
("HU-21","User Story","Modificar servicio","E3 Servicios y agenda","Catálogo","Must","",
"Característica: Modificación\n"
"  Escenario: Edición exitosa\n"
"    Dado que tengo un servicio propio\n"
"    Cuando actualizo precio o duración\n"
"    Entonces los cambios se aplican y se registran en auditoría"),
("HU-22","User Story","Desactivar servicio","E3 Servicios y agenda","Catálogo","Must","",
"Característica: Desactivación\n"
"  Escenario: Desactivar\n"
"    Dado que tengo un servicio activo\n"
"    Cuando lo desactivo\n"
"    Entonces deja de estar disponible para nuevas reservas\n"
"    Y las citas futuras activas se notifican para reprogramar"),
("HU-23","User Story","Definir horario del servicio","E3 Servicios y agenda","Agenda","Must","",
"Característica: Definición de horario\n"
"  Escenario: Horario válido\n"
"    Dado que soy proveedor\n"
"    Cuando defino días y rangos de atención para un servicio\n"
"    Entonces el horario queda en agenda respetando la duración mínima de la cita"),
("HU-24","User Story","Modificar horarios del servicio","E3 Servicios y agenda","Agenda","Must","",
"Característica: Modificación de horarios\n"
"  Escenario: Cambio con citas existentes\n"
"    Dado que existen citas en el horario a modificar\n"
"    Cuando el proveedor actualiza el horario\n"
"    Entonces las citas conflictivas se marcan para reprogramación y se notifica"),
("HU-25","User Story","Consultar agenda del servicio","E3 Servicios y agenda","Agenda","Must","",
"Característica: Consulta de agenda\n"
"  Escenario: Ver agenda\n"
"    Dado que soy proveedor o personal\n"
"    Cuando consulto la agenda de un servicio\n"
"    Entonces veo franjas libres, reservadas y bloqueadas por día"),
("HU-26","User Story","Bloquear horario en agenda","E3 Servicios y agenda","Agenda","Should","",
"Característica: Bloqueo de horario\n"
"  Escenario: Bloquear franja\n"
"    Dado que tengo agenda activa\n"
"    Cuando bloqueo una franja específica\n"
"    Entonces deja de ofrecerse al público esa franja"),
("HU-27","User Story","Modificar horario en una fecha específica","E3 Servicios y agenda","Agenda","Should","",
"Característica: Excepción puntual\n"
"  Escenario: Ajuste de fecha\n"
"    Dado que tengo agenda semanal\n"
"    Cuando ajusto el horario para una fecha puntual\n"
"    Entonces se aplica solo a esa fecha sin alterar el patrón semanal"),
("HU-28","User Story","Asignar personal a servicios específicos","E3 Servicios y agenda","Personal","Must","",
"Característica: Asignación de personal\n"
"  Escenario: Asignar\n"
"    Dado que soy proveedor\n"
"    Cuando asigno un miembro del personal a un servicio\n"
"    Entonces ese personal queda disponible para reservas de ese servicio"),
("HU-29","User Story","Registrar personal operativo","E4 Personal operativo","Gestión","Must","",
"Característica: Registro de personal\n"
"  Escenario: Registro válido\n"
"    Dado que soy proveedor\n"
"    Cuando registro a un miembro del personal con su cuenta y cargo\n"
"    Entonces queda vinculado al proveedor con rol STAFF"),
("HU-30","User Story","Consultar disponibilidad del personal","E4 Personal operativo","Gestión","Must","",
"Característica: Disponibilidad\n"
"  Escenario: Consultar agenda de personal\n"
"    Dado que selecciono un personal y una fecha\n"
"    Cuando consulto disponibilidad\n"
"    Entonces veo sus franjas libres y ocupadas"),
("HU-31","User Story","Validar superposición de horarios del personal","E4 Personal operativo","Gestión","Must","",
"Característica: Validación de superposición\n"
"  Escenario: Superposición rechazada\n"
"    Dado que un personal ya tiene asignación en una franja\n"
"    Cuando se intenta asignar otra simultánea\n"
"    Entonces el sistema rechaza la asignación con el error SUPERPOSICION_HORARIO"),
("HU-32","User Story","Notificar no disponibilidad del personal","E4 Personal operativo","Gestión","Should","",
"Característica: Notificación de indisponibilidad\n"
"  Escenario: Ausencia reportada\n"
"    Dado que un personal marca no disponibilidad\n"
"    Cuando el sistema lo detecta\n"
"    Entonces notifica al proveedor y a los clientes con citas afectadas"),
("HU-33","User Story","Consultar disponibilidad de citas","E5 Reservas","Citas","Must","",
"Característica: Disponibilidad de citas\n"
"  Escenario: Franjas disponibles\n"
"    Dado que selecciono servicio, personal y fecha\n"
"    Cuando consulto disponibilidad\n"
"    Entonces el sistema retorna las franjas libres según duración y horarios"),
("HU-34","User Story","Agendar cita","E5 Reservas","Citas","Must","Sprint 1",
"Característica: Agendar cita\n"
"  Escenario: Cita creada\n"
"    Dado que soy un cliente autenticado y el horario está libre\n"
"    Cuando confirmo el agendamiento\n"
"    Entonces el sistema crea la reserva SOLICITADA\n"
"    Y notifica al proveedor\n"
"  Escenario: Horario ocupado\n"
"    Dado que el horario tiene una reserva activa\n"
"    Cuando intento agendarlo\n"
"    Entonces el sistema responde 409 HORARIO_OCUPADO\n"
"    Y sugiere alternativas"),
("HU-35","User Story","Consultar citas programadas","E5 Reservas","Citas","Must","",
"Característica: Citas programadas\n"
"  Escenario: Listado\n"
"    Dado que estoy autenticado como cliente o personal\n"
"    Cuando consulto mis citas\n"
"    Entonces veo las próximas citas con estado, fecha y servicio"),
("HU-36","User Story","Reprogramar cita","E5 Reservas","Citas","Must","",
"Característica: Reprogramación\n"
"  Escenario: Reprogramar a franja libre\n"
"    Dado que tengo una cita SOLICITADA o CONFIRMADA\n"
"    Cuando solicito reprogramar a una franja libre\n"
"    Entonces la cita cambia a REPROGRAMADA con la nueva fecha\n"
"    Y se notifica a ambas partes"),
("HU-37","User Story","Cancelar cita","E5 Reservas","Citas","Must","",
"Característica: Cancelación por cliente\n"
"  Escenario: Cancelar dentro de la política\n"
"    Dado que tengo una cita programada\n"
"    Cuando la cancelo dentro de la ventana permitida\n"
"    Entonces la cita pasa a CANCELADA\n"
"    Y se notifica al proveedor"),
("HU-38","User Story","Consultar listado de citas","E5 Reservas","Citas","Must","",
"Característica: Listado de citas\n"
"  Escenario: Consulta paginada\n"
"    Dado que soy proveedor o administrador\n"
"    Cuando consulto el listado de citas\n"
"    Entonces veo las citas paginadas y filtrables por estado y fecha"),
("HU-39","User Story","Registrar finalización de cita","E5 Reservas","Citas","Must","",
"Característica: Finalización\n"
"  Escenario: Completar cita\n"
"    Dado que la cita está CONFIRMADA\n"
"    Cuando el personal registra la finalización\n"
"    Entonces la cita pasa a COMPLETADA\n"
"    Y cuenta para los reportes de ocupación"),
("HU-40","User Story","Confirmar solicitud de cita","E5 Reservas","Citas","Must","",
"Característica: Confirmación\n"
"  Escenario: Confirmar\n"
"    Dado que existe una cita SOLICITADA\n"
"    Cuando el proveedor la confirma\n"
"    Entonces pasa a CONFIRMADA y se notifica al cliente"),
("HU-41","User Story","Cancelar cita por imprevisto","E5 Reservas","Citas","Must","",
"Característica: Cancelación por imprevisto\n"
"  Escenario: Impedimento del proveedor\n"
"    Dado que el proveedor tiene un imprevisto\n"
"    Cuando cancela la cita por imprevisto\n"
"    Entonces pasa a CANCELADA_POR_IMPREVISTO\n"
"    Y se notifica al cliente con opción de reprogramar"),
("HU-42","User Story","Consultar historial de citas personales","E6 Historial y filtros","Consulta","Must","",
"Característica: Historial personal\n"
"  Escenario: Ver historial\n"
"    Dado que estoy autenticado como cliente\n"
"    Cuando consulto mi historial\n"
"    Entonces veo todas mis citas pasadas con sus estados"),
("HU-43","User Story","Consultar historial de citas global","E6 Historial y filtros","Consulta","Must","",
"Característica: Historial global\n"
"  Escenario: Acceso administrador\n"
"    Dado que soy administrador o proveedor\n"
"    Cuando consulto el historial global\n"
"    Entonces veo las citas de todos los clientes de mi alcance"),
("HU-44","User Story","Filtrar citas personales por estado","E6 Historial y filtros","Consulta","Should","",
"Característica: Filtro por estado\n"
"  Escenario: Filtro\n"
"    Dado que consulto mi historial\n"
"    Cuando filtro por estado (completadas, canceladas…)\n"
"    Entonces solo se muestran las de ese estado"),
("HU-45","User Story","Filtrar historial de citas por personal","E6 Historial y filtros","Consulta","Should","",
"Característica: Filtro por personal\n"
"  Escenario: Filtro\n"
"    Dado que soy proveedor\n"
"    Cuando consulto el historial y filtro por personal\n"
"    Entonces veo solo las citas de ese personal"),
("HU-46","User Story","Filtrar historial de citas por cliente","E6 Historial y filtros","Consulta","Should","",
"Característica: Filtro por cliente\n"
"  Escenario: Filtro\n"
"    Dado que soy proveedor\n"
"    Cuando filtro el historial por cliente\n"
"    Entonces veo solo las citas de ese cliente"),
("HU-47","User Story","Filtrar historial de citas por rango de fechas","E6 Historial y filtros","Consulta","Should","",
"Característica: Filtro por fechas\n"
"  Escenario: Rango\n"
"    Dado que consulto el historial\n"
"    Cuando selecciono un rango de fechas\n"
"    Entonces se retornan solo las citas dentro del rango"),
("HU-48","User Story","Generar reporte de uso de servicios","E7 Reportes","Analítica","Must","",
"Característica: Reporte de uso\n"
"  Escenario: Generar reporte\n"
"    Dado que soy proveedor o administrador\n"
"    Cuando solicito el reporte de uso de servicios\n"
"    Entonces veo ocupación, citas completadas y cancelaciones por servicio"),
("HU-49","User Story","Filtrar reporte por rango de fechas","E7 Reportes","Analítica","Should","",
"Característica: Filtro del reporte\n"
"  Escenario: Rango de fechas\n"
"    Dado que estoy en el reporte de uso\n"
"    Cuando selecciono un rango\n"
"    Entonces las métricas se recalculan para ese periodo"),
("HU-50","User Story","Exportar informe de uso","E7 Reportes","Analítica","Should","",
"Característica: Exportación\n"
"  Escenario: Exportar CSV\n"
"    Dado que tengo un reporte generado\n"
"    Cuando pido exportar\n"
"    Entonces el sistema descarga el informe en formato CSV"),
("HU-51","User Story","Autorización de usuario","E1 Cuentas de usuario","Seguridad","Must","Sprint 1",
"Característica: Autorización RBAC\n"
"  Escenario: Acceso denegado\n"
"    Dado que soy un usuario con rol CLIENT autenticado\n"
"    Cuando intento acceder a un endpoint de administración\n"
"    Entonces el sistema responde 403 FORBIDDEN\n"
"    Y registra el evento en auditoría"),
("HU-52","User Story","Notificar confirmación y recordatorio de cita","E8 Seguridad y transversal","Notificaciones","Should","",
"Característica: Notificaciones de cita\n"
"  Escenario: Confirmación y recordatorio\n"
"    Dado que se confirma una cita\n"
"    Cuando el sistema detecta la confirmación o la cercanía del evento\n"
"    Entonces envía notificación por correo/telegram al cliente\n"
"    Y queda registro en auditoría"),
("HU-53","User Story","Notificar cancelación por imprevisto","E8 Seguridad y transversal","Notificaciones","Should","",
"Característica: Notificación de imprevisto\n"
"  Escenario: Avise al cliente\n"
"    Dado que una cita pasa a CANCELADA_POR_IMPREVISTO\n"
"    Cuando se procesa la cancelación\n"
"    Entonces se notifica al cliente con motivo y opción de reprogramar"),
("HU-54","User Story","Configurar parámetros de atención y políticas","E8 Seguridad y transversal","Configuración","Should","",
"Característica: Parámetros del sistema\n"
"  Escenario: Ajuste de configuración\n"
"    Dado que soy administrador\n"
"    Cuando ajusto ventanas de cancelación, horarios base e intentos de acceso\n"
"    Entonces los parámetros se aplican sin recompilar el sistema"),
("HU-55","User Story","Registrar auditoría de acciones sensibles","E8 Seguridad y transversal","Auditoría","Must","",
"Característica: Auditoría\n"
"  Escenario: Acción sensible\n"
"    Dado que se ejecuta una acción sensible (eliminar cuenta, KYC, bloqueo)\n"
"    Cuando finaliza la acción\n"
"    Entonces se persiste quién, qué, cuándo y detalles en AUDIT_LOG"),
("HU-56","User Story","Activar MFA para acceso administrativo","E8 Seguridad y transversal","Seguridad","Must","",
"Característica: MFA administrativo\n"
"  Escenario: Segundo factor\n"
"    Dado que tengo rol ADMIN\n"
"    Cuando inicio sesión correctamente\n"
"    Entonces el sistema solicita un segundo factor (TOTP) antes de permitir acceso"),
("HU-57","User Story","Optimizar consultas críticas e índices","E8 Seguridad y transversal","Rendimiento","Could","",
"Característica: Rendimiento\n"
"  Escenario: Consultas rápidas\n"
"    Dado que existen datos de citas y disponibles\n"
"    Cuando se consulta disponibilidad o historial\n"
"    Entonces las consultas usan los índices definidos y responden ≤200 ms (p95)"),
]

EPICS = [
    ("E1", "Epic", "Cuentas de usuario", "Gestión de cuentas, autenticación y perfiles de clientes"),
    ("E2", "Epic", "Cuentas de proveedor", "Registro, KYC y autorización de proveedores"),
    ("E3", "Epic", "Servicios y agenda", "Catálogo de servicios, horarios y asignación de personal"),
    ("E4", "Epic", "Personal operativo", "Registro, disponibilidad y validaciones del personal"),
    ("E5", "Epic", "Reservas (citas)", "Ciclo de vida de las reservas"),
    ("E6", "Epic", "Historial y filtros", "Historiales de citas y consultas filtradas"),
    ("E7", "Epic", "Reportes", "Reportes y exportación de uso de servicios"),
    ("E8", "Epic", "Seguridad y transversal", "Autorización, auditoría, MFA, notificaciones y configuración"),
]

ROWS = []
for e in EPICS:
    ROWS.append({"ID":"", "WorkItemType":e[1], "Titulo":f"{e[0]} - {e[2]}", "Epic":e[0], "Feature":"",
                 "Prioridad":"Must", "Sprint":"", "CriteriosAceptacion":e[3]})
for h in HU:
    ROWS.append({"ID":h[0], "WorkItemType":h[1], "Titulo":h[2], "Epic":h[3], "Feature":h[4],
                 "Prioridad":h[5], "Sprint":h[6], "CriteriosAceptacion":h[7]})

OUT = "/home/edinsonvo/Documentos/Default Project/Caso14-PlataformaReservas/azure-devops/backlog/backlog-fabrica_escuela_2026_1_import.csv"
with open(OUT, "w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=["ID","WorkItemType","Titulo","Epic","Feature","Prioridad","Sprint","CriteriosAceptacion"])
    w.writeheader()
    w.writerows(ROWS)

print(f"OK: {len(ROWS)} items escritos -> {OUT}")