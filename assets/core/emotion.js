export const EMOTIONS = {
    Joy: { color: "#4caf50", name: "HAPPY" },
    Fun: { color: "#ffeb3b", name: "LAUGH" },
    Angry: { color: "#f44336", name: "ANGRY" },
    Sorrow: { color: "#2196f3", name: "SAD" },
    Neutral: { color: "#00d4ff", name: "NEUTRAL" }
};

function normalizeMood(mood) {
    if (!mood) return "Neutral";

    mood = mood.toString().trim();

    return mood.charAt(0).toUpperCase() + mood.slice(1).toLowerCase();
}

export function updateMoodUI(currentEmotion = "Neutral", thinking = false) {
    const fill = document.getElementById('mood-fill');
    const statusText = document.getElementById('status-text');
    const moodDisplay = document.getElementById('mood-display');
    const panel = document.getElementById('ai-mood-panel');

    if (!fill || !statusText || !moodDisplay || !panel) return;

    
    const safeEmotion = normalizeMood(currentEmotion);
    const config = EMOTIONS[safeEmotion] || EMOTIONS.Neutral;

    statusText.innerText = thinking ? "THINKING..." : "IDLE";
    statusText.style.color = thinking ? "#ffeb3b" : config.color;

    moodDisplay.innerText = config.name;
    moodDisplay.style.color = config.color;
    fill.style.backgroundColor = config.color;
    panel.style.borderLeftColor = config.color;
    if (thinking) {
        fill.style.width = "30%";
        fill.style.opacity = "0.6";
    } else {
        fill.style.width = (safeEmotion === "Neutral") ? "60%" : "100%";
        fill.style.opacity = "1";
    }
}

export function setThinking() {
    updateMoodUI("Neutral", true);
}
export function setMood(mood) {
    updateMoodUI(mood, false);
}