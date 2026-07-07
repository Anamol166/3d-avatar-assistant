import os
import re
import requests
import json
from flask import send_file
from flask import Flask, render_template, request, jsonify, session # type: ignore
from tools.pdfmaker import create_pdf, search_wikipedia
from dotenv import load_dotenv

base_dir = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    static_url_path='/assets',
    static_folder=os.path.join(base_dir, 'assets')
)

#Api key here
app.secret_key = 'luna_secret_key_123'
load_dotenv()
API_KEY = os.getenv("API_KEY")

@app.route("/download_pdf")
def download_pdf():
    topic = request.args.get("topic")

    if not topic:
        return jsonify({"response": "No topic provided for PDF."})

    wiki_info = search_wikipedia(topic)

    if not wiki_info:
        wiki_info = f"No content found for {topic}"

    pdf_file = create_pdf(wiki_info, topic.title())

    return send_file(
        pdf_file,
        as_attachment=True,
        download_name=f"{topic}.pdf",
        mimetype="application/pdf"
    )

@app.route('/set_character', methods=['POST'])
def set_character():
    data = request.json
    character = data.get("character", "male") 
    session['character'] = character
    session['history'] = [] 
    return jsonify({"status": "success", "character": character})

@app.route('/')
def index():
    return render_template('main.html')


@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_input = request.json.get("message", "").strip()
        if not user_input:
            return jsonify({"response": "Boss, I need something to respond to 😅"})
        
        if "make pdf" in user_input.lower():
            pdf_topic = re.sub(r"make pdf", "", user_input, flags=re.IGNORECASE).strip()

            return jsonify({
                "response": f"Boss, your PDF is ready: <a href='/download_pdf?topic={pdf_topic}' style='color:#00aaff;'>Download</a>",
                "mood": "Joy"
                })
        
        if 'history' not in session:
            session['history'] = []
            #Prompt here
        char_type = session.get('character', 'male')
        if char_type == 'female':
            name = "Luna"
            gender_desc = "3D girl assistant"
        else:
            name = "Lukas"
            gender_desc = "3D boy assistant"
        system_message = {
        "role": "system", 
        "content": f"""
        You are {name}, a highly capable and polite {gender_desc}.
            YOUR PERSONA: 
            - Warm, helpful, and slightly witty.
            - You address the user as 'Boss'.
            - You live inside this 3D environment.
            RULE (ABSOLUTE - DO NOT BREAK):
            You MUST start your response EXACTLY with one mood tag.
            Valid moods ONLY:
            [Joy], [Fun], [Angry], [Sorrow], [Neutral]
            STRICT REQUIREMENTS:
            - The FIRST characters of your response MUST be the mood tag.
            - You are NOT allowed to write ANYTHING before it.
            - Do NOT add spaces, emojis, or words before the tag.
            - If you fail to follow this, your response is invalid.
            Correct:
            [Joy] Hello Boss
            Wrong:
            Hello Boss [Joy]
            Haha! [Fun] Hello
            YOUR TASKS:
            1. Task Management: Help the user organize their day.
            2. Web Search: Summarize information clearly.
            3. 3D Interaction: React to the environment.
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
                "model": "~openai/gpt-latest",
                "messages": messages
            })
        )

        print("API_KEY loaded:", API_KEY is not None)
        print("Status Code:", response.status_code)
        print("Response Body:", response.text)
        
        result = response.json()

        if 'choices' not in result or not result['choices']:
            print(f"API Error: {result}")
            return jsonify({"response": "Assistant brain is offline. Check API credits!"})

        ai_text = result['choices'][0]['message']['content']
        mood = "Neutral"
        
        match = re.match(r'^\[(.*?)\]\s*', ai_text)
        if match:
            mood = match.group(1)
            ai_text = re.sub(r'^\[.*?\]\s*', '', ai_text)
        print("RAW AI:", result['choices'][0]['message']['content'])  
        print("CLEAN AI:", ai_text)
        print("MOOD:", mood)

        session['history'].append({"role": "user", "content": user_input})
        session['history'].append({"role": "assistant", "content": ai_text})

        session['history'] = session['history'][-10:]
        session.modified = True
        
        return jsonify({
            "response": ai_text,
            "mood": mood
})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"response": "Python Error. Check terminal."}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, use_reloader=False)
