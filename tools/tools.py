import wikipediaapi
import os
from fpdf import FPDF
import datetime
from unidecode import unidecode

wiki = wikipediaapi.Wikipedia(
    user_agent="LunaAssistant/1.1",
    language='en',
    extract_format=wikipediaapi.ExtractFormat.WIKI
)

def search_wikipedia(query):
    try:
        page = wiki.page(query)
        if page.exists():
            return unidecode(page.text) 
        return "No Wikipedia article found for this topic."
    except Exception as e:
        return f"Search error: {str(e)}"

def create_pdf(text_content, title="Luna Research Report"):
    try:
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        
        pdf.set_font("Arial", 'B', size=16)
        pdf.cell(0, 10, txt=unidecode(title), ln=1, align='C')
        pdf.ln(5)
        
        pdf.set_font("Arial", size=11)
        
        paragraphs = text_content.split('\n')
        for para in paragraphs:
            if para.strip():
                pdf.multi_cell(0, 10, txt=unidecode(para))
                pdf.ln(2) 
        
        filename = f"detailed_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        output_dir = os.path.join(os.getcwd(), 'assets', 'downloads')
        if not os.path.exists(output_dir): 
            os.makedirs(output_dir)
            
        file_path = os.path.join(output_dir, filename)
        pdf.output(file_path)
        
        return {"status": "success", "url": f"/assets/downloads/{filename}"}
    except Exception as e:
        print(f"CRITICAL PDF ERROR: {e}") 
        return {"status": "error", "message": str(e)}