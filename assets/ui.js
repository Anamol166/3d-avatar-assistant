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
} ;

closebutton.onclick = () =>{
    if (chatbox.style.display === "flex" ){
        chatbox.style.display = "none";
    }
    if (chatbox.style.display === "none"){
        popbutton.style.display = "flex";
    }
}