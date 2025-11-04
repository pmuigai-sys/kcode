(function () {
  const listeners = new Set();
  const speech = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let recognition;
  let voiceEnabled = false;
  let soundEnabled = true;

  function emit(event, detail) {
    listeners.forEach((cb) => cb(event, detail));
  }

  function onEvent(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  function speak(text, lang = window.KITANA?.language ?? 'en') {
    if (!voiceEnabled || !speech) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'es' ? 'es-ES' : 'en-US';
    speech.speak(utter);
  }

  function initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.lang = window.KITANA?.language === 'es' ? 'es-ES' : 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    return rec;
  }

  function startDictation(target) {
    recognition = recognition || initRecognition();
    if (!recognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      target.value = `${target.value} ${transcript}`.trim();
      target.dispatchEvent(new Event('input'));
    };
    recognition.start();
  }

  function bump(element) {
    if (!element) return;
    element.classList.add('kb-bump');
    setTimeout(() => element.classList.remove('kb-bump'), 400);
  }

  function flashStatus(message, timeout = 2500) {
    const bar = document.querySelector('.kb-toast') || document.createElement('div');
    bar.className = 'kb-toast';
    bar.textContent = message;
    document.body.appendChild(bar);
    setTimeout(() => bar.classList.add('is-visible'), 20);
    setTimeout(() => bar.classList.remove('is-visible'), timeout);
  }

  function renderMarkdown(text) {
    if (window.marked) {
      return window.marked.parse(text, { mangle: false, breaks: true });
    }
    return text.replace(/\n/g, '<br>');
  }

  function playTone(frequency = 880, duration = 0.12) {
    if (!soundEnabled || !window.AudioContext) return;
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    sessionStorage.setItem('kitana-theme', theme);
  }

  function loadTheme() {
    const stored = sessionStorage.getItem('kitana-theme');
    if (stored) {
      setTheme(stored);
    }
  }

  loadTheme();

  window.KitanaUI = {
    emit,
    onEvent,
    speak,
    startDictation,
    bump,
    flashStatus,
    renderMarkdown,
    playTone,
    setTheme,
    set voiceEnabled(value) {
      voiceEnabled = Boolean(value);
    },
    get voiceEnabled() {
      return voiceEnabled;
    },
    set soundEnabled(value) {
      soundEnabled = Boolean(value);
    },
    get soundEnabled() {
      return soundEnabled;
    }
  };
})();
