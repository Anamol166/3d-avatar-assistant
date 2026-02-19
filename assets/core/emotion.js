export const EMOTIONS = {
    Joy: { color: "#4caf50", name: "HAPPY" },
    Fun: { color: "#ffeb3b", name: "LAUGH" },
    Angry: { color: "#f44336", name: "ANGRY" },
    Sorrow: { color: "#2196f3", name: "SAD" },
    Neutral: { color: "#00d4ff", name: "NEUTRAL" }
};

export function updateMoodUI(currentEmotion, thinking) {
    const fill = document.getElementById('mood-fill');
    const statusText = document.getElementById('status-text');
    const moodDisplay = document.getElementById('mood-display');
    const panel = document.getElementById('ai-mood-panel');

    if (!fill || !statusText || !moodDisplay) return;

    const config = EMOTIONS[currentEmotion] || EMOTIONS.Neutral;
    statusText.innerText = thinking ? "THINKING..." : "IDLE";
    statusText.style.color = thinking ? "#ffeb3b" : "#00d4ff";
    moodDisplay.innerText = config.name;
    moodDisplay.style.color = config.color;
    fill.style.backgroundColor = config.color;
    panel.style.borderLeftColor = config.color;
    fill.style.width = thinking ? "30%" : (currentEmotion === "Neutral" ? "60%" : "100%");
}