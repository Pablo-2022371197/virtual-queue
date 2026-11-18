"""Adapt the cronograma: CUSTOMER-only Flutter app, notification widget, moved Qs, practice justifications."""

from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor
from docx.text.paragraph import Paragraph

SRC = Path(r"C:\Users\Palot\Downloads\Cronograma_Entregables_VirtualQueue_Movil.docx")
OUT_REPO = Path(
    r"C:\Users\Palot\Documents\Desarrollo-software\9no-uteq\desarrollo-dispositivos"
    r"\virtual_queue_phone\reporte_septiembre\Cronograma_Entregables_VirtualQueue_Movil.docx"
)


def para_text(p):
    return "".join(t.text or "" for t in p._p.iter(qn("w:t"))).strip()


def set_run_font(run, size=11, bold=False, italic=False, color=None):
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.name = "Calibri"
    r = run._element
    rPr = r.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.append(rFonts)
    rFonts.set(qn("w:ascii"), "Calibri")
    rFonts.set(qn("w:hAnsi"), "Calibri")
    if color is not None:
        run.font.color.rgb = color


def set_text(p, text, *, bold=None, italic=None):
    if p.runs:
        p.runs[0].text = text
        if bold is not None:
            p.runs[0].bold = bold
        if italic is not None:
            p.runs[0].italic = italic
        for r in p.runs[1:]:
            r.text = ""
    else:
        run = p.add_run(text)
        set_run_font(run, bold=bool(bold), italic=bool(italic))


def insert_after(paragraph, text, *, bold=False, italic=False, size=11):
    new_p = OxmlElement("w:p")
    paragraph._p.addnext(new_p)
    pPr = paragraph._p.find(qn("w:pPr"))
    if pPr is not None:
        new_p.insert(0, deepcopy(pPr))
    new_para = Paragraph(new_p, paragraph._parent)
    # clear any copied runs that came with pPr only
    for child in list(new_p):
        if child.tag == qn("w:r"):
            new_p.remove(child)
    run = new_para.add_run(text)
    set_run_font(run, size=size, bold=bold, italic=italic)
    return new_para


def insert_many(start, items):
    """items: list of (text, kwargs). Inserts in order after start. Returns last para."""
    cursor = start
    for text, kwargs in items:
        cursor = insert_after(cursor, text, **kwargs)
    return cursor


def find_para(doc, prefix):
    for p in doc.paragraphs:
        if para_text(p).startswith(prefix):
            return p
    raise SystemExit(f"paragraph not found: {prefix!r}")


def find_all_prefix(doc, prefix):
    return [p for p in doc.paragraphs if para_text(p).startswith(prefix)]


def remove_para(p):
    el = p._element
    parent = el.getparent()
    if parent is not None:
        parent.remove(el)


def main():
    doc = Document(str(SRC))

    # --- Cover / objective / scope ---
    set_text(
        find_para(doc, "Proyecto:"),
        "Proyecto: Virtual Queue — Cliente móvil Flutter (rol CUSTOMER)",
    )
    set_text(
        find_para(doc, "Desarrollar una aplicación móvil"),
        "Desarrollar una aplicación móvil Flutter para teléfono, exclusiva del rol "
        "CUSTOMER del sistema Virtual Queue: iniciar sesión, buscar establecimientos, "
        "tomar un turno y consultarlo. Tras tomar el turno, un StatefulWidget de "
        "notificación ofrece las acciones Cancelar y Verificar. Reutiliza la API y el "
        "núcleo ya existentes en virtual-queue-back y virtual-queue-mobile (Wear OS). "
        "No incluye flujos de STAFF ni ADMIN.",
    )

    set_text(
        find_para(doc, "Autenticación de usuarios"),
        "Autenticación de CUSTOMER (login, JWT y refresh token). STAFF y ADMIN no operan esta app.",
    )
    set_text(
        find_para(doc, "Consulta, creación y cancelación"),
        "Consulta, toma y cancelación del turno activo del cliente autenticado.",
    )
    set_text(
        find_para(doc, "Búsqueda y visualización"),
        "Búsqueda y visualización de establecimientos para unirse a la fila.",
    )
    set_text(
        find_para(doc, "Actualizaciones en tiempo real"),
        "Actualizaciones en tiempo real del turno del CUSTOMER vía WebSocket STOMP.",
    )
    set_text(
        find_para(doc, "Notificaciones push"),
        "StatefulWidget de notificación (y, en el último entregable, FCM) con acciones "
        "para Cancelar o Verificar el turno que el usuario acaba de tomar.",
    )

    set_text(
        find_para(doc, "Panel de administración"),
        "Panel de administración de establecimientos y cualquier pantalla de ADMIN.",
    )
    set_text(
        find_para(doc, "Operación de personal"),
        "Operación de personal (aceptar, llamar, completar turnos): cubierto por la web y el backend.",
    )
    extras_scope = find_para(doc, "Registro o alta de nuevos establecimientos.")
    insert_many(
        extras_scope,
        [
            (
                "Módulos IoT con ESP32, sensor infrarrojo o Bluetooth clásico/SPP como parte del producto Turnix.",
                {},
            ),
            (
                "CRUD local de usuarios con Room/SQLite (Práctica 4) ni una app de consulta HTTP aislada tipo Cat Facts (Práctica 3).",
                {},
            ),
            (
                "Firmware embebido (LED/botón en ESP32) como módulo de la aplicación Flutter; se documenta aparte si el curso lo exige.",
                {},
            ),
        ],
    )

    # --- E1 items: tweak wording to CUSTOMER ---
    set_text(
        find_para(doc, "Comparativa Flutter vs."),
        "Comparativa Flutter vs. React Native vs. desarrollo nativo, con la decisión documentada en las preguntas de este mismo entregable.",
    )
    set_text(
        find_para(doc, "UI de inicio de sesión"),
        "UI de inicio de sesión para CUSTOMER, con usuario y contraseña y validación de formulario, aún sin POST al backend.",
    )
    set_text(
        find_para(doc, "Lista y buscador de establecimientos"),
        "Lista y buscador de establecimientos con datos mock, para que el CUSTOMER elija dónde tomar turno.",
    )
    set_text(
        find_para(doc, "Rutas: /login, /home, /search, /place/:id."),
        "Rutas de CUSTOMER: /login, /home, /search, /place/:id. Sin rutas de staff ni admin.",
    )

    # Insert item 8 + questions after E1 item 7 description
    e1_nav_desc = find_para(doc, "Descripción de la evidencia: (agregar aquí el texto una vez adjuntada la captura)")
    # that prefix matches many later items; restrict to the one before Entregable 2
    e2 = find_para(doc, "Entregable 2:")
    e1_last = None
    for p in doc.paragraphs:
        t = para_text(p)
        if t.startswith("Descripción de la evidencia:") and e1_last is None:
            pass
        if p._element is e2._element:
            break
        e1_last = p

    questions = [
        ("8. StatefulWidget de notificación (maqueta)", {"bold": True}),
        (
            "Diseño de un widget con estado propio que representa la notificación del turno recién tomado, con dos acciones: Cancelar y Verificar.",
            {},
        ),
        (
            "El widget mantiene estado local (visible / oculta, turno asociado, acción pulsada). Verificar navega a Mi turno; Cancelar pide confirmación (aún mock).",
            {},
        ),
        (
            "No es un panel de STAFF: solo el CUSTOMER que sacó el turno ve y actúa sobre esa notificación.",
            {},
        ),
        (
            "Evidencia esperada: captura de la maqueta del widget con los botones Cancelar y Verificar.",
            {},
        ),
        ("[ Espacio para imagen / captura de pantalla ]", {}),
        (
            "Descripción de la evidencia: (agregar aquí el texto una vez adjuntada la captura)",
            {},
        ),
        ("Preguntas del curso (Entregable 1)", {"bold": True}),
        (
            "¿Qué framework móvil seleccionas y describe los criterios por los cuales lo seleccionaste?",
            {"bold": True},
        ),
        (
            "Se selecciona Flutter para el cliente móvil de teléfono, exclusivo del rol CUSTOMER.",
            {},
        ),
        (
            "Reutilización de código: virtual-queue-mobile (Wear OS) ya está en Flutter, con Riverpod, Dio, STOMP y almacenamiento seguro; el núcleo se comparte en packages/virtual_queue_core en lugar de reescribirse.",
            {},
        ),
        (
            "Curva de aprendizaje del equipo: IDGS14 ya domina Dart y Flutter, lo que reduce el tiempo frente a Kotlin nativo, Swift o React Native.",
            {},
        ),
        (
            "Multiplataforma: un mismo framework cubre el teléfono CUSTOMER y el wearable, con la misma lógica de turno.",
            {},
        ),
        (
            "Rendimiento: Flutter compila a código nativo, adecuado para el StatefulWidget de notificación, STOMP y actualizaciones del turno.",
            {},
        ),
        (
            "Ecosistema ya validado: dio, riverpod, stomp_dart_client, flutter_secure_storage y go_router funcionan en el cliente Wear OS.",
            {},
        ),
        (
            "Costo y tiempo: una sola base para teléfono y reloj, limitada al flujo CUSTOMER (sin duplicar paneles staff/admin que ya cubre la web).",
            {},
        ),
        (
            "¿Cómo piensas implementar el framework alrededor de tu proyecto en Flutter?",
            {"bold": True},
        ),
        (
            "Extraer el núcleo compartido (modelos, repositorio de tickets, auth, Dio, STOMP y token) a packages/virtual_queue_core.",
            {},
        ),
        (
            "Crear virtual_queue_phone como cliente Flutter de teléfono, UI Material 3, solo rol CUSTOMER (login, búsqueda, turno, notificación).",
            {},
        ),
        (
            "Implementar TicketNotificationWidget como StatefulWidget: recibe el turno recién tomado y expone Cancelar (DELETE /api/tickets/{id}) y Verificar (navegar a /home).",
            {},
        ),
        (
            "Reutilizar el cliente HTTP con interceptor JWT y el mismo API_URL de Wear OS. El guard de go_router rechaza o no ofrece rutas de STAFF/ADMIN.",
            {},
        ),
        (
            "En el último entregable, el mismo par de acciones se replica en la notificación FCM (acción Cancelar / Verificar) conectada a notification/ del backend.",
            {},
        ),
        (
            "¿Qué paradigma de programación será?",
            {"bold": True},
        ),
        (
            "El paradigma principal es la Programación Orientada a Objetos (POO) de Dart: Ticket, Place, UserSummary, repositorios, AuthService y el StatefulWidget de notificación se modelan como clases con encapsulamiento y composición.",
            {},
        ),
        (
            "Se complementa con el paradigma declarativo y reactivo de Flutter: la UI es función del estado. El widget de notificación conserva estado interno (mounted, ticket, acción) y el resto de la app usa Riverpod para sesión y turno.",
            {},
        ),
        (
            "En puntos específicos se usa programación funcional (inmutabilidad de modelos, mapeo de JSON, streams STOMP), sin sustituir a la POO como base.",
            {},
        ),
    ]
    insert_many(e1_last, questions)

    # --- Entregable 2 adaptations ---
    set_text(
        find_para(doc, "Integración real con POST /api/auth/login"),
        "Integración real con POST /api/auth/login restringida al rol CUSTOMER: JWT en almacenamiento seguro y mensaje visible si las credenciales fallan o el rol es STAFF/ADMIN.",
    )
    set_text(
        find_para(doc, "Se valida contra los usuarios semilla"),
        "Se valida con el usuario semilla customer. Un intento con admin o staff no entra al flujo de fila; se informa que esta app es solo para clientes.",
    )

    set_text(
        find_para(doc, "Consumo de GET /api/tickets/mine"),
        "Tras tomar turno (POST /api/places/{id}/tickets) o al abrir la app, GET /api/tickets/mine muestra el turno real del CUSTOMER.",
    )

    set_text(
        find_para(doc, "Integración de DELETE /api/tickets/{id}"),
        "Cancelación desde el StatefulWidget de notificación (acción Cancelar) y desde Mi turno, ambas con confirmación y DELETE /api/tickets/{id}.",
    )
    set_text(
        find_para(doc, "Diálogo de confirmación antes de cancelar."),
        "La acción Cancelar del widget dispara el diálogo; Verificar no borra el turno, solo abre el detalle.",
    )

    set_text(
        find_para(doc, "Suscripción a /user/queue/ticket"),
        "Suscripción STOMP a /user/queue/ticket del CUSTOMER autenticado. Los cambios actualizan Mi turno y el StatefulWidget de notificación (sin recargar), con polling de respaldo cada 8 s.",
    )
    set_text(
        find_para(doc, "Se prueba llamando el turno"),
        "Se prueba tomando un turno como customer y observando la notificación con Cancelar/Verificar; el llamado desde el panel web (staff) actualiza el estado en la app del cliente.",
    )

    set_text(
        find_para(doc, "Consumo de GET /api/places con filtro"),
        "GET /api/places con búsqueda para que el CUSTOMER elija establecimiento y tome turno (no hay gestión admin en esta app).",
    )

    # After last E2 description (item 7), before Entregable 3, insert notification item + justifications
    e3 = find_para(doc, "Entregable 3:")
    e2_last = None
    for p in doc.paragraphs:
        if p._element is e3._element:
            break
        e2_last = p

    e2_extra = [
        (
            "Justificación de prácticas no integradas al producto (adjuntas al Entregable 2)",
            {"bold": True},
        ),
        (
            "Turnix en este periodo es un cliente Flutter de teléfono para un único actor: el CUSTOMER. "
            "Consume el backend ya desplegado (JWT, lugares, tickets, STOMP, FCM). Por eso las prácticas "
            "siguientes se evidencian como laboratorios del curso y no como módulos nuevos dentro de "
            "virtual_queue_phone. Incluirlas en el producto duplicaría responsabilidades que ya cubre la "
            "API o introduciría hardware y persistencia local ajenos a la fila virtual.",
            {},
        ),
        ("Práctica 3 — ConsultaWeb (HTTP a URL preasignada)", {"bold": True}),
        (
            "El reporte REPORTE Practica 3.pdf demuestra GET a una URL fija (https://catfact.ninja/fact), "
            "parseo JSON, indicador de carga y error de red en una app Flutter aislada. Esa competencia "
            "ya se aplica en Turnix con Dio contra virtual-queue-back (login, tickets, lugares, health). "
            "No se añadirá una pantalla de “datos curiosos” ni un segundo cliente HTTP de juguete: el "
            "CUSTOMER consulta recursos reales del sistema de filas. La práctica se anexa como evidencia "
            "de la técnica, no como funcionalidad del producto.",
            {},
        ),
        ("[ Adjunto: REPORTE Practica 3.pdf ]", {"italic": True}),
        ("Práctica 4 — Almacenamiento estructurado (Room / SQLite)", {"bold": True}),
        (
            "El reporte REPORTE Practica 4.pdf cubre CRUD de una tabla local usuarios (Room, Kotlin). "
            "En Virtual Queue los usuarios y tickets viven en PostgreSQL del backend; el teléfono no "
            "registra ni edita un padrón local de personas. La persistencia del cliente CUSTOMER es el "
            "par JWT/refresh en flutter_secure_storage y, si acaso, caché del turno activo. Montar Room "
            "para clonar la Práctica 4 rompería la fuente única de verdad del servidor y no aporta al "
            "flujo de fila. Se anexa el reporte como práctica de laboratorio, no como módulo de Turnix.",
            {},
        ),
        ("[ Adjunto: REPORTE Practica 4.pdf ]", {"italic": True}),
        (
            "Práctica de laboratorio — IoT con sensor infrarrojo, ESP32 y Bluetooth",
            {"bold": True},
        ),
        (
            "El laboratorio pide leer un IR en un ESP32, encender un LED y enviar “OBJETO DETECTADO” / "
            "“SIN OBJETO” por Bluetooth clásico (SPP) a una terminal del teléfono. Turnix no detecta "
            "presencia física en sucursal ni habla con microcontroladores: el CUSTOMER toma turno por "
            "HTTPS y se entera del llamado por STOMP/FCM. Emparejar ESP32_SENSOR_IR no forma parte del "
            "contrato de API ni del rol CUSTOMER. Se entrega como práctica IoT adjunta, fuera del "
            "alcance del cliente Flutter.",
            {},
        ),
        (
            "[ Espacio para adjuntar el reporte o capturas de la práctica IoT ]",
            {},
        ),
        (
            "Descripción de la evidencia: (agregar el reporte o capturas del ESP32 / terminal Bluetooth cuando estén listas)",
            {},
        ),
        (
            "Firmware en ESP32 (LED y botón) — competencia del curso, no módulo de Turnix",
            {"bold": True},
        ),
        (
            "El script de firmware (GPIO 2 LED, GPIO 4 botón, monitor serial “BOTON PRESIONADO / LIBERADO”) "
            "enseña la interacción software–hardware. El cliente CUSTOMER de Turnix no controla pines ni "
            "flashea un ESP32: su “firmware” de producto es la app Flutter y el backend Java. Por eso no "
            "se integra un Controlador LED dentro de virtual_queue_phone.",
            {},
        ),
        (
            "Sí queda un apartado pendiente: si la materia exige evidenciar firmware (compilación, subida "
            "al ESP32 y monitor serial), esas capturas se anexarán aquí como práctica complementaria, "
            "sin alterar el alcance CUSTOMER de la app de filas. Hasta no tener el dispositivo y las "
            "capturas, este bloque permanece abierto.",
            {},
        ),
        (
            "Evidencia pendiente de firmware (ESP32 — Controlador LED)",
            {"bold": True},
        ),
        (
            "Por completar: (1) captura del script en el IDE / Arduino o PlatformIO; (2) monitor serial "
            "con “Firmware iniciado” y los mensajes de botón; (3) foto o video breve del LED al pulsar "
            "el botón. No se espera Bluetooth ni integración con Turnix.",
            {},
        ),
        ("[ Espacio para imagen / captura de pantalla — firmware ]", {}),
        (
            "Descripción de la evidencia: (pendiente; se agregará cuando el alumno disponga del ESP32 y las capturas)",
            {},
        ),
    ]
    insert_many(e2_last, e2_extra)

    # --- Entregable 3 adaptations ---
    set_text(
        find_para(doc, "Integración de POST /api/devices/register"),
        "Registro FCM del dispositivo CUSTOMER (POST /api/devices/register) y notificación de llamado cuyo payload abre el mismo StatefulWidget: acciones Cancelar y Verificar el turno.",
    )
    set_text(
        find_para(doc, "El dispositivo se registra automáticamente"),
        "Al iniciar sesión como CUSTOMER se registra el token. La notificación no es informativa sola: Verificar muestra el turno; Cancelar ejecuta el DELETE si el turno sigue activo.",
    )
    set_text(
        find_para(doc, "Prueba de notificación real al llamar"),
        "Prueba: customer toma turno en el teléfono; staff llama desde la web; el teléfono recibe FCM con Cancelar / Verificar.",
    )

    set_text(
        find_para(doc, "Validación cruzada entre la app de teléfono"),
        "Validación cruzada CUSTOMER: el mismo turno en el teléfono (widget de notificación + Mi turno) y en Wear OS, más el backend.",
    )

    set_text(
        find_para(doc, "Demostración integrada del ecosistema completo"),
        "Demostración del flujo CUSTOMER: login, búsqueda, tomar turno, StatefulWidget de notificación (Cancelar / Verificar), tiempo real y FCM. Staff y admin se muestran solo en la web, no en esta app.",
    )
    set_text(
        find_para(doc, "Flujo completo: login, búsqueda, turno"),
        "Flujo: login CUSTOMER → buscar → tomar turno → notificación con Cancelar/Verificar → actualización en vivo.",
    )
    set_text(
        find_para(doc, "Participación de los cuatro componentes"),
        "Participan web (staff llama), backend, Wear OS y el cliente Flutter de teléfono (solo CUSTOMER).",
    )

    # Replace trailing "Preguntas finales" block with a pointer
    q_head = find_para(doc, "Preguntas finales")
    set_text(
        q_head,
        "Nota: las tres preguntas del curso (framework, implementación en Flutter y paradigma) se respondieron en el Entregable 1, junto con la tabla comparativa.",
        bold=True,
    )
    # Remove leftover original answers (old copies after the note)
    to_delete = []
    seen = False
    for p in doc.paragraphs:
        t = para_text(p)
        if p._element is q_head._element:
            seen = True
            continue
        if seen:
            to_delete.append(p)
    for p in to_delete:
        remove_para(p)

    OUT_REPO.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(SRC))
    doc.save(str(OUT_REPO))
    print("saved", SRC)
    print("saved", OUT_REPO)


if __name__ == "__main__":
    main()
