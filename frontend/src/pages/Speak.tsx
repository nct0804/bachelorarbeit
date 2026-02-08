import { useEffect, useMemo, useRef, useState } from 'react';
import { Volume2, Mic, MicOff, Repeat, CheckCircle2 } from 'lucide-react';

const phrases = [
  { id: 'p1', text: 'Guten Morgen', translation: 'Good morning' },
  { id: 'p2', text: 'Wie geht es dir', translation: 'How are you' },
  { id: 'p3', text: 'Ich lerne Deutsch', translation: 'I am learning German' },
  { id: 'p4', text: 'Koennen Sie mir helfen', translation: 'Can you help me' },
  { id: 'p5', text: 'Die Rechnung bitte', translation: 'The bill, please' },
  { id: 'p6', text: 'Wo ist der Bahnhof', translation: 'Where is the train station' },
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string) {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function similarity(a: string, b: string) {
  if (!a || !b) return 0;
  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

export default function Speak() {
  const [selected, setSelected] = useState(phrases[0]);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const speechAvailable = typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    setTranscript('');
    setScore(null);
  }, [selected]);

  const startListening = () => {
    if (!speechAvailable) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'de-DE';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript || '';
        setTranscript(text);
        const scoreValue = Math.round(similarity(normalize(text), normalize(selected.text)) * 100);
        setScore(scoreValue);
      };
      recognition.onend = () => setListening(false);
      recognition.onerror = () => setListening(false);
      recognitionRef.current = recognition;
    }
    setListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  const speakPhrase = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(selected.text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const feedback = useMemo(() => {
    if (score === null) return 'Say the phrase to get feedback.';
    if (score >= 85) return 'Excellent pronunciation!';
    if (score >= 70) return 'Great! Just a little more clarity.';
    if (score >= 50) return 'Not bad. Try slowing down a bit.';
    return 'Keep practicing. Focus on each word.';
  }, [score]);

  return (
    <div className="flex-1 flex justify-center overflow-auto max-w-3xl 2xl:max-w-4xl 3xl:max-w-6xl mx-auto mb-5" data-test="page-speak">
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Speaking Coach</p>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Practice Real German Phrases</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Listen, repeat, and get instant feedback.</p>
          </div>
          <button
            onClick={speakPhrase}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600"
          >
            <Volume2 className="w-4 h-4" /> Play Phrase
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Now Practicing</p>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{selected.text}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selected.translation}</p>
              </div>
              <button
                onClick={() => setSelected(phrases[Math.floor(Math.random() * phrases.length)])}
                className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-300"
              >
                <Repeat className="w-4 h-4" /> New Phrase
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Your last attempt</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white min-h-[28px]">
                {transcript || '---'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{feedback}</p>
              {score !== null && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Accuracy: {score}%
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={listening ? stopListening : startListening}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
                  listening ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
                } ${!speechAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!speechAvailable}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {listening ? 'Stop Listening' : 'Start Listening'}
              </button>
              {!speechAvailable && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Speech recognition is not supported in this browser.</p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Phrase Library</p>
            <div className="space-y-2">
              {phrases.map((phrase) => (
                <button
                  key={phrase.id}
                  onClick={() => setSelected(phrase)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    phrase.id === selected.id
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-blue-300'
                  }`}
                >
                  <p className="text-sm font-semibold">{phrase.text}</p>
                  <p className={`text-xs ${phrase.id === selected.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {phrase.translation}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
