# 🌙 Lukas & Luna — 3D AI Avatar Assistant

A real-time interactive 3D AI assistant system powered by **Google Gemini (OpenRouter)**, built with **Three.js + Flask**, featuring dual character avatars:

- 👦 Lukas (Male AI Avatar)
- 👧 Luna (Female AI Avatar)

Both avatars are fully animated 3D GLB models with emotion, gaze, and chat-driven behavior.

---

## ✨ Features

- 🧠 **AI Chat System** — Powered by `google/gemini-2.0-flash-001` via OpenRouter
- 👦👧 **Dual Character System** — Choose between Lukas or Luna
- 🧍 **3D Animated Avatars** — GLB models with bone-driven animation system
- 👁️ **Eye Tracking & Blink System** — Realistic gaze following mouse movement
- 🤔 **Thinking Pose System** — Avatar reacts while processing responses
- 😊 **Mood Detection System** — AI emotions reflected in real-time UI panel
- 📄 **PDF Generator** — Create downloadable reports from AI responses
- 🔍 **Wikipedia Research Tool** — AI can fetch knowledge and generate PDF summaries
- 🌐 **3D Environment Scene** — Fully rendered room environment using GLB assets
- 🎮 **Character Select UI** — Smooth animated selection screen before entering chat

---

## 📁 Project Structure


## 📁 Project Structure

```
Assistant/
├── app.py                  # Flask backend — routes, chat API, session handling
├── requirements.txt        # Python dependencies
├── bones.txt               # Bone index reference for the character GLB
│
├── assets/
│   ├── main.js             # Entry point — scene init, animation loop, event listeners
│   ├── scene.js            # Three.js scene, camera, renderer, lighting, room loader
│   ├── avatar.js           # GLB loader, bone mapping, avatar initialization
│   ├── style.css           # Full UI stylesheet (glassmorphism, neon, dark theme)
│   ├── character.glb       # 3D avatar model (VRM-style)
│   │
│   ├── core/
│   │   ├── chat.js         # fetch() wrapper for /chat endpoint
│   │   └── emotion.js      # Mood UI updater (color, status, bar fill)
│   │
│   └── textures/
│       └── room.glb        # 3D room environment model
│
├── templates/
│   └── main.html           # Main HTML page served by Flask
│
└── tools/
    └── tools.py            # Wikipedia search + FPDF-based PDF generator
```

---

## 🌐 Live Demo
[![Watch Demo](https://img.youtube.com/vi/HI_wRxAzj5k/0.jpg)](https://youtu.be/HI_wRxAzj5k)
### 🔗 Try it live:
👉 https://threed-avatar-assistant.onrender.com/

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Anamol166/3d-avatar-assistant.git
cd 3d-avatar-assistant
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Add Your API Key

Create a `.env` file in the root directory:

```python
API_KEY = "YOUR_OPENROUTER_API_KEY_HERE"
```

### 4. Run the App

```bash
python app.py
```

Then open your browser and go to: **http://localhost:5000**

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Three.js, Vanilla JS (ES Modules) |
| 3D Rendering | WebGL via Three.js r132 |
| Backend | Python, Flask |
| AI Model | Google Gemini 2.0 Flash (OpenRouter) |
| PDF Generation | FPDF |
| Wikipedia | wikipedia-api |

---

## 💬 How to Use

| You say... | Luna does... |
|---|---|
| Anything | Responds as your AI assistant |
| `make a PDF about [topic]` | Generates a downloadable PDF report |
| `research [topic]` | Searches Wikipedia and creates a PDF |

PDFs are saved to `assets/downloads/` and accessible via the browser.

---

## 🎨 Customization

- **Change the AI persona** — Edit the `system_message` in `app.py`
- **Swap the 3D model** — Replace `assets/character.glb` (ensure bone names match `avatar.js`)
- **Change the room** — Replace `assets/textures/room.glb`
- **Adjust animations** — Modify bone targets in `main.js` under `BONE_DATA`

---

## 📦 requirements.txt

```
requests
flask
wikipedia-api
fpdf
unidecode
```

---

## 📝 Notes

- The model uses **VRM-style bone naming** (e.g., `J_Bip_R_UpperArm`). If you swap the character model, update bone name mappings in `avatar.js`.
- Session history is kept to the last **10 messages** to stay within token limits.
- The app runs in **debug mode** by default — disable for production.

---

## 🤝 Contributing

We love collaboration! Luna is a living 3D AI project, and your contributions can make her smarter, cooler, and more interactive. Here’s how you can help:

⭐ Try it out — Download the project, run it locally, and explore all features.

🐛 Report bugs — If something doesn’t work as expected (animations, chat, PDF generation), open an issue.

✨ Add features — Ideas like new AI responses, gestures, gaze behavior, or new mood effects are welcome.

🎨 Improve visuals — Swap or enhance the 3D avatar, environment, or UI styles.

📄 Enhance documentation — Clear instructions, better examples, or tutorials help everyone.

🔗 Integrate tools — Add support for other AI models, APIs, or chat commands.

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

> Built with by [Anamol166](https://github.com/Anamol166)
