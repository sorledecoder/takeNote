// app.js — Voice-to-Text engine (Web Speech API) 
// Goals: 
// - No repeated words (separate final vs interim; use event.resultIndex) 
// - Translate on the go (show interim live) 
// - Long running (continuous + robust auto-restart) 
// - If interruption/silence: show "paused" state, but keep session alive 
 
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; 
 
// DOM 
const startBtn = document.getElementById('startBtn'); 
const stopBtn = document.getElementById('stopBtn'); 
const clearBtn = document.getElementById('clearBtn'); 
const copyBtn = document.getElementById('copyBtn'); 
const downloadBtn = document.getElementById('downloadBtn'); 
const transcriptEl = document.getElementById('transcript'); 
const interimEl = document.getElementById('interim'); 
const statusDot = document.getElementById('statusIndicator'); 
const statusText = document.getElementById('statusText'); 
const wordCountEl = document.getElementById('wordCount'); 
const charCountEl = document.getElementById('charCount'); 
 
if (!SpeechRecognition) { 
  alert('Speech Recognition is not supported in this browser. Use Chrome or Edge.'); 
} 
 
let recognition = null; 
let isRecording = false; 
let finalText = ''; 
let interimText = ''; 
let restartTimer = null; 
let pausedTimer = null; 
let lastSpeechAt = 0; 
 
// If the engine ends unexpectedly while recording, we restart. 
// To avoid tight loops, use small delays. 
const RESTART_DELAY_MS = 300; 
const SILENCE_PAUSE_MS = 2500; // after this much silence, show "paused" 
 
// Spoken punctuation commands 
const PUNCT = [ 
  { re: /\b(full stop|fullstop|period)\b/gi, rep: '. ' }, 
  { re: /\bcomma\b/gi, rep: ', ' }, 
  { re: /\b(new paragraph|new para)\b/gi, rep: '\n\n' }, 
  { re: /\bnew line\b/gi, rep: '\n' }, 
]; 
 
function applyPunctuation(s) { 
  let out = s; 
  for (const p of PUNCT) out = out.replace(p.re, p.rep); 
  // tidy spacing 
  out = out.replace(/\s+\n/g, '\n').replace(/\n\s+/g, '\n'); 
  out = out.replace(/\s{2,}/g, ' '); 
  return out; 
} 
 
function setStatus(text, state) { 
  statusText.textContent = text; 
  statusDot.className = 'status-dot ' + (state || 'idle'); 
} 
 
function render() { 
  transcriptEl.value = finalText.trimStart(); 
  interimEl.textContent = interimText; 
 
  const combined = (finalText + ' ' + interimText).trim(); 
  const words = combined ? combined.split(/\s+/).length : 0; 
  wordCountEl.textContent = `Words: ${words}`; 
  charCountEl.textContent = `Characters: ${combined.length}`; 
} 
 
function schedulePausedIfSilent() { 
  clearTimeout(pausedTimer); 
  pausedTimer = setTimeout(() => { 
    if (!isRecording) return; 
    // If we haven't seen speech recently, show paused (but DO NOT stop) 
    const silentFor = Date.now() - lastSpeechAt; 
    if (silentFor >= SILENCE_PAUSE_MS) { 
      setStatus('Paused — waiting for speech…', 'paused'); 
    } 
  }, SILENCE_PAUSE_MS); 
} 
 
function buildRecognition() { 
  const r = new SpeechRecognition(); 
  r.lang = 'en-US'; 
  r.continuous = true; 
  r.interimResults = true; 
  r.maxAlternatives = 1; 
 
  r.onstart = () => { 
    setStatus('Recording… Speak now', 'active'); 
  }; 
 
  r.onresult = (event) => { 
    interimText = ''; 
 
    // Only iterate new results to avoid duplicates 
    for (let i = event.resultIndex; i < event.results.length; i++) { 
      const res = event.results[i]; 
      const t = res[0].transcript; 
 
      if (res.isFinal) { 
        const cleaned = applyPunctuation(t); 
        finalText += cleaned + ' '; 
      } else { 
        interimText += t; 
      } 
    } 
 
    lastSpeechAt = Date.now(); 
    setStatus('Recording…', 'active'); 
    schedulePausedIfSilent(); 
    render(); 
  }; 
 
  r.onerror = (e) => { 
    // Common benign errors: no-speech, aborted 
    // We do not stop; we keep session alive and rely on onend restart. 
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { 
      setStatus('Microphone permission denied', 'error'); 
      stopRecording(); 
      return; 
    } 
 
    if (e.error === 'audio-capture') { 
      setStatus('No microphone detected', 'error'); 
      stopRecording(); 
      return; 
    } 
 
    // For network/no-speech/aborted, show paused, then allow restart 
    setStatus('Paused — waiting for speech…', 'paused'); 
  }; 
 
  r.onend = () => { 
    // Chrome may end after pauses; keep alive if user still wants recording 
    if (!isRecording) return; 
 
    clearTimeout(restartTimer); 
    restartTimer = setTimeout(() => { 
      try { 
        r.start(); 
      } catch (err) { 
        // If start() throws because it’s already started, ignore. 
      } 
    }, RESTART_DELAY_MS); 
  }; 
 
  return r; 
} 
 
function startRecording() { 
  if (!SpeechRecognition) return; 
  if (isRecording) return; 
 
  isRecording = true; 
  lastSpeechAt = Date.now(); 
  schedulePausedIfSilent(); 
 
  recognition = buildRecognition(); 
  try { 
    recognition.start(); 
  } catch (e) { 
    isRecording = false; 
    setStatus('Could not start recognition', 'error'); 
    return; 
  } 
 
  startBtn.disabled = true; 
  stopBtn.disabled = false; 
} 
 
function stopRecording() { 
  isRecording = false; 
  clearTimeout(restartTimer); 
  clearTimeout(pausedTimer); 
 
  startBtn.disabled = false; 
  stopBtn.disabled = true; 
 
  interimText = ''; 
  render(); 
 
  try { 
    recognition && recognition.stop(); 
  } catch (_) {} 
 
  setStatus('Stopped', 'idle'); 
} 
 
function clearAll() { 
  finalText = ''; 
  interimText = ''; 
  render(); 
} 
 
async function copyText() { 
  const text = finalText.trim(); 
  if (!text) return; 
  try { 
    await navigator.clipboard.writeText(text); 
    setStatus('Copied to clipboard', 'active'); 
    setTimeout(() => setStatus(isRecording ? 'Recording…' : 'Idle — Press Start to begin', isRecording ? 'active' : 'idle'), 1200); 
  } catch (e) { 
    alert('Copy failed.'); 
  } 
} 
 
function downloadText() { 
  const text = finalText.trim(); 
  if (!text) return; 
  const stamp = new Date().toISOString().replace(/[:.]/g, '-'); 
  const blob = new Blob([text], { type: 'text/plain' }); 
  const url = URL.createObjectURL(blob); 
  const a = document.createElement('a'); 
  a.href = url; 
  a.download = `transcript-${stamp}.txt`; 
  a.click(); 
  URL.revokeObjectURL(url); 
} 
 
startBtn.addEventListener('click', startRecording); 
stopBtn.addEventListener('click', stopRecording); 
clearBtn.addEventListener('click', clearAll); 
copyBtn.addEventListener('click', copyText); 
downloadBtn.addEventListener('click', downloadText); 
 
// Initial render 
render(); 
 