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
            # Get the FULL text
            return unidecode(page.text) 
        return "No Wikipedia article found for this topic."
    except Exception as e:
        return f"Search error: {str(e)}"

def create_pdf(text_content, title="Luna Research Report"):
    try:
        # 1. Setup PDF with Auto-Page Breaks
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        
        # 2. Title Section
        pdf.set_font("Arial", 'B', size=16)
        pdf.cell(0, 10, txt=unidecode(title), ln=1, align='C')
        pdf.ln(5)
        
        # 3. Content Section (The 200+ lines part)
        pdf.set_font("Arial", size=11)
        
        # We split text into paragraphs to handle very long strings better
        paragraphs = text_content.split('\n')
        for para in paragraphs:
            if para.strip(): # Only add if paragraph isn't empty
                # Multi_cell handles the wrapping and new pages automatically
                pdf.multi_cell(0, 10, txt=unidecode(para))
                pdf.ln(2) # Small gap between paragraphs
        
        # 4. Save Logic
        filename = f"detailed_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        output_dir = os.path.join(os.getcwd(), 'assets', 'downloads')
        if not os.path.exists(output_dir): 
            os.makedirs(output_dir)
            
        file_path = os.path.join(output_dir, filename)
        pdf.output(file_path)
        
        return {"status": "success", "url": f"/assets/downloads/{filename}"}
    except Exception as e:
        print(f"CRITICAL PDF ERROR: {e}") # This shows in your terminal
        return {"status": "error", "message": str(e)}