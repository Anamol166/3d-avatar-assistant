import os
import requests
import json
from flask import Flask, render_template, request, jsonify, session
from tools.tools import create_pdf, search_wikipedia

base_dir = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    static_url_path='/assets',
    static_folder=os.path.join(base_dir, 'assets')
)

app.secret_key = 'luna_secret_key_123'

API_KEY = "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"

@app.route('/')
def index():
    return render_template('main.html')


@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_input = request.json.get("message", "").strip()
        if not user_input:
            return jsonify({"response": "Boss, I need something to respond to 😅"})

        # Initialize session history
        if 'history' not in session:
            session['history'] = []

        # System prompt
        system_message = {
             "role": "system", 
            "content": """
            You are 'Luna', a highly capable and polite 3D girl assistant. 
            YOUR PERSONA: 
            - Warm, helpful, and slightly witty.
            - You address the user as 'Anamol Boss'.
            - You live inside this 3D environment.
            YOUR TASKS:
            1. Task Management: Help the user organize their day.
            2. Web Search: Summarize information clearly.
            3. 3D Interaction: React to the environment.
            4. PDF Generation: Create PDFs when asked.
            5. Roleplay: Romantic Girlfriend mode when user says 'Luna be romantic'.
            GUIDELINES:
            - Keep responses concise but impactful.
            - Use occasional emojis. ✨
            SPECIAL TOOL - PDF MAKER:
            If and ONLY IF the user says 'MAKE PDF' or asks for a document, write the content and then append exactly this tag at the end: 
            [PDF_CONTENT: put the text to be saved here
            """
        }

        # Prepare messages
        messages = [system_message] + session['history'] + [{"role": "user", "content": user_input}]

        # Call OpenRouter API
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

        # Check API response
        if 'choices' not in result or not result['choices']:
            print(f"API Error: {result}")
            return jsonify({"response": "Luna's brain is offline. Check API credits!"})

        ai_text = result['choices'][0]['message']['content']

        # Wiki search handling
        if "[WIKI_SEARCH:" in ai_text:
            chat_msg, rest = ai_text.split("[WIKI_SEARCH:", 1)
            topic = rest.split("]", 1)[0].strip()
            wiki_info = search_wikipedia(topic)
            pdf_res = create_pdf(wiki_info, title=f"Wiki Research: {topic}")

            if pdf_res.get("status") == "success":
                ai_text = f"{chat_msg.strip()}\n\nBoss, I researched {topic} and generated a PDF ✅"
            else:
                ai_text = f"{chat_msg.strip()}\n\nSearch successful, but PDF failed."

        # PDF content handling
        elif "[PDF_CONTENT:" in ai_text:
            chat_msg, rest = ai_text.split("[PDF_CONTENT:", 1)
            content = rest.split("]", 1)[0].strip()
            pdf_res = create_pdf(content, title="Luna Assistant Report")

            if pdf_res.get("status") == "success":
                ai_text = f"{chat_msg.strip()}\n\nBoss, I saved the content as a PDF ✅"
            else:
                ai_text = f"{chat_msg.strip()}\n\nPDF generation error."

        # Save to session history
        session['history'].append({"role": "user", "content": user_input})
        session['history'].append({"role": "assistant", "content": ai_text})

        # Keep only last 10 messages
        session['history'] = session['history'][-10:]
        session.modified = True

        return jsonify({"response": ai_text})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"response": "Python Error. Check terminal."}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
