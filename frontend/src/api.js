// frontend/src/api.js
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

async function request(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, opts);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function getReminders() {
  return request("/reminders");
}

export async function setReminder(text, remind_time = null, lang = "hi") {
  return request("/set_reminder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, remind_time, lang }),
  });
}

export async function generateTTS(text, lang = "hi") {
  return request("/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang }),
  });
}

export async function triggerEmergency() {
  return request("/emergency", {
    method: "POST",
  });
}

export async function deleteReminder(id) {
  return request(`/reminders/${id}`, {
    method: "DELETE",
  });
}
