import { useState } from 'react';

export function ChatInput({ placeholder, onSubmit }) {
  const [value, setValue] = useState('');
  const [isVoice, setVoice] = useState(false);

  const handleSubmit = event => {
    event.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue('');
  };

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setVoice(false);
      return;
    }
    setVoice(true);
    const recognition = new window.webkitSpeechRecognition();
    recognition.onresult = event => {
      const transcript = event.results[0][0].transcript;
      setValue(prev => `${prev} ${transcript}`.trim());
      setVoice(false);
    };
    recognition.onerror = () => setVoice(false);
    recognition.start();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-800 bg-slate-900">
      <textarea
        value={value}
        onChange={event => setValue(event.target.value)}
        placeholder={placeholder}
        className="h-24 w-full resize-none bg-transparent p-3 text-sm focus:outline-none"
      />
      <div className="flex items-center justify-between border-t border-slate-800 px-3 py-2">
        <button
          type="button"
          onClick={handleVoice}
          className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
        >
          {isVoice ? 'Listening...' : 'Voice' }
        </button>
        <button
          type="submit"
          className="rounded-md bg-blue-500 px-4 py-1 text-xs font-semibold text-white hover:bg-blue-400"
        >
          Send
        </button>
      </div>
    </form>
  );
}
