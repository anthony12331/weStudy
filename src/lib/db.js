import Dexie from 'dexie';

export const localDb = new Dexie('weStudyLocalDB');

// Defines schema stored ONLY on the student's browser/device
localDb.version(1).stores({
  decks: '++id, title, summary, createdAt',
  flashcards: '++id, deckId, question, answer'
});