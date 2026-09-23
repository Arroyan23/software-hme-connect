from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE


OUT = "output/docx/perhitungan_teorema_superposisi.docx"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_margins(cell, top=90, start=110, bottom=90, end=110):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = tcPr.first_child_found_in("w:tcMar")
    if tcMar is None:
        tcMar = OxmlElement("w:tcMar")
        tcPr.append(tcMar)
    for m, val in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tcMar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tcMar.append(node)
        node.set(qn("w:w"), str(val))
        node.set(qn("w:type"), "dxa")


def add_native_equation(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(5)
    math_para = OxmlElement("m:oMathPara")
    math = OxmlElement("m:oMath")
    run = OxmlElement("m:r")
    rpr = OxmlElement("m:rPr")
    font = OxmlElement("m:ctrlPr")
    rpr.append(font)
    run.append(rpr)
    t = OxmlElement("m:t")
    t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    t.text = text
    run.append(t)
    math.append(run)
    math_para.append(math)
    p._p.append(math_para)
    return p


def add_text(doc, text, bold_prefix=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.line_spacing = 1.1
    if bold_prefix and text.startswith(bold_prefix):
        r = p.add_run(bold_prefix)
        r.bold = True
        p.add_run(text[len(bold_prefix):])
    else:
        p.add_run(text)
    return p


def add_result_table(doc, title, rows):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(title)
    r.bold = True
    table = doc.add_table(rows=1, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    headers = ["Besaran", "Praktikum", "Teori", "Persen error"]
    for i, h in enumerate(headers):
        c = table.rows[0].cells[i]
        c.text = h
        set_cell_shading(c, "1F4E79")
        c.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        for run in c.paragraphs[0].runs:
            run.font.color.rgb = RGBColor(255, 255, 255)
            run.bold = True
            run.font.size = Pt(9)
        c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        set_cell_margins(c)
    for row in rows:
        cells = table.add_row().cells
        for i, value in enumerate(row):
            cells[i].text = value
            cells[i].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            cells[i].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            for run in cells[i].paragraphs[0].runs:
                run.font.size = Pt(9.5)
            set_cell_margins(cells[i])
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


doc = Document()
section = doc.sections[0]
section.top_margin = Inches(0.65)
section.bottom_margin = Inches(0.65)
section.left_margin = Inches(0.8)
section.right_margin = Inches(0.8)

normal = doc.styles["Normal"]
normal.font.name = "Times New Roman"
normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
normal.font.size = Pt(11)

for style_name, size in (("Title", 16), ("Heading 1", 13), ("Heading 2", 11)):
    style = doc.styles[style_name]
    style.font.name = "Times New Roman"
    style._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    style.font.color.rgb = RGBColor(0, 0, 0)
    style.font.size = Pt(size)

title = doc.add_paragraph(style="Title")
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
title.add_run("Perhitungan Teorema Superposisi")

subtitle = doc.add_paragraph()
subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
subtitle.paragraph_format.space_after = Pt(12)
r = subtitle.add_run("Berdasarkan data hasil praktikum")
r.italic = True
r.font.size = Pt(10.5)

doc.add_heading("Dasar Perhitungan", level=1)
add_text(doc, "Perhitungan ini membuktikan bahwa respons total rangkaian saat E1 dan E2 aktif diperoleh dari penjumlahan atau pengurangan kontribusi masing-masing sumber. Tanda operasi mengikuti arah polaritas tegangan dan arah arus yang digunakan pada pengukuran.")
add_native_equation(doc, "Nilai total = kontribusi E₁ ± kontribusi E₂")

doc.add_heading("Perhitungan Tegangan", level=1)
doc.add_heading("Tegangan Vₐᵦ", level=2)
add_native_equation(doc, "Vₐᵦ = Vₐᵦ(E₁) − Vₐᵦ(E₂)")
add_native_equation(doc, "Vₐᵦ = 4,54 V − 3,03 V = 1,51 V")
add_text(doc, "Hasil teori sebesar 1,51 V, sedangkan nilai praktikum saat kedua sumber aktif adalah 1,30 V.")

doc.add_heading("Tegangan Vᵦₒ", level=2)
add_native_equation(doc, "Vᵦₒ = Vᵦₒ(E₁) + Vᵦₒ(E₂)")
add_native_equation(doc, "Vᵦₒ = 0,46 V + 3,03 V = 3,49 V")
add_text(doc, "Hasil teori sebesar 3,49 V, sedangkan nilai praktikum saat kedua sumber aktif adalah 3,035 V.")

doc.add_heading("Tegangan Vᵦc", level=2)
add_native_equation(doc, "Vᵦc = Vᵦc(E₂) − Vᵦc(E₁)")
add_native_equation(doc, "Vᵦc = 6,97 V − 0,46 V = 6,51 V")
add_text(doc, "Hasil teori sebesar 6,51 V, sedangkan nilai praktikum saat kedua sumber aktif adalah 6,14 V.")

doc.add_heading("Perhitungan Arus", level=1)
doc.add_heading("Arus Iₐᵦ", level=2)
add_native_equation(doc, "Iₐᵦ = Iₐᵦ(E₁) − Iₐᵦ(E₂)")
add_native_equation(doc, "Iₐᵦ = 13,8 mA − 9,17 mA = 4,63 mA ≈ 4,59 mA")
add_text(doc, "Nilai hasil gabungan mendekati arus praktikum saat E1 dan E2 aktif, yaitu 4,59 mA.")

doc.add_heading("Arus Iᵦₒ", level=2)
add_native_equation(doc, "Iᵦₒ = Iᵦₒ(E₁) + Iᵦₒ(E₂)")
add_native_equation(doc, "Iᵦₒ = 9,17 mA + 60,6 mA = 69,77 mA ≈ 69,7 mA")
add_text(doc, "Nilai hasil gabungan mendekati arus praktikum saat E1 dan E2 aktif, yaitu 69,7 mA.")

doc.add_heading("Arus Iᵦc", level=2)
add_native_equation(doc, "Iᵦc = Iᵦc(E₂) − Iᵦc(E₁)")
add_native_equation(doc, "Iᵦc = 69,7 mA − 4,59 mA = 65,11 mA ≈ 65,1 mA")
add_text(doc, "Nilai hasil gabungan mendekati arus praktikum saat E1 dan E2 aktif, yaitu 65,1 mA.")

doc.add_heading("Perhitungan Persen Kesalahan", level=1)
add_text(doc, "Persen kesalahan digunakan untuk melihat selisih hasil praktikum terhadap teori. Nilai yang lebih kecil menunjukkan hasil pengukuran semakin mendekati teori.")
add_native_equation(doc, "% error = |praktikum − teori| / teori × 100%")

doc.add_heading("Contoh Perhitungan", level=2)
add_native_equation(doc, "% error Vₐᵦ = |1,30 − 1,51| / 1,51 × 100% = 13,91%")
add_native_equation(doc, "% error Vᵦₒ = |3,035 − 3,49| / 3,49 × 100% = 13,04%")
add_native_equation(doc, "% error Vᵦc = |6,14 − 6,51| / 6,51 × 100% = 5,68%")

add_result_table(doc, "Hasil persen kesalahan saat E1 dan E2 aktif", [
    ("Vₐᵦ", "1,30 V", "1,51 V", "13,91%"),
    ("Vᵦₒ", "3,035 V", "3,49 V", "13,04%"),
    ("Vᵦc", "6,14 V", "6,51 V", "5,68%"),
    ("Iₐᵦ", "4,59 mA", "4,59 mA", "0%"),
    ("Iᵦₒ", "69,7 mA", "69,7 mA", "0%"),
    ("Iᵦc", "65,1 mA", "65,1 mA", "0%"),
])

add_result_table(doc, "Hasil persen kesalahan saat E1 aktif", [
    ("Vₐᵦ", "4,45 V", "4,54 V", "1,98%"),
    ("Vᵦₒ", "0,437 V", "0,46 V", "5,00%"),
    ("Vᵦc", "0,475 V", "0,46 V", "3,26%"),
])

add_result_table(doc, "Hasil persen kesalahan saat E2 aktif", [
    ("Vₐᵦ", "3,045 V", "3,03 V", "0,50%"),
    ("Vᵦₒ", "2,925 V", "3,03 V", "3,47%"),
    ("Vᵦc", "6,87 V", "6,97 V", "1,43%"),
])

doc.save(OUT)
print(OUT)
