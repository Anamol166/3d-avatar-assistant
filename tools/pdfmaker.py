import wikipediaapi
import io
from fpdf import FPDF
from unidecode import unidecode

wiki = wikipediaapi.Wikipedia(
    user_agent="Assistant/1.0", 
    language='en',
    extract_format=wikipediaapi.ExtractFormat.WIKI
)

def search_wikipedia(query):
    try:
        page = wiki.page(query)
        if page.exists():
            content = page.text
            if content:
                return unidecode(content)
            else:
                return f"Wikipedia page for '{query}' exists but has no text content."
        return f"No Wikipedia article found for '{query}'."
    except Exception as e:
        return f"Search error: {str(e)}"

class PDF(FPDF):
    def header(self):
        self.set_font("Arial", "B", 16)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

def create_pdf(text_content, title="Assistant Research Report"):
    pdf = PDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, unidecode(title), ln=True, align="C")
    pdf.ln(5)
    pdf.set_font("Arial", size=11)

    if not text_content:
        text_content = "No content available."
    else:
        paragraphs = text_content.split("\n")
        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if paragraph:
                cleaned = unidecode(paragraph)
                pdf.multi_cell(0, 8, cleaned)
                pdf.ln(2)
    output = pdf.output(dest='S')
    if isinstance(output, str):
        output = output.encode('latin-1')
        
    return io.BytesIO(output)