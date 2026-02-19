export async function sendMessage(text) {
    try {
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        return await res.json();
    } catch (e) {
        console.error("Chat Error:", e);
        return { response: "Connection error." };
    }
}