# 🎙️ Voice to Text Web App 
 
An offline-capable, browser-based Voice-to-Text application that: 
- Records voice and transcribes it in real time 
- Detects spoken punctuation commands (fullstop, comma, new paragraph, etc.) 
- Lets you copy or download your transcript as a `.txt` file 
 
## 🚀 How to Run Locally 
 
1. Download the ZIP and extract it. 
2. Open `index.html` directly in **Google Chrome** or **Microsoft Edge**. 
3. Allow microphone permission when prompted. 
4. Click **▶ Start Recording** and speak. 
 
## 🗣️ Punctuation Voice Commands 
 
| Say this              | Inserts | 
|-----------------------|---------| 
| fullstop / full stop / period | . | 
| comma                 | ,       | 
| question mark         | ?       | 
| exclamation mark      | !       | 
| colon                 | :       | 
| semicolon             | ;       | 
| new paragraph         | (blank line) | 
| new line              | (line break) | 
| dash                  | —       | 
| hyphen                | -       | 
| open bracket          | (       | 
| close bracket         | )       | 
| open quote            | "       | 
| close quote           | "       | 
 
## 📂 File Structure 
 
``` 
voice-to-text/ 
├── index.html 
├── style.css 
├── app.js 
└── README.md 
``` 
 
## ⚙️ Requirements 
 
- Google Chrome (v33+) or Microsoft Edge (Chromium) 
- Microphone access 
- No internet connection required after download 
 
## 🌐 Deploy to GitHub Pages 
 
1. Create a new GitHub repo (e.g. `voice-to-text`). 
2. Upload all 4 files to the repo root. 
3. Go to **Settings → Pages → Source: main branch / root**. 
4. Your app will be live at `https://<your-username>.github.io/voice-to-text/` 
 
## 📝 License 
MIT — free to use and modify. 