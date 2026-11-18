"""Genera REPORTE_Practica13_14.pdf desde REPORTE_Practica13_14.md."""

import re
import shutil
from pathlib import Path

from fpdf import FPDF
from fpdf.fonts import FontFace

ROOT = Path(__file__).resolve().parent
MD = ROOT / "REPORTE_Practica13_14.md"
OUT = ROOT / "REPORTE_Practica13_14.pdf"
LOGO = ROOT / "reporte" / "logo-uteq.png"
LOGO_SRC = ROOT.parent / "practica-11" / "reporte" / "logo-uteq.png"

NEGRO = (0, 0, 0)
BLANCO = (255, 255, 255)

FONTS = {
    "": r"C:\Windows\Fonts\times.ttf",
    "B": r"C:\Windows\Fonts\timesbd.ttf",
    "I": r"C:\Windows\Fonts\timesi.ttf",
}


def strip_inline_md(text: str) -> str:
    text = text.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    return text.strip()


def is_table_sep(line: str) -> bool:
    s = line.strip()
    if not s.startswith("|"):
        return False
    return bool(re.match(r"^\|[\s\-:|]+\|$", s))


class Reporte(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("TNRoman", "", 9)
        self.set_text_color(*NEGRO)
        usable = self.w - self.l_margin - self.r_margin
        self.cell(usable - 22, 6, "Prácticas 13-14  ·  Automatización y CI Turnix", align="L")
        self.cell(22, 6, "UTEQ", align="R")
        self.ln(2)
        self.set_draw_color(*NEGRO)
        self.set_line_width(0.4)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(8)

    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-14)
        self.set_draw_color(*NEGRO)
        self.set_line_width(0.3)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(2)
        self.set_font("TNRoman", "", 9)
        self.set_text_color(*NEGRO)
        self.cell(0, 6, str(self.page_no() - 1), align="C")

    def titulo(self, texto):
        self.set_text_color(*NEGRO)
        self.set_font("TNRoman", "B", 13)
        self.ln(2)
        self.multi_cell(0, 7, texto)
        self.ln(1)

    def subtitulo(self, texto):
        self.ln(1)
        self.set_font("TNRoman", "B", 11)
        self.set_text_color(*NEGRO)
        self.multi_cell(0, 6, texto)
        self.ln(1)

    def parrafo(self, texto):
        self.set_x(self.l_margin)
        self.set_font("TNRoman", "", 11)
        self.set_text_color(*NEGRO)
        self.multi_cell(self.epw, 5.4, texto)
        self.ln(1.4)

    def bullet(self, texto):
        self.set_x(self.l_margin)
        self.set_font("TNRoman", "", 11)
        self.multi_cell(self.epw, 5.4, f"- {texto}")
        self.ln(0.8)


def portada(pdf: Reporte):
    pdf.add_page()
    pdf.set_text_color(*NEGRO)

    logo_w = 118
    if LOGO.exists():
        pdf.image(str(LOGO), x=(pdf.w - logo_w) / 2, y=28, w=logo_w)
    pdf.set_y(78)

    pdf.set_font("TNRoman", "", 12)
    pdf.cell(0, 7, "Universidad Tecnológica de Querétaro", align="C")
    pdf.ln(16)

    pdf.set_font("TNRoman", "B", 18)
    pdf.multi_cell(0, 9, "Prácticas 13 y 14", align="C")
    pdf.ln(2)
    pdf.set_font("TNRoman", "B", 14)
    pdf.multi_cell(
        0,
        7,
        "Automatización de pruebas y\nvalidación continua de aplicaciones móviles",
        align="C",
    )
    pdf.ln(16)

    bloques = (
        ("Materia", "Desarrollo de Dispositivos"),
        ("Grupo", "IDGS14"),
        ("Alumno", "Pablo Abraham Guerrero Alvarado\nMatrícula 2022371197"),
        ("Docente", "Manuel Contreras Castillo"),
        ("Proyecto", "Virtual Queue / Turnix"),
        ("Fecha de entrega", "17 de noviembre de 2026"),
    )
    for etiqueta, valor in bloques:
        pdf.set_font("TNRoman", "", 11)
        pdf.cell(0, 6, f"{etiqueta}:", align="C")
        pdf.ln(6)
        pdf.set_font("TNRoman", "B", 12)
        pdf.multi_cell(0, 6, valor, align="C")
        pdf.ln(6)


def tabla(pdf: Reporte, encabezados, filas):
    n = len(encabezados)
    if n == 0:
        return
    ancho_total = pdf.epw
    anchos = [ancho_total / n] * n
    cabecera = FontFace(emphasis="BOLD", color=BLANCO, fill_color=NEGRO)
    cuerpo = FontFace(emphasis="", color=NEGRO, fill_color=BLANCO)
    size = 6.5 if n >= 6 else (7 if n >= 5 else 8)
    pdf.set_font("TNRoman", "", size)
    pdf.set_text_color(*NEGRO)
    pdf.set_draw_color(*NEGRO)
    with pdf.table(
        col_widths=anchos,
        line_height=5.2,
        text_align="LEFT",
        headings_style=cabecera,
        cell_fill_mode="NONE",
        padding=1.2,
    ) as t:
        fila = t.row()
        for h in encabezados:
            fila.cell(strip_inline_md(h))
        for valores in filas:
            fila = t.row(style=cuerpo)
            padded = list(valores) + [""] * (n - len(valores))
            for valor in padded[:n]:
                fila.cell(strip_inline_md(str(valor)))
    pdf.ln(2)


def render_markdown(pdf: Reporte, path: Path) -> None:
    lines = path.read_text(encoding="utf-8").splitlines()
    i = 0
    started = False

    while i < len(lines):
        stripped = lines[i].strip()

        if not started:
            if stripped.startswith("## "):
                started = True
            else:
                i += 1
                continue

        if stripped == "---":
            i += 1
            continue

        if stripped.startswith("## "):
            pdf.titulo(strip_inline_md(stripped[3:]))
            i += 1
            continue

        if stripped.startswith("### "):
            pdf.subtitulo(strip_inline_md(stripped[4:]))
            i += 1
            continue

        if stripped.startswith("|") and not is_table_sep(stripped):
            header = [c.strip() for c in stripped.strip("|").split("|")]
            i += 1
            if i < len(lines) and is_table_sep(lines[i]):
                i += 1
            body = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                if is_table_sep(lines[i]):
                    i += 1
                    continue
                body.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            tabla(pdf, header, body)
            continue

        if stripped.startswith("- "):
            pdf.bullet(strip_inline_md(stripped[2:]))
            i += 1
            continue

        if re.match(r"^\d+\.\s", stripped):
            pdf.parrafo(strip_inline_md(stripped))
            i += 1
            continue

        if stripped and not stripped.startswith("#"):
            pdf.parrafo(strip_inline_md(stripped))
        i += 1


def construir():
    if not MD.exists():
        raise FileNotFoundError(f"No se encontró el markdown: {MD}")
    LOGO.parent.mkdir(parents=True, exist_ok=True)
    if not LOGO.exists() and LOGO_SRC.exists():
        shutil.copy(LOGO_SRC, LOGO)

    pdf = Reporte(format="A4")
    for estilo, ruta in FONTS.items():
        pdf.add_font("TNRoman", estilo, ruta)
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_margins(18, 22, 18)

    portada(pdf)
    pdf.add_page()
    render_markdown(pdf, MD)

    pdf.output(str(OUT))
    print(OUT)


if __name__ == "__main__":
    construir()
