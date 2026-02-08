import { useState } from 'react';

interface Quote {
    q: string;
    a: string;
    translation: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    category: 'motivation' | 'family' | 'wisdom';
}

const germanQuotes: Quote[] = [
    { q: 'Übung macht den Meister.', a: 'Deutsches Sprichwort', translation: 'Practice makes perfect.', difficulty: 'beginner', category: 'motivation' },
    { q: 'Der Apfel fällt nicht weit vom Stamm.', a: 'Deutsches Sprichwort', translation: 'The apple doesn\'t fall far from the tree.', difficulty: 'intermediate', category: 'family' },
    { q: 'Alle guten Dinge sind drei.', a: 'Deutsches Sprichwort', translation: 'All good things come in threes.', difficulty: 'beginner', category: 'wisdom' },
    { q: 'Morgenstund hat Gold im Mund.', a: 'Deutsches Sprichwort', translation: 'The early bird catches the worm.', difficulty: 'intermediate', category: 'motivation' },
    { q: 'Was du heute kannst besorgen, das verschiebe nicht auf morgen.', a: 'Deutsches Sprichwort', translation: 'Don\'t put off until tomorrow what you can do today.', difficulty: 'advanced', category: 'motivation' },
    { q: 'Aller Anfang ist schwer.', a: 'Deutsches Sprichwort', translation: 'Every beginning is difficult.', difficulty: 'beginner', category: 'motivation' },
    { q: 'Ende gut, alles gut.', a: 'Deutsches Sprichwort', translation: 'All\'s well that ends well.', difficulty: 'beginner', category: 'wisdom' },
    { q: 'Ohne Fleiß kein Preis.', a: 'Deutsches Sprichwort', translation: 'No pain, no gain.', difficulty: 'intermediate', category: 'motivation' },
    { q: 'Wer A sagt, muss auch B sagen.', a: 'Deutsches Sprichwort', translation: 'In for a penny, in for a pound.', difficulty: 'advanced', category: 'wisdom' }
];

export default function MinimalQuotePanel() {
    const [show, setShow] = useState(false);
    const [showTranslation, setShowTranslation] = useState(false);
    const [quote, setQuote] = useState<Quote>(germanQuotes[0]);

    const getRandomQuote = () => {
        let newQuote;
        do {
            newQuote = germanQuotes[Math.floor(Math.random() * germanQuotes.length)];
        } while (newQuote === quote && germanQuotes.length > 1);
        setQuote(newQuote);
        setShowTranslation(false);
    };

    return (
        <div className="w-full mt-6">
            <button
                onClick={() => setShow(s => !s)}
                className="w-full py-2 px-4 rounded-lg bg-orange-500 text-white font-bold shadow hover:bg-orange-600 transition mb-2"
            >
                {show ? 'Hide Daily Quote' : 'Show Daily Quote'}
            </button>
            {show && (
                <div className="bg-white border rounded-xl p-4 mt-1 shadow text-center">
                    <div className="text-lg font-semibold mb-2">"{quote.q}"</div>
                    <div className="text-orange-700 text-sm mb-2">— {quote.a}</div>
                    <button
                        onClick={() => setShowTranslation(t => !t)}
                        className="text-blue-600 font-medium underline text-sm mb-2"
                    >
                        {showTranslation ? "Hide translation" : "Show translation"}
                    </button>
                    {showTranslation && (
                        <div className="mt-2 italic text-gray-700">{quote.translation}</div>
                    )}
                    <button
                        onClick={getRandomQuote}
                        className="mt-4 w-full bg-orange-400 hover:bg-orange-500 transition rounded-lg py-1.5 text-white font-bold text-sm"
                    >
                        New Quote
                    </button>
                </div>
            )}
        </div>
    );
}
