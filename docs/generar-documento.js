const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
    ShadingType, VerticalAlign, PageNumber, LevelFormat, PageBreak,
    TabStopType, TabStopPosition, ImageRun
  } = require('docx');
  const fs = require('fs');
  const path = require('path');
  
  // ── Paleta de colores ─────────────────────────────────────────────────────
  const C = {
    dark:  "2A2A2A", mid: "444444", gray: "666666",
    hdr:   "2A2A2A", pale: "F2F2F2", alt: "EBEBEB",
    line:  "CCCCCC", code: "F5F5F5", white: "FFFFFF",
  };
  
  // ── Bordes ────────────────────────────────────────────────────────────────
  const bdr  = (c) => ({ style: BorderStyle.SINGLE, size: 4,  color: c || C.line });
  const bdrT = (c) => ({ style: BorderStyle.SINGLE, size: 14, color: c || C.mid });
  const b4   = { top: bdr(), bottom: bdr(), left: bdr(), right: bdr() };
  const bTL  = { top: bdr(C.mid), bottom: bdr(C.mid), left: bdrT(C.mid), right: bdr(C.mid) };
  
  // ── Celdas ────────────────────────────────────────────────────────────────
  function hCell(text, w, span) {
    return new TableCell({
      borders: b4, width: { size: w, type: WidthType.DXA },
      shading: { fill: C.hdr, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 130, right: 130 },
      verticalAlign: VerticalAlign.CENTER, columnSpan: span || 1,
      children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, color: C.white, size: 18, font: "Arial" })] })]
    });
  }
  function dCell(text, w, sh, bold, align) {
    return new TableCell({
      borders: b4, width: { size: w, type: WidthType.DXA },
      shading: { fill: sh || C.white, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 130, right: 130 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ alignment: align || AlignmentType.LEFT,
        children: [new TextRun({ text, bold: !!bold, color: C.dark, size: 18, font: "Arial" })] })]
    });
  }
  function gCell(text, w, sh) {
    return new TableCell({
      borders: b4, width: { size: w, type: WidthType.DXA },
      shading: { fill: sh || C.white, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 130, right: 130 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ alignment: AlignmentType.LEFT,
        children: [new TextRun({ text, bold: false, color: C.gray, size: 18, font: "Arial" })] })]
    });
  }
  
  // ── Caja informativa ──────────────────────────────────────────────────────
  function infoBox(label, text) {
    const kids = [];
    if (label) kids.push(new Paragraph({ spacing: { before: 0, after: 60 },
      children: [new TextRun({ text: label, bold: true, size: 18, color: C.mid, font: "Arial" })] }));
    kids.push(new Paragraph({ spacing: { before: 0, after: 0 },
      children: [new TextRun({ text, size: 18, color: C.dark, font: "Arial" })] }));
    return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
      rows: [new TableRow({ children: [new TableCell({
        borders: bTL, width: { size: 9360, type: WidthType.DXA },
        shading: { fill: C.alt, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 180, right: 180 }, children: kids
      })] })] });
  }
  
  // ── Bloque de código ──────────────────────────────────────────────────────
  function codeBlock(lines) {
    return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
      rows: [new TableRow({ children: [new TableCell({
        borders: { top: bdr(C.mid), bottom: bdr(C.mid), left: bdr(C.mid), right: bdr(C.mid) },
        width: { size: 9360, type: WidthType.DXA },
        shading: { fill: C.code, type: ShadingType.CLEAR },
        margins: { top: 140, bottom: 140, left: 200, right: 200 },
        children: lines.map(line => new Paragraph({ spacing: { before: 0, after: 0, line: 252 },
          children: [new TextRun({ text: line.length ? line : " ", font: "Consolas", size: 16, color: C.dark })] }))
      })] })] });
  }
  
  // ── Imagen centrada con caption ───────────────────────────────────────────
  function imgBlock(buffer, wPx, hPx, caption) {
    const label = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 120 },
      children: [new TextRun({ text: caption, size: 16, color: C.gray, font: "Arial" })]
    });
    const img = new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [new ImageRun({ data: buffer, transformation: { width: wPx, height: hPx }, type: "png" })]
    });
    return [img, label];
  }
  
  // ── Párrafos ──────────────────────────────────────────────────────────────
  function h1(text) {
    return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 120 },
      children: [new TextRun({ text, bold: true, size: 28, color: C.dark, font: "Arial" })] });
  }
  function h2(text) {
    return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 80 },
      children: [new TextRun({ text, bold: true, size: 22, color: C.mid, font: "Arial" })] });
  }
  function body(text, aft) {
    return new Paragraph({ spacing: { before: 60, after: aft !== undefined ? aft : 120 },
      children: [new TextRun({ text, size: 20, color: C.dark, font: "Arial" })] });
  }
  function bullet(text) {
    return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { before: 40, after: 40 },
      children: [new TextRun({ text, size: 20, color: C.dark, font: "Arial" })] });
  }
  function sp(n) {
    return new Paragraph({ spacing: { before: 0, after: n !== undefined ? n : 160 },
      children: [new TextRun("")] });
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // IMÁGENES — docx espera píxeles (96 DPI), no EMU
  // ═══════════════════════════════════════════════════════════════════════════
  const W_INCHES = 6.0;
  const W_PX = Math.round(W_INCHES * 96); // 576 px

  function hPx(origW, origH) {
    return Math.round(W_PX * (origH / origW));
  }
  
  const imgDir = path.join(__dirname, 'images');
  const imgPrivacidad = fs.readFileSync(path.join(imgDir, 'image.png'));   // 1652x755
  const imgTerminos   = fs.readFileSync(path.join(imgDir, 'image2.png')); // 1136x895
  const imgFaq        = fs.readFileSync(path.join(imgDir, 'image3.png')); // 1355x838
  const imgContacto   = fs.readFileSync(path.join(imgDir, 'image4.png')); // 1351x905
  
  const H_PRIV = hPx(1652, 755);
  const H_TERM = hPx(1136, 895);
  const H_FAQ  = hPx(1355, 838);
  const H_CONT = hPx(1351, 905);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TABLAS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const tableCatalogo = new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [2400, 1500, 5460],
    rows: [
      new TableRow({ children: [hCell("Paquete (catálogo Flutter)", 2400), hCell("Estado", 1500), hCell("Motivo de selección / descarte", 5460)] }),
      ...([
        ["wear_plus",                     "Seleccionado", "Paquete oficial del catálogo para construir apps nativas en Wear OS. Provee ciclo de vida (WearApp), modo ambiental (AmbientMode) y adaptación de forma de pantalla (ShapeOfScreen)."],
        ["flutter_wear_os_connectivity",  "Seleccionado", "Implementa la Wearable Data Layer API de Android desde Dart, sin código nativo Java/Kotlin. Permite comunicación bidireccional teléfono-reloj (DataClient, MessageClient, ChannelClient)."],
        ["watch_connectivity",            "Descartado",   "Orientado a comunicación con watchOS (Apple Watch). El wearable objetivo del proyecto es Android Wear OS / Samsung Watch."],
        ["Samsung Watch SDK (Tizen nativo)", "Descartado","Requiere desarrollo nativo Java/Kotlin/Tizen separado y certificación adicional; incompatible con la base de código única en Dart."],
      ].map(([p, e, m], i) => {
        const sh = i % 2 === 0 ? C.white : C.pale;
        return new TableRow({ children: [dCell(p, 2400, sh, true), dCell(e, 1500, sh, true, AlignmentType.CENTER), dCell(m, 5460, sh)] });
      }))
    ]
  });
  
  const tableWearPlusComp = new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [2200, 7160],
    rows: [
      new TableRow({ children: [hCell("Componente", 2200), hCell("Función dentro del widget", 7160)] }),
      ...([
        ["WearApp",       "Widget raíz que registra el ciclo de vida del modo ambiental (Always-on Display) del reloj. Envuelve toda la jerarquía visual del widget de turno."],
        ["AmbientMode",   "Notifica los cambios entre modo activo y modo reposo (ambiente). Permite cambiar la UI a texto blanco sobre fondo negro y reducir la frecuencia de actualización de pantalla, ahorrando batería en la pantalla OLED del reloj."],
        ["ShapeOfScreen", "Detecta si la pantalla física del reloj es circular o cuadrada y adapta el tamaño de fuente y el layout del contenido en consecuencia."],
      ].map(([c, f], i) => {
        const sh = i % 2 === 0 ? C.white : C.pale;
        return new TableRow({ children: [dCell(c, 2200, sh, true), dCell(f, 7160, sh)] });
      }))
    ]
  });
  
  const tableCanales = new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [2200, 2200, 4960],
    rows: [
      new TableRow({ children: [hCell("Canal", 2200), hCell("Patrón de datos", 2200), hCell("Uso en el widget de turno", 4960)] }),
      ...([
        ["DataClient",    "Estado sincronizado",  "Mantiene el ítem /queue/status (posición, número de turno, tiempo estimado) sincronizado en segundo plano. El reloj observa los cambios mediante un DataListener y actualiza la UI de forma reactiva."],
        ["MessageClient",  "Mensaje one-shot",    "Envía alertas urgentes al path /queue/alert (turno próximo, turno llamado). El reloj vibra y muestra una alerta prominente de inmediato."],
        ["ChannelClient",  "Streaming continuo",  "Disponible para flujo de datos de alta frecuencia. No se utiliza en la versión actual del widget; queda documentado para fases futuras del proyecto."],
      ].map(([c, p, u], i) => {
        const sh = i % 2 === 0 ? C.white : C.pale;
        return new TableRow({ children: [dCell(c, 2200, sh, true), gCell(p, 2200, sh), dCell(u, 4960, sh)] });
      }))
    ]
  });
  
  const tablePropiedades = new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [2200, 1800, 5360],
    rows: [
      new TableRow({ children: [hCell("Propiedad", 2200), hCell("Tipo Dart", 1800), hCell("Descripción", 5360)] }),
      ...([
        ["ticketNumber",     "String", "Número de turno asignado al usuario. Se muestra como dato principal, en la fuente de mayor tamaño de la pantalla."],
        ["queuePosition",    "int",    "Posición actual del usuario dentro de la fila. Se actualiza en tiempo real mediante DataClient."],
        ["estimatedMinutes", "int",    "Tiempo estimado restante en minutos, calculado por el backend y recibido junto con la posición."],
        ["isAmbient",        "bool",   "Indica si el reloj está en modo activo o en modo reposo (ambiente). Determina la paleta de color aplicada."],
        ["isCircular",       "bool",   "Indica la forma física de la pantalla del reloj, obtenida mediante ShapeOfScreen. Ajusta tamaños de fuente y márgenes."],
      ].map(([p, t, d], i) => {
        const sh = i % 2 === 0 ? C.white : C.pale;
        return new TableRow({ children: [dCell(p, 2200, sh, true), gCell(t, 1800, sh), dCell(d, 5360, sh)] });
      }))
    ]
  });
  
  const tableFlujo = new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [3300, 6060],
    rows: [
      new TableRow({ children: [hCell("Evento del sistema", 3300), hCell("Mecanismo de comunicación con el wearable", 6060)] }),
      ...([
        ["Actualización de posición en fila",     "DataClient.putDataItem('/queue/status') sincroniza el número de posición al reloj en segundo plano, sin interacción del usuario."],
        ["Turno próximo (< 3 personas adelante)", "MessageClient.sendMessage('/queue/alert') envía un mensaje one-shot. El reloj vibra y la pantalla muestra una alerta prominente."],
        ["Turno llamado — es tu turno",           "FCM al teléfono (firebase_messaging) y MessageClient al reloj se disparan de forma simultánea. Ambos dispositivos vibran y muestran notificación persistente."],
        ["Cancelación o abandono del turno",      "DataClient elimina el ítem /queue/status. El reloj detecta la ausencia del ítem y vuelve al estado inactivo del widget."],
      ].map(([ev, mec], i) => {
        const sh = i % 2 === 0 ? C.white : C.pale;
        return new TableRow({ children: [dCell(ev, 3300, sh, true), dCell(mec, 6060, sh)] });
      }))
    ]
  });
  
  // ── Tabla de páginas complementarias  [3000, 1800, 4560] = 9360
  const tablePaginas = new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 1800, 4560],
    rows: [
      new TableRow({ children: [hCell("Página", 3000), hCell("Ruta", 1800), hCell("Descripción", 4560)] }),
      ...([
        ["Política de privacidad", "/privacidad", "Informa al usuario sobre qué datos se recopilan (cuenta, tokens FCM, datos de turno), cómo se usan y cómo se protegen. Referencia al proyecto académico UTEQ."],
        ["Términos y condiciones", "/terminos",   "Regula el acceso y uso de la plataforma, la relación con establecimientos afiliados, propiedad intelectual, suspensión de cuentas y ley aplicable. Incluye índice navegable de 12 secciones."],
        ["Preguntas frecuentes",   "/faq",        "Centro de ayuda organizado por categorías: uso general, notificaciones y wearable. Responde dudas sobre toma de turno, soporte web y funcionamiento de alertas en Wear OS."],
        ["Contacto",               "/contacto",   "Datos de contacto del equipo (teléfono, correo, dirección UTEQ, horario) y formulario de contacto. Incluye acceso directo a redes sociales del proyecto."],
      ].map(([pag, ruta, desc], i) => {
        const sh = i % 2 === 0 ? C.white : C.pale;
        return new TableRow({ children: [dCell(pag, 3000, sh, true), gCell(ruta, 1800, sh), dCell(desc, 4560, sh)] });
      }))
    ]
  });
  
  // ── Portada — tabla de metadatos sin bordes ───────────────────────────────
  function metaRow(label, value) {
    const noBorder = { top: {style:BorderStyle.NONE}, bottom: {style:BorderStyle.NONE}, left: {style:BorderStyle.NONE}, right: {style:BorderStyle.NONE} };
    return new TableRow({ children: [
      new TableCell({ borders: noBorder, width: { size: 2200, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 0, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: C.mid, font: "Arial" })] })] }),
      new TableCell({ borders: noBorder, width: { size: 3800, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 0, right: 0 },
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, color: C.dark, font: "Arial" })] })] }),
    ]});
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTO
  // ═══════════════════════════════════════════════════════════════════════════
  const doc = new Document({
    numbering: {
      config: [
        { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ]
    },
    styles: {
      default: { document: { run: { font: "Arial", size: 20, color: C.dark } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Arial", color: C.dark },
          paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 22, bold: true, font: "Arial", color: C.mid },
          paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
      ]
    },
    sections: [{
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      headers: {
        default: new Header({ children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.line, space: 1 } },
            spacing: { after: 80 },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: "WIDGET DE ENLACE CON WEARABLE", bold: true, size: 16, color: C.mid, font: "Arial" }),
              new TextRun({ text: "\t" }),
              new TextRun({ text: "Virtual Queue — Junio 2026", size: 16, color: C.gray, font: "Arial" }),
            ]
          })
        ]})
      },
      footers: {
        default: new Footer({ children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: C.line, space: 1 } },
            spacing: { before: 80 }, alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "Página ", size: 16, color: C.gray, font: "Arial" }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.gray, font: "Arial" }),
              new TextRun({ text: " de ", size: 16, color: C.gray, font: "Arial" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: C.gray, font: "Arial" }),
            ]
          })
        ]})
      },
      children: [
  
        // ── PORTADA ───────────────────────────────────────────────────────────
        sp(600),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 100 },
          children: [new TextRun({ text: "WIDGET DE ENLACE CON WEARABLE", bold: true, size: 40, font: "Arial", color: C.dark })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 },
          children: [new TextRun({ text: "Documentación del componente TurnoWearWidget — Catálogo de Flutter", size: 24, font: "Arial", color: C.mid })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 },
          children: [new TextRun({ text: "Sistema de Gestión de Filas de Espera con Notificaciones a Wearable", size: 20, font: "Arial", color: C.gray })] }),
        sp(500),
        new Table({
          width: { size: 6000, type: WidthType.DXA }, columnWidths: [2200, 3800],
          alignment: AlignmentType.CENTER,
          rows: [
            metaRow("Materia:",  "Desarrollo para Dispositivos Inteligentes"),
            metaRow("Profesor:", "Manuel Contreras Castillo"),
            metaRow("Alumno:",   "Pablo Abraham Guerrero Alvarado"),
            metaRow("Fecha:",    "Junio 2026"),
          ]
        }),
        new Paragraph({ children: [new PageBreak()] }),
  
        // ── 1. INTRODUCCIÓN ───────────────────────────────────────────────────
        h1("1. Introducción"),
        body("El presente documento describe el diseño e implementación del widget responsable de enlazar la aplicación móvil de Virtual Queue con un dispositivo wearable (smartwatch Wear OS / Samsung Watch), utilizando exclusivamente paquetes disponibles en el catálogo oficial de Flutter."),
        body("El widget, denominado TurnoWearWidget, se ejecuta como aplicación companion dentro del reloj y muestra en tiempo real el número de turno asignado, la posición actual en la fila y el tiempo estimado de espera. Su comunicación con el teléfono se realiza mediante la Wearable Data Layer API de Android, expuesta hacia Dart a través del paquete flutter_wear_os_connectivity."),
        body("Se documentan a continuación: los paquetes evaluados y seleccionados del catálogo de Flutter, los componentes visuales y de ciclo de vida utilizados, los canales de comunicación bidireccional disponibles, la especificación técnica del widget, el flujo de eventos del sistema de filas y las páginas complementarias del sitio web que contextualizan la plataforma."),
        sp(),
  
        // ── 2. PAQUETES DEL CATÁLOGO ──────────────────────────────────────────
        h1("2. Selección de paquetes del catálogo de Flutter"),
        body("El catálogo oficial de Flutter (pub.dev) ofrece distintos paquetes para integración con wearables. La siguiente tabla resume la evaluación realizada y la decisión tomada para Virtual Queue:"),
        sp(80),
        tableCatalogo,
        sp(120),
        infoBox("Criterio de selección", "Se priorizaron paquetes con soporte oficial o ampliamente adoptado en el ecosistema Flutter, compatibles con Wear OS (plataforma objetivo del proyecto) y que no requieran código nativo Java/Kotlin adicional, manteniendo una única base de código en Dart para teléfono y reloj."),
        sp(),
  
        // ── 3. wear_plus ──────────────────────────────────────────────────────
        h1("3. wear_plus — Construcción de la app nativa para Wear OS"),
        body("wear_plus es el paquete del catálogo de Flutter utilizado para construir la interfaz que se ejecuta directamente en el reloj. Provee los componentes de ciclo de vida y adaptación visual específicos del hardware wearable:"),
        sp(80),
        tableWearPlusComp,
        sp(120),
        body("Estos tres componentes se anidan jerárquicamente en el árbol de widgets: WearApp como raíz, AmbientMode envolviendo el contenido sensible al modo de energía, y ShapeOfScreen ajustando el layout final según la geometría física de la pantalla."),
        sp(),
  
        // ── 4. flutter_wear_os_connectivity ──────────────────────────────────
        h1("4. flutter_wear_os_connectivity — Enlace bidireccional teléfono-reloj"),
        body("Este paquete implementa la Wearable Data Layer API de Android directamente desde Dart, sin requerir módulos nativos adicionales. Expone tres canales de comunicación, cada uno adecuado a un patrón de datos distinto:"),
        sp(80),
        tableCanales,
        sp(120),
        infoBox("Por qué dos canales y no uno solo", "DataClient y MessageClient cubren necesidades complementarias: el primero mantiene el estado sincronizado de forma silenciosa y eficiente en batería, mientras que el segundo está diseñado para alertas puntuales que requieren atención inmediata del usuario (vibración). Usar un único canal para ambos casos generaría o bien actualizaciones de estado con vibración innecesaria, o bien alertas urgentes con la latencia propia de la sincronización de datos."),
        sp(),
  
        // ── 5. ESPECIFICACIÓN DEL WIDGET ──────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        h1("5. Especificación técnica del widget — TurnoWearWidget"),
        body("TurnoWearWidget es la pantalla principal mostrada en el reloj. A continuación se detallan sus propiedades internas, alimentadas por el provider QueuePositionProvider (Riverpod) compartido entre la app Android y el módulo Wear OS:"),
        sp(80),
        tablePropiedades,
        sp(120),
  
        h2("5.1  Comportamiento visual según el modo del reloj"),
        body("Cuando isAmbient es verdadero (modo de bajo consumo / pantalla siempre activa), el widget cambia a fondo negro con texto blanco y reduce la frecuencia de redibujado, preservando la batería de la pantalla OLED. Cuando isAmbient es falso (modo activo), se utilizan los colores normales de la interfaz."),
        body("El parámetro isCircular ajusta el tamaño de fuente del número de turno: 32sp en pantallas circulares y 36sp en pantallas cuadradas, compensando la menor área útil de las esquinas en relojes circulares."),
        sp(80),
  
        h2("5.2  Implementación de referencia"),
        body("El siguiente fragmento ilustra la estructura del widget, anidando los tres componentes de wear_plus descritos en la sección 3:", 100),
        codeBlock([
          "class TurnoWearWidget extends ConsumerWidget {",
          "  const TurnoWearWidget({super.key});",
          "",
          "  @override",
          "  Widget build(BuildContext context, WidgetRef ref) {",
          "    final queueState = ref.watch(queuePositionProvider);",
          "",
          "    return WearApp(",
          "      child: AmbientMode(",
          "        builder: (context, mode, child) {",
          "          final isAmbient = mode == WearMode.ambient;",
          "          return MaterialApp(",
          "            theme: ThemeData(",
          "              scaffoldBackgroundColor:",
          "                  isAmbient ? Colors.black : Colors.white,",
          "            ),",
          "            home: ShapeOfScreen(",
          "              builder: (context, shape) => _TurnoScreen(",
          "                queueState: queueState,",
          "                isAmbient: isAmbient,",
          "                isCircular: shape == WearShape.round,",
          "              ),",
          "            ),",
          "          );",
          "        },",
          "      ),",
          "    );",
          "  }",
          "}",
        ]),
        sp(),
  
        // ── 6. FLUJO DE EVENTOS ───────────────────────────────────────────────
        h1("6. Flujo de eventos del sistema de filas hacia el wearable"),
        body("La siguiente tabla describe el mecanismo de comunicación activado ante cada evento relevante del sistema de gestión de filas, conectando la lógica de negocio del backend con los canales documentados en la sección 4:"),
        sp(80),
        tableFlujo,
        sp(120),
        body("El siguiente fragmento ilustra el envío de la alerta de turno próximo mediante MessageClient, disparado cuando la posición del usuario en la fila es menor a tres personas:", 100),
        codeBlock([
          "Future<void> sendTurnAlert(String message) async {",
          "  final nodes = await _connectivity.getConnectedDevices();",
          "  for (final node in nodes) {",
          "    await _connectivity.sendMessage(",
          "      nodeId: node.id,",
          "      path: '/queue/alert',",
          "      data: Uint8List.fromList(message.codeUnits),",
          "    );",
          "  }",
          "}",
        ]),
        sp(),
  
        // ── 7. RELACIÓN CON FCM ───────────────────────────────────────────────
        h1("7. Relación con Firebase Cloud Messaging"),
        body("El widget de wearable documentado en este entregable complementa, sin reemplazar, el mecanismo de notificaciones push existente del proyecto. FCM continúa siendo el canal responsable de la entrega garantizada al teléfono Android, incluso si el dispositivo está momentáneamente desconectado."),
        body("flutter_wear_os_connectivity aporta una vía adicional de menor latencia, útil cuando el teléfono y el reloj están emparejados y activos simultáneamente. Ante el evento \"turno llamado\", ambos canales se disparan en paralelo: FCM garantiza la notificación al teléfono y MessageClient garantiza la vibración inmediata en el reloj."),
        sp(),
  
        // ── 8. CONCLUSIÓN ─────────────────────────────────────────────────────
        h1("8. Conclusión"),
        body("El widget TurnoWearWidget cumple con el lineamiento solicitado al integrarse directamente con dispositivos wearable disponibles en el catálogo oficial de Flutter, sin requerir desarrollo nativo Java/Kotlin ni SDKs propietarios adicionales."),
        body("La combinación de wear_plus (construcción de la interfaz del reloj) y flutter_wear_os_connectivity (comunicación bidireccional vía Wearable Data Layer API) permite que el sistema de filas de Virtual Queue mantenga al usuario informado en tiempo real sobre su turno, ya sea mediante sincronización silenciosa de estado (DataClient) o mediante alertas urgentes con vibración (MessageClient), coexistiendo con el canal de FCM ya documentado en entregables previos."),
        sp(),
  
        // ── 9. PÁGINAS COMPLEMENTARIAS ────────────────────────────────────────
        new Paragraph({ children: [new PageBreak()] }),
        h1("9. Páginas complementarias del sitio web"),
        body("El frontend web de Virtual Queue incluye un conjunto de páginas públicas accesibles sin autenticación que contextualizan la plataforma para el usuario final. Estas páginas forman parte del sitio público (PublicLayout) y están disponibles desde el menú de navegación principal."),
        sp(80),
        tablePaginas,
        sp(120),
        body("A continuación se presentan capturas de pantalla de cada página complementaria tal como se visualizan en producción:"),
        sp(80),
  
        // Privacidad
        h2("9.1  Política de privacidad (/privacidad)"),
        body("Informa al usuario sobre el tratamiento de sus datos personales. Identifica a VirtualQueue como proyecto académico de la UTEQ y detalla las categorías de datos recopilados: información de cuenta, tokens FCM y datos de turno.", 80),
        ...imgBlock(imgPrivacidad, W_PX, H_PRIV, "Figura 1. Página de Política de privacidad — secciones responsable del tratamiento, datos que se recopilan y uso de la información."),
        sp(80),
  
        // Términos
        h2("9.2  Términos y condiciones de uso (/terminos)"),
        body("Documenta las condiciones de acceso y uso de la plataforma mediante 12 secciones navegables. Establece la relación con establecimientos afiliados, las restricciones de uso y la ley aplicable.", 80),
        ...imgBlock(imgTerminos, W_PX, H_TERM, "Figura 2. Página de Términos y condiciones — portada y tabla de contenido con las 12 secciones del documento legal."),
        sp(80),
  
        // FAQ
        h2("9.3  Preguntas frecuentes (/faq)"),
        body("Centro de ayuda organizado por categorías. La sección «Notificaciones y wearable» documenta explícitamente que la app envía avisos push al teléfono y al reloj Wear OS cuando el turno se aproxima.", 80),
        ...imgBlock(imgFaq, W_PX, H_FAQ, "Figura 3. Página de Preguntas frecuentes — categorías de uso general y notificaciones/wearable."),
        sp(80),
  
        // Contacto
        h2("9.4  Contacto (/contacto)"),
        body("Centraliza los datos de contacto del equipo (teléfono, correo institucional UTEQ, dirección y horario) junto a un formulario de contacto directo y acceso a redes sociales del proyecto.", 80),
        ...imgBlock(imgContacto, W_PX, H_CONT, "Figura 4. Página de Contacto — datos de la institución, formulario y redes sociales."),
        sp(240),
  
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 1 } },
          spacing: { before: 200, after: 0 },
          children: [new TextRun({ text: "Widget de Enlace con Wearable  |  Virtual Queue", size: 18, color: C.gray, font: "Arial" })]
        }),
      ]
    }]
  });
  
  const outFile = path.join(__dirname, 'widget_wearable_v2.docx');

  Packer.toBuffer(doc).then(buf => {
    fs.writeFileSync(outFile, buf);
    console.log(`OK — ${outFile} generado.`);
  }).catch(err => {
    console.error("ERROR:", err);
    process.exit(1);
  });