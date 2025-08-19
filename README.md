# ElderEase AI — AI Househelp for Elderly

ElderEase AI is an MVP designed to assist elderly users through **voice interaction in Hindi and Marathi**, providing gentle support with reminders, wellness responses, and simulated emergency alerts. Our focus is on **simplicity, clarity, and care** for elders.

---

## ✨ Features

* 🎤 **Voice Input (Hindi/Marathi)** — Elders can speak in their language.
* 📝 **Editable Transcript** — Speech is transcribed and can be edited before saving.
* ⏰ **Reminders** — Set reminders easily and view them in a friendly list.
* 🔊 **Polite Voice Responses** — Text-to-Speech replies in Hindi/Marathi.
* 🚨 **Emergency Simulation** — Trigger an alert with voice output.
* 🎨 **Pastel-Themed UI** — Soothing interface designed with elder-friendly readability.

> **Note**: This is an MVP, not the final full product. Some advanced features are yet to come.

---

## 🚀 Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/richa-k23/ElderEase-AI.git
cd ElderEase-AI
```

### 2️⃣ Run the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```


### 3️⃣ Run the frontend

```bash
cd frontend
npm install
npm start
```


---

## 📡 API Endpoints (quick look)

* `POST /set_reminder` → Add reminder
* `GET /reminders` → Get reminders
* `POST /tts` → Generate polite TTS response
* `POST /emergency` → Trigger emergency simulation

---

## 🖼️ Screenshots

<img width="1202" height="662" alt="Screenshot 2025-08-19 231341" src="https://github.com/user-attachments/assets/582dfca3-94e0-4fb9-9b98-ec051396bee8" />


---

## 💡 Closing Note

“With ElderEase AI, we’re not just building technology — we’re building trust, safety, and companionship for our elders.”
