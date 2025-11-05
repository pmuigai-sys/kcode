import { useEffect, useMemo, useState } from "react";

type SpeechRecognitionLike = typeof window extends undefined
  ? never
  : InstanceType<typeof (window as any).SpeechRecognition>;

const VoiceControls = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionLike | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    try {
      return window.localStorage.getItem("kitana-tts") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsAvailable(true);
      const instance: SpeechRecognitionLike = new SpeechRecognition();
      instance.lang = navigator.language || "en-US";
      instance.interimResults = false;
      instance.continuous = false;
      instance.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          window.dispatchEvent(
            new CustomEvent("kitana.voice.transcript", { detail: transcript })
          );
        }
      };
      instance.onerror = () => setIsListening(false);
      instance.onend = () => setIsListening(false);
      setRecognition(instance);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("kitana-tts", ttsEnabled ? "1" : "0");
    } catch {
      // ignore
    }
  }, [ttsEnabled]);

  const voiceSupported = useMemo(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    []
  );

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        console.error("Voice start failed", error);
      }
    }
  };

  if (!isAvailable && !voiceSupported) {
    return (
      <div className="rounded-full border border-slate-800 px-3 py-2 text-xs text-slate-500">
        Voice offline
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/30 px-3 py-2 text-xs">
      <button
        type="button"
        onClick={toggleListening}
        disabled={!isAvailable}
        className={
          "rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs transition hover:border-kb-primary disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {isListening ? "Stop" : "Dictate"}
      </button>
      <label className="flex items-center gap-1 text-slate-400">
        <input
          type="checkbox"
          checked={ttsEnabled}
          onChange={(event) => setTtsEnabled(event.target.checked)}
          className="accent-kb-primary"
        />
        TTS
      </label>
    </div>
  );
};

export default VoiceControls;
