"""Insert Entregable 1 evidence (images + comparative table) into the cronograma Word file."""

from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from docx.oxml import OxmlElement

SRC = Path(r"c:\Users\Palot\Downloads\Cronograma_Entregables_VirtualQueue_Movil.docx")
OUT_DOWNLOADS = SRC
OUT_REPO = Path(
    r"c:\Users\Palot\Documents\Desarrollo-software\9no-uteq\desarrollo-dispositivos"
    r"\virtual_queue_phone\reporte_septiembre\Cronograma_Entregables_VirtualQueue_Movil.docx"
)
IMGS = Path(
    r"c:\Users\Palot\Documents\Desarrollo-software\9no-uteq\desarrollo-dispositivos"
    r"\virtual_queue_phone\reporte_septiembre\imgs"
)

IMG_LOGIN = IMGS / "image1.png"
IMG_TURNO = IMGS / "image.png"
IMG_TREE = IMGS / "image2.png"


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


def shade_cell(cell, hex_color):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def set_cell_text(cell, text, *, bold=False, fill=None, white=False):
    cell.text = ""
    p = cell.paragraphs[0]
    run = p.add_run(text)
    set_run_font(run, size=10, bold=bold, color=RGBColor(255, 255, 255) if white else None)
    if fill:
        shade_cell(cell, fill)
    for paragraph in cell.paragraphs:
        paragraph.paragraph_format.space_after = Pt(2)
        paragraph.paragraph_format.space_before = Pt(2)


def insert_picture(paragraph, path, width_cm):
    paragraph.clear()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run()
    run.add_picture(str(path), width=Cm(width_cm))


def insert_table_after(paragraph, document, headers, rows):
    table = document.add_table(rows=1 + len(rows), cols=len(headers))
    table.autofit = True
    tbl = table._tbl
    tblPr = tbl.tblPr
    if tblPr is None:
        tblPr = OxmlElement("w:tblPr")
        tbl.insert(0, tblPr)
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), "7C3AED")
        borders.append(el)
    tblPr.append(borders)

    header_fill = "7C3AED"
    for i, h in enumerate(headers):
        set_cell_text(table.rows[0].cells[i], h, bold=True, fill=header_fill, white=True)

    alt = "F3E8FF"
    for r_i, row in enumerate(rows):
        fill = alt if r_i % 2 == 0 else "FFFFFF"
        for c_i, value in enumerate(row):
            set_cell_text(
                table.rows[r_i + 1].cells[c_i],
                value,
                bold=(c_i == 0),
                fill=fill,
            )

    paragraph._p.addnext(table._tbl)
    # remove the empty table that add_table appended at the document end
    body = document.element.body
    # the last tbl might be the one we added then moved; if a duplicate remains at end, drop it
    tbls = body.findall(qn("w:tbl"))
    if len(tbls) >= 2 and tbls[-1] is not table._tbl:
        # moved table is not last; last is leftover empty? check
        pass
    # python-docx add_table inserts at end; addnext copies the same element reference,
    # so the table is now after paragraph AND still at end? Actually _tbl is the same
    # element: addnext moves it in the tree. No leftover.

    return table


def replace_description(paragraph, text):
    paragraph.clear()
    run = paragraph.add_run(text)
    set_run_font(run, size=11)
    paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY


def main():
    doc = Document(str(SRC))
    paras = list(doc.paragraphs)

    # Map index of placeholder paragraphs in Entregable 1 only (first 7).
    placeholders = []
    descriptions = []
    for p in paras:
        t = para_text(p)
        if t.startswith("[ Espacio para imagen"):
            placeholders.append(p)
        elif t.startswith("Descripción de la evidencia:"):
            descriptions.append(p)

    # First 7 of each list belong to Entregable 1 (Septiembre).
    e1_ph = placeholders[:7]
    e1_desc = descriptions[:7]

    # 0: flutter run — sin captura de terminal; no se toca
    # 1: tabla comparativa
    # 2: árbol de carpetas → image2.png
    # 3: login → image1.png
    # 4: turno → image.png
    # 5: búsqueda — sin captura
    # 6: navegación — sin captura

    insert_table_after(
        e1_ph[1],
        doc,
        ["Criterio", "Flutter", "React Native", "Nativo (Kotlin / Swift)"],
        [
            [
                "Reutilización con Wear OS",
                "Alta (mismo Dart y núcleo compartido)",
                "Baja (otra base tecnológica)",
                "Nula (código distinto por plataforma)",
            ],
            [
                "Multiplataforma",
                "Android, iOS y Wear OS",
                "Android e iOS",
                "Una plataforma por codebase",
            ],
            [
                "Curva de aprendizaje del equipo",
                "El equipo IDGS14 ya usa Dart/Flutter",
                "Requiere adoptar JS/TS y el bridge",
                "Kotlin y Swift por separado",
            ],
            [
                "Rendimiento",
                "Compila a código nativo",
                "Puente JS; menor control nativo",
                "Máximo, cercano al hardware",
            ],
            [
                "Ecosistema del proyecto",
                "Ya validado (Wear: Dio, Riverpod, STOMP, go_router)",
                "No usado en Virtual Queue",
                "No usado en Virtual Queue",
            ],
            [
                "Costo y tiempo",
                "Una base para teléfono y reloj",
                "No reutiliza el cliente Wear",
                "Dos o tres bases de código",
            ],
        ],
    )
    e1_ph[1].clear()
    caption = e1_ph[1].add_run(
        "Tabla 1. Comparativa de frameworks para el cliente móvil de teléfono."
    )
    set_run_font(caption, size=10, italic=True)
    e1_ph[1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    replace_description(
        e1_desc[1],
        "Descripción de la evidencia: se selecciona Flutter. Comparte código con "
        "virtual-queue-mobile (Wear OS), reduce el tiempo de adopción del equipo IDGS14, "
        "cubre Android/iOS y Wear con una sola base y ya usa Dio, Riverpod, STOMP y "
        "go_router en producción dentro del reloj.",
    )

    insert_picture(e1_ph[2], IMG_TREE, 12.5)
    replace_description(
        e1_desc[2],
        "Descripción de la evidencia: árbol de virtual_queue_phone en el IDE. "
        "La UI de teléfono vive en lib/features (auth, places, ticket), el estado mock "
        "en lib/providers y el núcleo reutilizable (auth, Dio, STOMP, modelos) se extrae "
        "a packages/virtual_queue_core, consumido por path desde Wear OS y el teléfono.",
    )

    insert_picture(e1_ph[3], IMG_LOGIN, 7.2)
    replace_description(
        e1_desc[3],
        "Descripción de la evidencia: maqueta de login en el emulador Medium Phone. "
        "Muestra marca Turnix, tagline, campos de usuario y contraseña con validación "
        "obligatoria, y botón Entrar. Aún no llama a POST /api/auth/login (octubre).",
    )

    insert_picture(e1_ph[4], IMG_TURNO, 7.2)
    replace_description(
        e1_desc[4],
        "Descripción de la evidencia: maqueta de turno activo con datos de ejemplo "
        "(A-042, BBVA Bancomer Querétaro Centro, posición 3, 8 min, estado En espera). "
        "Barra inferior con rutas Mi turno y Establecimientos. Chip Sin API: el ping a "
        "/actuator/health corre contra 10.0.2.2:8080; el backend no estaba levantado "
        "en esa captura.",
    )

    OUT_REPO.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(OUT_DOWNLOADS))
    doc.save(str(OUT_REPO))
    print("saved", OUT_DOWNLOADS)
    print("saved", OUT_REPO)


if __name__ == "__main__":
    main()
