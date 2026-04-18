const popbutton = document.getElementById("chat-button");
const chatbox = document.getElementById("chat-container");
const closebutton = document.getElementById("close");
popbutton.onclick = () =>{
    if (chatbox.style.display === "none"){ 
        chatbox.style.display = "flex";
        popbutton.style.display = "none";
    }
    else {
        chatbox.style.display = "none";
        popbutton.style.display = "flex";
    }
};

popbutton.addEventListener("click", () => {
    if (!window.avatarLoaded && window.selectedCharacter) {
        console.log("Loading avatar for:", window.selectedCharacter);
        window.avatarLoaded = true;
    }
});

closebutton.onclick = () =>{
    if (chatbox.style.display === "flex" ){
        chatbox.style.display = "none";
    }
    if (chatbox.style.display === "none"){
        popbutton.style.display = "flex";
    }
};

window.addEventListener("DOMContentLoaded", () => {
    const splash = document.getElementById("splash");
    const characterSelect = document.getElementById("character-select");
    const confirmBtn = document.getElementById("confirmBtn");
    setTimeout(() => {
        if (splash) {
            splash.style.display = "none"; 
        }
        characterSelect.classList.remove("hidden");
        characterSelect.style.display = "flex";
    }, 3500);

      confirmBtn.onclick = () => {
    if (!window.selectedCharacter) {
        alert("Please select a character first!");
        return;
    }
     
    fetch('/set_character', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ character: window.selectedCharacter })
    });

    characterSelect.style.opacity = "0";
    characterSelect.style.transition = "opacity 0.4s ease";

    setTimeout(() => {
        characterSelect.style.display = "none";
        document.getElementById("chat-button").style.display = "flex";
        import('./main.js').then(module => {
            module.loadSelectedAvatar();
        });

    }, 400);
};
});

function setChar(element, gender) {
    document.querySelectorAll('.char-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
    window.selectedCharacter = gender;
    console.log("Selected Model:", gender);
}

document.querySelectorAll('.char-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;
        card.style.transform = `
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            scale(1.08)
        `;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
    });
});
