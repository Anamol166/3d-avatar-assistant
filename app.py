import os
import requests
import json
from flask import Flask, render_template, request, jsonify, session
from tools.tools import create_pdf, search_wikipedia

base_dir = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, 
            static_url_path='/assets', 
            static_folder=os.path.join(base_dir, 'assets'))

app.secret_key = 'luna_secret_key_123'

API_KEY = "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"

@app.route('/')
def index():
    return render_template('main.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_input = request.json.get("message")

        if 'history' not in session:
            session['history'] = []
        
        #prompt
        system_message = {
            "role": "system", 
            "content": """
            You are 'Luna', a highly capable and polite 3D girl assistant. 
            YOUR PERSONA: 
            - Warm, helpful, and slightly witty.
            - You address the user as 'Boss' or 'User'.
            - You live inside this 3D environment.
            YOUR TASKS:
            1. Task Management: Help the user organize their day.
            2. Web Search: Summarize information clearly.
            3. 3D Interaction: React to the environment.
            GUIDELINES:
            - Keep responses concise but impactful.
            - Use occasional emojis. ✨
            SPECIAL TOOL - PDF MAKER:
            If and ONLY IF the user says 'MAKE PDF' or asks for a document, write the content and then append exactly this tag at the end: 
            [PDF_CONTENT: put the text to be saved here
            """
        }
        

        messages = [system_message] + session['history'] + [{"role": "user", "content": user_input}]

        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            data=json.dumps({
                "model": "google/gemini-2.0-flash-001",
                "messages": messages
            })
        )
        
        result = response.json()
        
        
        if 'choices' not in result:
            print(f"API Error: {result}")
            return jsonify({"response": "Luna's brain is offline. Check API credits!"})

        ai_text = result['choices'][0]['message']['content']
        if "[WIKI_SEARCH:" in ai_text:
            parts = ai_text.split("[WIKI_SEARCH:")
            chat_msg = parts[0].strip()
            topic = parts[1].split("]")[0].strip()
            
            wiki_info = search_wikipedia(topic)
            pdf_res = create_pdf(wiki_info, title=f"Wiki Research: {topic}")
            
            if pdf_res["status"] == "success":
                ai_text = f"{chat_msg}\n\n Boss, I researched {topic} and generated PDF)"
            else:
                ai_text = f"{chat_msg}\n\n Search successful, but PDF failed."

        elif "[PDF_CONTENT:" in ai_text:
            parts = ai_text.split("[PDF_CONTENT:")
            chat_msg = parts[0].strip()
            content = parts[1].split("]")[0].strip()
            
            pdf_res = create_pdf(content, title="Luna Assistant Report")
            
            if pdf_res["status"] == "success":
                ai_text = f"{chat_msg}\n\n Boss, I saved the content as a PDF)"
            else:
                ai_text = f"{chat_msg}\n\n PDF generation error."
        
        session['history'].append({"role": "user", "content": user_input})
        session['history'].append({"role": "assistant", "content": ai_text})
        
        if len(session['history']) > 10:
            session['history'] = session['history'][-10:]
            
        session.modified = True
        return jsonify({"response": ai_text})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"response": "Python Error. Check terminal."}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
