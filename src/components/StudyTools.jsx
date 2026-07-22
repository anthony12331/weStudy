import { useState } from 'react';
import FillInTheBlank from './FillInTheBlank';

export default function StudyTools({ documentContext }) {
  const [mode, setMode] = useState('quiz'); // 'quiz', 'flashcards', or 'identification'
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState([]);
  const [flashcards, setFlashcards] = useState([]);

  // Quiz state
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // 1. Generate Quiz via Puter AI
  const generateQuiz = async () => {
    if (!documentContext) {
      alert('Please upload a document first!');
      return;
    }

    setLoading(true);
    setQuizSubmitted(false);
    setUserAnswers({});

    const prompt = `
Based on the following study text, generate 5 multiple-choice questions.
Return ONLY a valid raw JSON array with NO markdown, NO backticks, and NO extra text.

JSON format expected:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation why Option A is correct."
  }
]

Study Text:
${documentContext.slice(0, 8000)}
`;

    try {
      const response = await window.puter.ai.chat(prompt);
      const cleanedText = response.message.content.replace(/```json|```/g, '').trim();
      const parsedData = JSON.parse(cleanedText);
      setQuizData(parsedData);
    } catch (err) {
      alert('Failed to parse quiz. Try generating again!');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Generate Flashcards via Puter AI
  const generateFlashcards = async () => {
    if (!documentContext) {
      alert('Please upload a document first!');
      return;
    }

    setLoading(true);
    setCardIndex(0);
    setIsFlipped(false);

    const prompt = `
Based on the following study text, create 8 key flashcards for studying.
Return ONLY a valid raw JSON array with NO markdown, NO backticks, and NO extra text.

JSON format expected:
[
  {
    "id": 1,
    "term": "Key Concept or Term",
    "definition": "Clear, concise definition or explanation of the term."
  }
]

Study Text:
${documentContext.slice(0, 8000)}
`;

    try {
      const response = await window.puter.ai.chat(prompt);
      const cleanedText = response.message.content.replace(/```json|```/g, '').trim();
      const parsedData = JSON.parse(cleanedText);
      setFlashcards(parsedData);
    } catch (err) {
      alert('Failed to parse flashcards. Try generating again!');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper calculation for score
  const calculateScore = () => {
    let score = 0;
    quizData.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) score += 1;
    });
    return score;
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', padding: '1rem' }}>
      
      {/* Tab Switcher Header */}
      <div className="tab-switcher">
        <button
          className={`tab-btn ${mode === 'quiz' ? 'active' : ''}`}
          onClick={() => setMode('quiz')}
        >
          📝 Practice Quiz
        </button>
        <button
          className={`tab-btn ${mode === 'flashcards' ? 'active' : ''}`}
          onClick={() => setMode('flashcards')}
        >
          🎴 Flashcards
        </button>
        <button
          className={`tab-btn ${mode === 'identification' ? 'active' : ''}`}
          onClick={() => setMode('identification')}
        >
          🧩 Identification
        </button>
      </div>

      {/* Mode 1: PRACTICE QUIZ */}
      {mode === 'quiz' && (
        <div className="card-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>Multiple Choice Quiz</h2>
            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '8px 16px' }}
              onClick={generateQuiz}
              disabled={loading || !documentContext}
            >
              {loading ? '⏳ Generating...' : '⚡ Generate Quiz'}
            </button>
          </div>

          {!documentContext && (
            <p className="hero-subtitle"> Please upload a document in weStudy first to generate a quiz.</p>
          )}

          {quizData.length > 0 && (
            <div>
              {quizData.map((q, idx) => (
                <div key={q.id} className="study-card">
                  <p className="card-question">
                    {idx + 1}. {q.question}
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userAnswers[q.id] === optIdx;
                      const isCorrect = q.correctIndex === optIdx;

                      return (
                        <button
                          key={optIdx}
                          disabled={quizSubmitted}
                          onClick={() => setUserAnswers({ ...userAnswers, [q.id]: optIdx })}
                          className="btn-outline"
                          style={{
                            textAlign: 'left',
                            padding: '12px 14px',
                            borderColor: isSelected ? 'var(--primary)' : 'var(--border-default)',
                            backgroundColor: quizSubmitted
                              ? isCorrect
                                ? 'rgba(16, 185, 129, 0.15)'
                                : isSelected
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'var(--bg-surface)'
                              : isSelected
                              ? 'var(--primary-glow)'
                              : 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            cursor: quizSubmitted ? 'default' : 'pointer'
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <p className="card-answer" style={{ marginTop: '12px', fontSize: '13px', fontStyle: 'italic' }}>
                      💡 <strong>Explanation:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              ))}

              {!quizSubmitted ? (
                <button
                  className="btn-primary"
                  onClick={() => setQuizSubmitted(true)}
                  disabled={Object.keys(userAnswers).length < quizData.length}
                  style={{ marginTop: '1rem' }}
                >
                  Submit Quiz Answers
                </button>
              ) : (
                <div className="card-container" style={{ textAlign: 'center', backgroundColor: 'var(--primary-glow)' }}>
                  <h3 style={{ margin: 0, color: 'var(--primary)' }}>
                    🎉 Your Score: {calculateScore()} / {quizData.length}
                  </h3>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: FLASHCARDS */}
      {mode === 'flashcards' && (
        <div className="card-container" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>Study Flashcards</h2>
            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '8px 16px' }}
              onClick={generateFlashcards}
              disabled={loading || !documentContext}
            >
              {loading ? '⏳ Generating...' : '⚡ Generate Deck'}
            </button>
          </div>

          {!documentContext && (
            <p className="hero-subtitle">Please upload a document in weStudy first to generate flashcards.</p>
          )}

          {flashcards.length > 0 && (
            <div>
              {/* Interactive Flashcard Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="flashcard"
                style={{
                  height: '240px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  backgroundColor: isFlipped ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                  borderColor: isFlipped ? 'var(--accent-purple)' : 'var(--primary)',
                  userSelect: 'none'
                }}
              >
                <span className="card-label">
                  {isFlipped ? 'Answer / Definition' : 'Question / Term (Click to flip)'}
                </span>
                
                <h3 className="card-question" style={{ fontSize: '20px', textAlign: 'center' }}>
                  {isFlipped ? flashcards[cardIndex].definition : flashcards[cardIndex].term}
                </h3>
              </div>

              {/* Navigation Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <button
                  className="btn-outline"
                  disabled={cardIndex === 0}
                  onClick={() => {
                    setIsFlipped(false);
                    setCardIndex(cardIndex - 1);
                  }}
                >
                  ⬅️ Previous
                </button>

                <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>
                  {cardIndex + 1} of {flashcards.length}
                </span>

                <button
                  className="btn-outline"
                  disabled={cardIndex === flashcards.length - 1}
                  onClick={() => {
                    setIsFlipped(false);
                    setCardIndex(cardIndex + 1);
                  }}
                >
                  Next ➡️
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: FILL-IN-THE-BLANK / IDENTIFICATION */}
      {mode === 'identification' && (
        <div className="card-container">
          <FillInTheBlank documentContext={documentContext} />
        </div>
      )}

    </div>
  );
}