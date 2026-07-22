import { useState } from 'react';

export default function FlashcardViewer({ summary, cards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!cards || cards.length === 0) return null;

  const currentCard = cards[currentIndex];

  // 🛠️ Safe Field Normalization (handles both {question, answer} and {term, definition})
  const questionText = currentCard?.question || currentCard?.term || 'No Question Available';
  const answerText = currentCard?.answer || currentCard?.definition || 'No Answer Available';

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  return (
    <div className="viewer-container">
      {/* Dynamic Summary Box */}
      {summary && (
        <div className="summary-box">
          <h3 className="card-title" style={{ color: 'var(--primary)', marginBottom: '8px' }}>
            📝 AI Study Summary
          </h3>
          <p className="summary-text">{summary}</p>
        </div>
      )}

      {/* Interactive Card Section */}
      <div style={{ textAlign: 'center', maxWidth: '540px', margin: '0 auto' }}>
        <p className="card-counter" style={{ marginBottom: '12px' }}>
          Card {currentIndex + 1} of {cards.length}
        </p>

        {/* 3D Animated Flip Container */}
        <div 
          className={`flashcard-wrapper ${isFlipped ? 'flipped' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="flashcard-inner">
            {/* Front Side */}
            <div className="flashcard-front">
              <span className="card-tag">Question / Term (Click to Flip)</span>
              <h3 className="card-text">{questionText}</h3>
            </div>

            {/* Back Side */}
            <div className="flashcard-back">
              <span className="card-tag">Answer / Definition</span>
              <h3 className="card-text">{answerText}</h3>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="viewer-controls">
          <button onClick={handlePrev} className="btn-outline">
            ⬅️ Previous
          </button>

          <span className="card-counter">
            {currentIndex + 1} / {cards.length}
          </span>

          <button onClick={handleNext} className="btn-primary" style={{ width: 'auto' }}>
            Next ➡️
          </button>
        </div>
      </div>
    </div>
  );
}