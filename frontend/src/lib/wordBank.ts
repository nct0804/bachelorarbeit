export type WordEntry = {
  id: string;
  word: string;
  translation: string;
  category: string;
  example: string;
  tip?: string;
};

export const wordBank: WordEntry[] = [
  { id: 'w1', word: 'Guten Morgen', translation: 'Good morning', category: 'Greetings', example: 'Guten Morgen! Wie geht es dir?', tip: 'Use before noon.' },
  { id: 'w2', word: 'Guten Abend', translation: 'Good evening', category: 'Greetings', example: 'Guten Abend, Herr Schmidt.' },
  { id: 'w3', word: 'Danke', translation: 'Thank you', category: 'Basics', example: 'Danke für deine Hilfe.' },
  { id: 'w4', word: 'Bitte', translation: 'Please / Youre welcome', category: 'Basics', example: 'Ein Kaffee, bitte.' },
  { id: 'w5', word: 'Entschuldigung', translation: 'Excuse me / Sorry', category: 'Basics', example: 'Entschuldigung, wo ist der Bahnhof?' },
  { id: 'w6', word: 'Wie heißt du?', translation: 'What is your name?', category: 'Introductions', example: 'Wie heißt du? Ich heiße Lara.' },
  { id: 'w7', word: 'Ich heiße...', translation: 'My name is...', category: 'Introductions', example: 'Ich heiße Jonas.' },
  { id: 'w8', word: 'Woher kommst du?', translation: 'Where are you from?', category: 'Introductions', example: 'Woher kommst du? Aus Italien.' },
  { id: 'w9', word: 'Ich komme aus...', translation: 'I come from...', category: 'Introductions', example: 'Ich komme aus Vietnam.' },
  { id: 'w10', word: 'Tschüss', translation: 'Bye', category: 'Greetings', example: 'Tschüss! Bis morgen.' },
  { id: 'w11', word: 'Auf Wiedersehen', translation: 'Goodbye (formal)', category: 'Greetings', example: 'Auf Wiedersehen, Frau Müller.' },
  { id: 'w12', word: 'Ja', translation: 'Yes', category: 'Basics', example: 'Ja, das stimmt.' },
  { id: 'w13', word: 'Nein', translation: 'No', category: 'Basics', example: 'Nein, danke.' },
  { id: 'w14', word: 'Wie geht es dir?', translation: 'How are you?', category: 'Small Talk', example: 'Wie geht es dir? Mir geht es gut.' },
  { id: 'w15', word: 'Mir geht es gut', translation: 'I am doing well', category: 'Small Talk', example: 'Mir geht es gut, danke.' },
  { id: 'w16', word: 'Ich lerne Deutsch', translation: 'I am learning German', category: 'Learning', example: 'Ich lerne Deutsch seit einem Jahr.' },
  { id: 'w17', word: 'Sprechen Sie Englisch?', translation: 'Do you speak English? (formal)', category: 'Travel', example: 'Sprechen Sie Englisch? Ich brauche Hilfe.' },
  { id: 'w18', word: 'Wie viel kostet das?', translation: 'How much does that cost?', category: 'Shopping', example: 'Wie viel kostet das? Es kostet zehn Euro.' },
  { id: 'w19', word: 'Ich hätte gern...', translation: 'I would like...', category: 'Food', example: 'Ich hätte gern ein Wasser.' },
  { id: 'w20', word: 'Die Rechnung, bitte', translation: 'The bill, please', category: 'Food', example: 'Die Rechnung, bitte.' },
  { id: 'w21', word: 'Wo ist die Toilette?', translation: 'Where is the bathroom?', category: 'Travel', example: 'Wo ist die Toilette, bitte?' },
  { id: 'w22', word: 'Hilfe!', translation: 'Help!', category: 'Emergency', example: 'Hilfe! Ich brauche einen Arzt.' },
  { id: 'w23', word: 'Ich verstehe nicht', translation: 'I do not understand', category: 'Learning', example: 'Langsamer bitte, ich verstehe nicht.' },
  { id: 'w24', word: 'Langsamer, bitte', translation: 'Slower, please', category: 'Learning', example: 'Langsamer, bitte.' },
  { id: 'w25', word: 'Welche Zeit ist es?', translation: 'What time is it?', category: 'Time', example: 'Welche Zeit ist es? Es ist drei Uhr.' },
  { id: 'w26', word: 'Heute', translation: 'Today', category: 'Time', example: 'Heute ist Montag.' },
  { id: 'w27', word: 'Morgen', translation: 'Tomorrow / Morning', category: 'Time', example: 'Morgen habe ich Unterricht.' },
  { id: 'w28', word: 'Gestern', translation: 'Yesterday', category: 'Time', example: 'Gestern war ich müde.' },
  { id: 'w29', word: 'Ich habe Hunger', translation: 'I am hungry', category: 'Food', example: 'Ich habe Hunger, lass uns essen.' },
  { id: 'w30', word: 'Ich habe Durst', translation: 'I am thirsty', category: 'Food', example: 'Ich habe Durst, ein Wasser bitte.' },
  { id: 'w31', word: 'Ich bin müde', translation: 'I am tired', category: 'Small Talk', example: 'Ich bin müde, ich gehe schlafen.' },
  { id: 'w32', word: 'Herzlich willkommen', translation: 'Warm welcome', category: 'Greetings', example: 'Herzlich willkommen in Deutschland.' },
  { id: 'w33', word: 'Das ist toll', translation: 'That is great', category: 'Small Talk', example: 'Das ist toll! Glückwunsch.' },
  { id: 'w34', word: 'Ich mag Kaffee', translation: 'I like coffee', category: 'Preferences', example: 'Ich mag Kaffee, aber keinen Zucker.' },
  { id: 'w35', word: 'Ich liebe Musik', translation: 'I love music', category: 'Preferences', example: 'Ich liebe Musik aus Berlin.' },
  { id: 'w36', word: 'Können Sie mir helfen?', translation: 'Can you help me? (formal)', category: 'Travel', example: 'Können Sie mir helfen? Ich bin neu hier.' },
  { id: 'w37', word: 'Das ist links', translation: 'That is on the left', category: 'Directions', example: 'Das ist links, neben dem Park.' },
  { id: 'w38', word: 'Das ist rechts', translation: 'That is on the right', category: 'Directions', example: 'Das ist rechts, neben dem Markt.' },
  { id: 'w39', word: 'Geradeaus', translation: 'Straight ahead', category: 'Directions', example: 'Gehen Sie geradeaus.' },
  { id: 'w40', word: 'Ich suche ...', translation: 'I am looking for ...', category: 'Travel', example: 'Ich suche den Bahnhof.' },
];

export function getWordOfDay(date = new Date()) {
  const key = date.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % wordBank.length;
  }
  return wordBank[hash];
}

export function getRandomWords(count: number, excludeId?: string) {
  const pool = wordBank.filter((w) => w.id !== excludeId);
  const result: WordEntry[] = [];
  const used = new Set<string>();
  while (result.length < count && used.size < pool.length) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (used.has(pick.id)) continue;
    used.add(pick.id);
    result.push(pick);
  }
  return result;
}

export type QuizQuestion = {
  id: string;
  word: string;
  answer: string;
  options: string[];
};

export function buildQuiz(count = 5) {
  const picks = getRandomWords(count);
  return picks.map((entry) => {
    const distractors = getRandomWords(3, entry.id).map((d) => d.translation);
    const options = [...distractors, entry.translation].sort(() => Math.random() - 0.5);
    return {
      id: entry.id,
      word: entry.word,
      answer: entry.translation,
      options,
    } satisfies QuizQuestion;
  });
}

export function getFavoriteEntries(ids: string[]) {
  const map = new Map(wordBank.map((w) => [w.id, w]));
  return ids.map((id) => map.get(id)).filter(Boolean) as WordEntry[];
}
