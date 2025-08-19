import "./App.css";

import React, { useEffect, useRef, useState } from "react";
import { getReminders, setReminder, generateTTS, triggerEmergency, deleteReminder } from "./api";

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState("hi"); 
  const [list, setList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchReminders();
  }, []);

  async function fetchReminders() {
    setListLoading(true);
    try {
      const res = await getReminders();
      setList(res.reminders || []);
    } catch (e) {
      console.error("Failed to load reminders", e);
      alert("Could not load reminders. Check backend.");
    } finally {
      setListLoading(false);
    }
  }

  function startListening() {
    if (!SpeechRecognition) {
      alert("SpeechRecognition not supported in this browser.");
      return;
    }
    const reco = new SpeechRecognition();
    reco.lang = lang === "mr" ? "mr-IN" : "hi-IN";
    reco.interimResults = false;
    reco.maxAlternatives = 1;
    reco.onresult = (ev) => {
      const text = ev.results[0][0].transcript;
      setTranscript(text);
    };
    reco.onerror = (ev) => {
      console.error("Speech error", ev);
      alert("Speech recognition error: " + ev.error);
    };
    reco.start();
  }

  async function handleSetReminder() {
    if (!transcript || transcript.trim() === "") {
      alert("Please speak or type the reminder text");
      return;
    }
    setLoadingAction(true);
    try {
      const res = await setReminder(transcript, null, lang);
      if (res && res.tts_url) {
        await fetchAndPlay(res.tts_url);
      }
      await fetchReminders();
      setTranscript("");
    } catch (e) {
      console.error("Set reminder failed:", e);
      alert(e.message || "Failed to set reminder. Check backend.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handlePlayTTS() {
    if (!transcript || transcript.trim() === "") {
      alert("Speak something first to get a friendly reply.");
      return;
    }
    setLoadingAction(true);
    try {
      const replyText = lang === "mr"
        ? `Namaste. Tumhi mhanale: ${transcript}. Mi tumhala madat karu shakto.`
        : `Namaste. Aapne kaha: ${transcript}. Main aapki madad karne ke liye taiyar hoon.`;
      const ttsRes = await generateTTS(replyText, lang);
      await fetchAndPlay(ttsRes.tts_url);
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to play TTS.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleEmergency() {
    if (!window.confirm("Simulate emergency alert?")) return;
    setLoadingAction(true);
    try {
      const res = await triggerEmergency();
      await fetchAndPlay(res.tts_url);
      alert(res.message || "Emergency simulated.");
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to trigger emergency.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this reminder?")) return;
    try {
      await deleteReminder(id);
      await fetchReminders();
    } catch (e) {
      console.error("Delete failed:", e);
      alert(e.message || "Failed to delete reminder.");
    }
  }

  async function fetchAndPlay(tts_url) {
    if (!tts_url) return;
    const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";
    const full = tts_url.startsWith("http") ? tts_url : `${API_BASE}${tts_url}`;
    if (audioRef.current) {
      audioRef.current.src = full;
      await audioRef.current.play().catch((err) => {
        console.warn("Play blocked / failed:", err);
      });
    } else {
      window.open(full, "_blank");
    }
  }

  return (
    <div className="app-root pastel">
      <header>
        <h1>ElderEase — AI</h1>
        <div className="lang-row">
          <label>Language: </label>
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="hi">Hindi (hi)</option>
            <option value="mr">Marathi (mr)</option>
          </select>
        </div>
      </header>

      <div className="controls">
        <button onClick={startListening} className="btn">🎤 Speak</button>
        <button onClick={handleSetReminder} className="btn" disabled={loadingAction}>➕ Set Reminder</button>
        <button onClick={handlePlayTTS} className="btn" disabled={loadingAction}>🔊 Play TTS</button>
        <button onClick={handleEmergency} className="btn danger" disabled={loadingAction}>🚨 Emergency</button>
      </div>

      <div className="transcript-box">
        <label>Transcript (editable):</label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Speak or type reminder text here..."
          rows={3}
        />
      </div>

      <div className="reminders-section">
        <h3>Reminders</h3>
        {listLoading ? (
          <div>Loading...</div>
        ) : list.length === 0 ? (
          <div className="muted">No reminders yet 🙂</div>
        ) : (
          <ul className="reminder-list">
            {list.map(r => (
              <li key={r.id}>
                <div className="rem-text">{r.text}</div>
                <div className="rem-meta">
                  {r.remind_time ? `at ${r.remind_time}` : ""} 
                  <span className="small">— {new Date(r.created_at).toLocaleString()}</span>
                </div>
                <button className="delete-btn" onClick={() => handleDelete(r.id)}>❌ Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <audio ref={audioRef} />
    </div>
  );
}
