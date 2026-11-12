// ============================================================
// app.js — Fixed Voice-to-Text Engine v2.0
// Fixes: word repeat, real-time display, hang, early cutoff
// ============================================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  alert('❌ Your browser does not support Speech Recognition.\nPlease use Google Chrome or Microsoft Edge.');
}

// ── State Variables ──────────────────────────────────────────
let recognition;
let isRecording       = false;
let finalTranscript   = '';   // Confirmed words only
let interimTranscript = '';   // Live preview (not yet confirmed)
let restartTimer      = null;
let silenceTimer      = null;
let errorCount        = 0;
const MAX_ERRORS      = 5;

// ── DOM Elements ─────────────────────────────────────────────
const startBtn       = document.getElementById('startBtn');
const stopBtn        = document.getElementById('stopBtn');
const clearBtn       = document.getElementById('clearBtn');
const copyBtn        = document.getElementById('copyBtn');
const downloadBtn    = document.getElementById('downloadBtn');
const outputDiv      = document.getElementById('output');
const interimDiv     = document.getElementById('interim');   // Add this div in HTML
const statusDot      = document.getElementById('statusDot');
const statusText     = document.getElementById('statusText');
const wordCount      = document.getElementById('wordCount');
const charCount      = document.getElementById('charCount');

// ── Punctuation Map ──────────────────────────────────────────
const PUNCTUATION_MAP = [
  { pattern: /\b(full stop|fullstop|period)\b/gi,       replace: '. '  },
  { pattern: /\bcomma\b/gi,                              replace: ', '  },
  { pattern: /\b(question mark)\b/gi,                   replace: '? '  },
  { pattern: /\b(exclamation mark|exclamation point)\b/gi, replace: '! ' },
  { pattern: /\bcolon\b/gi,                              replace: ': '  },
  { pattern: /\bsemicolon\b/gi,                         replace: '; '  },
  { pattern: /\b(new paragraph|new para)\b/gi,          replace: '\n\n' },
  { pattern: /\bnew line\b/gi,                          replace: '\n'   },
  { pattern: /\bdash\b/gi,                              replace: ' — '  },
  { pattern: /\bhyphen\b/gi,                            replace: '-'    },
  { pattern: /\bopen bracket\b/gi,                      replace: '('    },
  { pattern: /\bclose bracket\b/gi,                     replace: ')'    },
  { pattern: /\bopen quote\b/gi,                        replace: '\u201C' },
  { pattern: /\bclose quote\b/gi,                       replace: '\u201D' },
];

function applyPunctuation(text) {
  PUNCTUATION_MAP.forEach(({ pattern, replace }) => {
    text = text.replace(pattern, replace);
  });
  // Capitalise first letter after sentence-ending punctuation
  text = text.replace(/([.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
  return text;
}

// ── Build Recognition Instance ───────────────────────────────
function buildRecognition() {
  const rec            = new SpeechRecognition();
  rec.lang             = 'en-US';
  rec.continuous       = true;   // ✅ Fix: never stop on its own
  rec.interimResults   = true;   // ✅ Fix: real-time word display
  rec.maxAlternatives  = 1;

  // ── onresult: core fix for word repetition ────────────────
  rec.onresult = (event) => {
    interimTranscript = '';

    // Only iterate NEW results (from event.resultIndex onward)
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        // ✅ Fix: append to finalTranscript ONLY when confirmed
        finalTranscript += applyPunctuation(transcript) + ' ';
      } else {
        // ✅ Fix: show live preview separately — never added to final
        interimTranscript += transcript;
      }
    }

    renderOutput();
    resetSilenceTimer();
  };

  // ── onend: auto-restart so it never hangs ────────────────
  rec.onend = () => {
    if (isRecording) {
      // ✅ Fix: restart after 300ms to prevent hang
      restartTimer = setTimeout(() => {
        try {
          rec.start();
        } catch (e) {
          console.warn('Restart skipped:', e.message);
        }
      }, 300);
    }
  };

  // ── onerror: handle & recover from errors ────────────────
  rec.onerror = (event) => {
    console.error('Speech error:', event.error);
    errorCount++;

    if (event.error === 'no-speech') {
      // Normal — microphone heard silence; auto-restart handles it
      return;
    }

    if (event.error === 'audio-capture') {
      setStatus('⚠️ Microphone not found', 'error');
      stopRecording();
      return;
    }

    if (event.error === 'not-allowed') {
      setStatus('🚫 Microphone access denied', 'error');
      stopRecording();
      return;
    }

    if (errorCount >= MAX_ERRORS) {
      setStatus('❌ Too many errors — restarting…', 'error');
      errorCount = 0;
      restartRecognition();
      return;
    }
  };

  rec.onstart = () => {
    setStatus('🔴 Recording… Speak now', 'active');
    errorCount = 0;
  };

  return rec;
}

// ── Render Output ────────────────────────────────────────────
function renderOutput() {
  // Final confirmed text
  outputDiv.innerText = finalTranscript;

  // Live interim preview (shown in lighter colour via CSS)
  if (interimDiv) {
    interimDiv.innerText = interimTranscript;
  }

  // Update counters
  const combined = finalTranscript + interimTranscript;
  const words    = combined.trim() === '' ? 0 : combined.trim().split(/\s+/).length;
  if (wordCount) wordCount.innerText = words;
  if (charCount) charCount.innerText = combined.length;
}

// ── Silence Timer: auto-pause after 30s of silence ──────────
function resetSilenceTimer() {
  clearTimeout(silenceTimer);
  silenceTimer = setTimeout(() => {
    if (isRecording) {
      setStatus('⏸️ Paused — waiting for speech…', 'paused');
    }
  }, 30000);
}

// ── Start Recording ──────────────────────────────────────────
function startRecording() {
  if (isRecording) return;
  isRecording      = true;
  interimTranscript = '';
  errorCount       = 0;

  recognition = buildRecognition();

  try {
    recognition.start();
    startBtn.disabled = true;
    stopBtn.disabled  = false;
    setStatus('🔴 Recording… Speak now', 'active');
  } catch (e) {
    console.error('Start failed:', e);
    setStatus('❌ Could not start microphone', 'error');
    isRecording = false;
  }
}

// ── Stop Recording ───────────────────────────────────────────
function stopRecording() {
  isRecording = false;
  clearTimeout(restartTimer);
  clearTimeout(silenceTimer);

  try {
    recognition.stop();
  } catch (e) {
    console.warn('Stop error:', e.message);
  }

  interimTranscript = '';
  if (interimDiv) interimDiv.innerText = '';

  startBtn.disabled = false;
  stopBtn.disabled  = true;
  setStatus('⏹️ Stopped', 'idle');
}

// ── Force Restart ────────────────────────────────────────────
function restartRecognition() {
  try { recognition.stop(); } catch (e) {}
  setTimeout(() => {
    if (isRecording) {
      recognition = buildRecognition();
      try { recognition.start(); } catch (e) {}
    }
  }, 500);
}

// ── Status Display ───────────────────────────────────────────
function setStatus(message, state) {
  if (statusText) statusText.innerText = message;
  if (statusDot) {
    statusDot.className = 'status-dot';
    statusDot.classList.add(state); // CSS handles colour
  }
}

// ── Clear Text ───────────────────────────────────────────────
function clearText() {
  finalTranscript   = '';
  interimTranscript = '';
  if (outputDiv)  outputDiv.innerText  = '';
  if (interimDiv) interimDiv.innerText = '';
  if (wordCount)  wordCount.innerText  = '0';
  if (charCount)  charCount.innerText  = '0';
}

// ── Copy to Clipboard ────────────────────────────────────────
async function copyText() {
  if (!finalTranscript.trim()) return;
  try {
    await navigator.clipboard.writeText(finalTranscript);
    copyBtn.innerText = '✅ Copied!';
    setTimeout(() => { copyBtn.innerText = '📋 Copy'; }, 2000);
  } catch (e) {
    alert('Copy failed. Please select and copy manually.');
  }
}

// ── Download as .txt ─────────────────────────────────────────
function downloadText() {
  if (!finalTranscript.trim()) return;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const blob      = new Blob([finalTranscript], { type: 'text/plain' });
  const url       = URL.createObjectURL(blob);
  const a         = document.createElement('a');
  a.href          = url;
  a.download      = `voice-transcript-${timestamp}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Button Event Listeners ───────────────────────────────────
if (startBtn)    startBtn.addEventListener('click', startRecording);
if (stopBtn)     stopBtn.addEventListener('click', stopRecording);
if (clearBtn)    clearBtn.addEventListener('click', clearText);
if (copyBtn)     copyBtn.addEventListener('click', copyText);
if (downloadBtn) downloadBtn.addEventListener('click', downloadText);

// ── Add interim div to index.html if missing ─────────────────
// Place this BELOW your #output div in index.html:
// <div id="interim" style="color:#aaa;font-style:italic;min-height:24px;"></div>