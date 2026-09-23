from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

OUT = "output/docx/perhitungan_superposisi_ringkas.docx"


def clear_borders(paragraph):
    pPr = paragraph._p.get_or_add_pPr()
    for child in list(pPr):
        if child.tag == qn("w:pBdr"):
            pPr.remove(child)


def equation(doc, value):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    omath_para = OxmlElement("m:oMathPara")
    omath = OxmlElement("m:oMath")
    run = OxmlElement("m:r")
    text = OxmlElement("m:t")
    text.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    text.text = value
    run.append(text)
    omath.append(run)
    omath_para.append(omath)
    p._p.append(omath_para)


def heading(doc, value):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(value)
    r.bold = True
    r.font.size = Pt(11)


def note(doc, value):
    p = doc.add_paragraph(value)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.0
    for r in p.runs:
        r.font.size = Pt(10)


doc = Document()
sec = doc.sections[0]
sec.top_margin = Inches(0.55)
sec.bottom_margin = Inches(0.55)
sec.left_margin = Inches(0.75)
sec.right_margin = Inches(0.75)

normal = doc.styles["Normal"]
normal.font.name = "Times New Roman"
normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
normal.font.size = Pt(10.5)

title_style = doc.styles["Title"]
style_ppr = title_style._element.get_or_add_pPr()
for child in list(style_ppr):
    if child.tag == qn("w:pBdr"):
        style_ppr.remove(child)

title = doc.add_paragraph(style="Title")
clear_borders(title)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
title.paragraph_format.space_after = Pt(8)
run = title.add_run("Perhitungan Teorema Superposisi")
run.font.name = "Times New Roman"
run.font.size = Pt(15)
run.font.color.rgb = RGBColor(0, 0, 0)

heading(doc, "Rumus dasar")
equation(doc, "Nilai total = kontribusi E₁ ± kontribusi E₂")

heading(doc, "1. Saat E1 dan E2 aktif")
equation(doc, "Vₐᵦ = Vₐᵦ(E₁) − Vₐᵦ(E₂)")
equation(doc, "Vₐᵦ = 4,54 − 3,03 = 1,51 V")
equation(doc, "Vᵦₒ = Vᵦₒ(E₁) + Vᵦₒ(E₂)")
equation(doc, "Vᵦₒ = 0,46 + 3,03 = 3,49 V")
equation(doc, "Vᵦc = Vᵦc(E₂) − Vᵦc(E₁)")
equation(doc, "Vᵦc = 6,97 − 0,46 = 6,51 V")

heading(doc, "2. Pembuktian arus total")
equation(doc, "Iₐᵦ = Iₐᵦ(E₁) − Iₐᵦ(E₂)")
equation(doc, "Iₐᵦ = 13,8 − 9,17 = 4,63 mA")
note(doc, "Nilai tersebut mendekati hasil tabel, yaitu 4,59 mA.")
equation(doc, "Iᵦₒ = Iᵦₒ(E₁) + Iᵦₒ(E₂)")
equation(doc, "Iᵦₒ = 9,17 + 60,6 = 69,77 mA")
note(doc, "Nilai tersebut mendekati hasil tabel, yaitu 69,7 mA.")
equation(doc, "Iᵦc = Iᵦc(E₂) − Iᵦc(E₁)")
equation(doc, "Iᵦc = 69,7 − 4,59 = 65,11 mA")
note(doc, "Nilai tersebut mendekati hasil tabel, yaitu 65,1 mA.")

heading(doc, "3. Contoh persen kesalahan Superposisi")
note(doc, "Rumus persen kesalahan:")
equation(doc, "% error = |praktikum − teori| / teori × 100%")
note(doc, "Untuk Vab saat E1 dan E2 aktif:")
equation(doc, "% error = |1,3 − 1,51| / 1,51 × 100%")
equation(doc, "% error = 13,91%")
note(doc, "Untuk Vbo:")
equation(doc, "% error = |3,035 − 3,49| / 3,49 × 100%")
equation(doc, "% error = 13,04%")
note(doc, "Untuk Vbc:")
equation(doc, "% error = |6,14 − 6,51| / 6,51 × 100%")
equation(doc, "% error = 5,68%")

doc.save(OUT)
print(OUT)
