let history = [];



//cerchiamo di prendere la api key
var apiKey = localStorage.getItem('apiKey');

// se apiKey non esiste, mostra un alert per chiedere all'utente di inserire una nuova apiKey
if (!apiKey) {
    apiKey = prompt("Inserisci la tua API key:");

    // salva l'apiKey nel localStorage
    if (apiKey) {
        localStorage.setItem('apiKey', apiKey);
    }
}

const API_KEY = apiKey;

const form = document.querySelector('form');
form.addEventListener('submit', (event) => {
    event.preventDefault();
});


const userInput = document.getElementById('userInput');

userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submitForm();
    }
    adjustTextArea()
});


//controlla se sei oltre i 4090 token, e inizia a ripulire lo storico  (eehh lo so bruttino)
function sizeCheck() {
    let hSize = 0;
    history.forEach(element => {
        hSize = hSize + element.content.length
    });

    if (hSize > 4090) {
        history.shift();
        history.shift();
    };
};

//funzione che quando premi il tasto con la scopa cancella tutto
function cancellaCronologia() {
    let cancellami = confirm("Sei sicuro di voler cancellare la cronologia?");
    if (cancellami) {
        localStorage.removeItem('history');

        window.location.reload();
    }
};

//funzione che salva lo storico nel localstorage
function saveHistory() {
    localStorage.setItem('history', JSON.stringify(history));
}



//funzione che invia un prompt per mandare risposte brevi
function risposteBrevi() {
    let input = confirm("Vuoi abilitare la modalità risposte brevi?");
    if (input) {
        let userInput = document.getElementById('userInput');
        userInput.value = "Da ora in poi, per ogni cosa che ti chiedo, rispondimi solo con risposte brevissime e concise."
        const invio = document.querySelector('button[type="submit"]');
        invio.click();
    }
}

// Funzione submit form
async function submitForm() {

    const userInput = document.getElementById('userInput').value.trim();

    //se non hai scritto nulla esce
    if (userInput === "" || userInput === "\n" || userInput === "\r\n" || userInput === " ") return 0;

    //se hai scritto troppi messaggi gliene fa scordare qualcuno sopra
    sizeCheck();

    // Disattiva la casella di input
    document.getElementById('userInput').disabled = true;

    //mette il mio messaggio nell'history
    history.push({
        "role": "user",
        "content": userInput
    });

    //toglie la roba che ci sta scritta dentro
    document.getElementById('userInput').value = '';



    appendToChatLog('tu', userInput);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: history,
            max_tokens: 250,
            n: 1,
            //stop: '\n'
        })
    }).catch(error => {
        appendToChatLog('error', "😭 qualche errore c'è stato, esattamente: " + error + ".");
        history.pop();
        document.getElementById('userInput').disabled = false;
        document.getElementById('userInput').focus();

        return false;
    });

    const data = await response.json();



    const chatbotResponse = data.choices[0].message.content;
    appendToChatLog('assistant', chatbotResponse);
    history.push({
        "role": "assistant",
        "content": chatbotResponse
    });
    saveHistory(); //salva tutto nel localstorage quando arriva un messaggio dal chatbot
    //riabilita il tutto
    document.getElementById('userInput').disabled = false;

    //se non siamo mobile
    if (window.innerWidth > 768) {
        document.getElementById('userInput').focus();
    };


    return false;
} //FINE


//funzione che mette i messaggi nella chat
function appendToChatLog(sender, message) {
    const textarea = document.getElementById('userInput');
    const chatlog = document.getElementById('chatlog');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-bubble');
    if (sender === 'assistant') {
        messageElement.classList.add('chatbot-bubble');
        textarea.placeholder = "Scrivi qualcosa...";
    } else {
        if (sender === 'error') {
            messageElement.classList.add('error-bubble');
            textarea.placeholder = "Scrivi qualcosa...";

        } else {
            messageElement.classList.add('user-bubble');
            textarea.placeholder = "🤔 Sto pensando...";
        }
    }
    const messageText = document.createElement('p');
    messageText.innerText = message;
    messageElement.appendChild(messageText);

    chatlog.appendChild(messageElement);
    chatlog.scrollTop = chatlog.scrollHeight;
}

//funzione che controlla se hai scritto troppo e ti allunga il text box
function adjustTextArea() {
    const textarea = document.getElementById('userInput');
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
}

//funzione che carica lo storico se esiste
function loadHistory() {
    if (localStorage.getItem('history') != null) {
        history = JSON.parse(localStorage.getItem('history'));
        history.forEach((e) => {
            appendToChatLog(e.role, e.content);
        });
    }
}

loadHistory();