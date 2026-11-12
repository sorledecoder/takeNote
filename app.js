'use strict'; 
 
// ── Element references ────────────────────────────────────────────── 
const startBtn    = document.getElementById('startBtn'); 
const stopBtn     = document.getElementById('stopBtn'); 
const clearBtn    = document.getElementById('clearBtn'); 
const copyBtn     = document.getElementById('copyBtn'); 
const downloadBtn = document.getElementById('downloadBtn'); 
const transcript  = document.getElementById('transcript'); 
const interimDiv  = document.getElementById('interim'); 
const statusDot   = document.getElementById('statusIndicator'); 
const statusText  = document.getElementById('statusText'); 
const wordCount   = document.getElementById('wordCount'); 
const charCount   = document.getElementById('charCount'); 
 
// ── Punctuation mapping ────────────────────────────────────────────── 
// Keys are spoken phrases (lowercase), values are replacement text. 
const PUNCT_MAP = { 
  'fullstop'      : '.', 
  'full stop'     : '.', 
  'period'        : '.', 
  'comma'         : ',', 
  'question mark' : '?', 
  'exclamation mark' : '!', 
  'colon'         : ':', 
  'semicolon'     : ';', 
  'new paragraph' : '\n\n', 
  'new line'      : '\n', 
  'open bracket'  : '(', 
  'close bracket' : ')', 
  'open quote'    : '"', 
  'close quote'   : '"', 
  'dash'          : ' — ', 
  'hyphen'        : '-', 
}; 
 
// Build a regex that matches any punctuation phrase (longest first to avoid partial matches) 
const PUNCT_REGEX = new RegExp( 
  '\\b(' + 
  Object.keys(PUNCT_MAP) 
    .sort((a, b) => b.length - a.length) 
    .map(k => k.replace(/ /g, '\\s+')) 
    .join('|') + 
  ')\\b', 
  'gi' 
); 
 
function applyPunctuation(text) { 
  return text.replace(PUNCT_REGEX, (match) => { 
    const key = match.toLowerCase().replace(/\s+/g, ' '); 
    return PUNCT_MAP[key] ?? match; 
  }); 
} 
 
// ── Speech Recognition setup ───────────────────────────────────────── 
const SpeechRecognition = 
  window.SpeechRecognition || window.webkitSpeechRecognition; 
 
if (!SpeechRecognition) { 
  statusText.textContent = '❌ Your browser does not support the Web Speech API. Please use Chrome or Edge.'; 
  startBtn.disabled = true; 
} 
 
let recognition; 
let isRecording = false; 
let finalText   = ''; 
 
function buildRecognition() { 
  recognition = new SpeechRecognition(); 
  recognition.lang           = 'en-US'; 
  recognition.interimResults = true; 
  recognition.maxAlternatives = 1; 
  recognition.continuous     = true; 
 
  recognition.onstart = () => { 
    isRecording = true; 
    setStatus('recording', '🔴 Recording… speak now'); 
    startBtn.disabled = true; 
    stopBtn.disabled  = false; 
  }; 
 
  recognition.onresult = (event) => { 
    let interimText = ''; 
    for (let i = event.resultIndex; i < event.results.length; i++) { 
      const result = event.results[i]; 
      if (result.isFinal) { 
        const processed = applyPunctuation(result[0].transcript); 
        finalText += processed + ' '; 
        transcript.value = finalText.trimEnd(); 
        updateStats(); 
      } else { 
        interimText += result[0].transcript; 
      } 
    } 
    interimDiv.textContent = interimText; 
  }; 
 
  recognition.onerror = (event) => { 
    console.error('Speech error:', event.error); 
    if (event.error === 'no-speech') return; // ignore silence 
    setStatus('stopped', `⚠️ Error: ${event.error}`); 
    stopRecording(); 
  }; 
 
  recognition.onend = () => { 
    // Auto-restart if user has not pressed Stop 
    if (isRecording) { 
      recognition.start(); 
    } else { 
      setStatus('stopped', '✅ Stopped — Ready'); 
      interimDiv.textContent = ''; 
      startBtn.disabled = false; 
      stopBtn.disabled  = true; 
    } 
  }; 
} 
 
function startRecording() { 
  finalText = transcript.value; 
  if (finalText && !finalText.endsWith(' ')) finalText += ' '; 
  buildRecognition(); 
  recognition.start(); 
} 
 
function stopRecording() { 
  isRecording = false; 
  if (recognition) recognition.stop(); 
} 
 
// ── Stats ───────────────────────────────────────────────────────────── 
function updateStats() { 
  const text  = transcript.value; 
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length; 
  wordCount.textContent = `Words: ${words}`; 
  charCount.textContent = `Characters: ${text.length}`; 
} 
 
// ── Status helper ───────────────────────────────────────────────────── 
function setStatus(state, message) { 
  statusDot.className = `status-dot ${state}`; 
  statusText.textContent = message; 
} 
 
// ── Button events ───────────────────────────────────────────────────── 
startBtn.addEventListener('click', startRecording); 
stopBtn.addEventListener('click',  stopRecording); 
 
clearBtn.addEventListener('click', () => { 
  transcript.value = ''; 
  finalText = ''; 
  interimDiv.textContent = ''; 
  updateStats(); 
}); 
 
copyBtn.addEventListener('click', async () => { 
  if (!transcript.value) return; 
  try { 
    await navigator.clipboard.writeText(transcript.value); 
    copyBtn.textContent = '✅ Copied!'; 
    setTimeout(() => { copyBtn.textContent = '📋 Copy Text'; }, 2000); 
  } catch { 
    transcript.select(); 
    document.execCommand('copy'); 
  } 
}); 
 
downloadBtn.addEventListener('click', () => { 
  if (!transcript.value) return; 
  const blob = new Blob([transcript.value], { type: 'text/plain' }); 
  const url  = URL.createObjectURL(blob); 
  const a    = document.createElement('a'); 
  a.href     = url; 
  a.download = `transcript_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.txt`; 
  a.click(); 
  URL.revokeObjectURL(url); 
}); 
 
transcript.addEventListener('input', updateStats); 
updateStats(); 