import { useState } from 'react';
import { generateFillInBlanksWithAI } from '../lib/gemini';

export default function FillInTheBlank({ documentContext, onDataGenerated }) {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [showHints, setShowHints] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!documentContext?.trim()) {
      setError('Please upload a file or paste study notes first.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSubmitted(false);
    setUserAnswers({});
    setShowHints({});

    try {
  const data = await generateFillInBlanksWithAI(documentContext);
  setQuestions(data);
  if (onDataGenerated) onDataGenerated(data);
} catch (err) {
  console.error('FillInTheBlank Error:', err); // 👈 Best option
  setError('Failed to generate questions. Please try again.');
} finally {
  setIsLoading(false);
    }
  };

  const handleInputChange = (index, value) => {
    setUserAnswers(prev => ({ ...prev, [index]: value }));
  };

  const toggleHint = (index) => {
    setShowHints(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Flexible string check (case-insensitive & whitespace clean)
  const isCorrect = (index) => {
    const user = (userAnswers[index] || '').trim().toLowerCase();
    const target = (questions[index]?.answer || '').trim().toLowerCase();
    return user === target;
  };

  const calculateScore = () => {
    return questions.reduce((score, _, idx) => (isCorrect(idx) ? score + 1 : score), 0);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Fill-in-the-Blank Identification</h3>
          <p className="text-xs text-zinc-500">Test active recall by identifying missing key terms.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading || !documentContext?.trim()}
          className="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs font-medium py-1.5 px-3 rounded-md transition-all cursor-pointer"
        >
          {isLoading ? 'Generating...' : questions.length > 0 ? 'New Practice Set' : 'Start Practice'}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      {!documentContext?.trim() && questions.length === 0 && (
        <p className="text-xs text-zinc-400 italic bg-zinc-50 p-3 rounded-lg border border-zinc-200/60">
          Upload or paste study notes to generate identification exercises.
        </p>
      )}

      {/* Question List */}
      {questions.length > 0 && (
        <div className="flex flex-col gap-4 mt-2">
          {questions.map((q, idx) => {
            const correct = isCorrect(idx);
            const userText = userAnswers[idx] || '';

            return (
              <div 
                key={idx} 
                className={`p-3.5 rounded-lg border transition-all ${
                  submitted
                    ? correct
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-red-300 bg-red-50/40'
                    : 'border-zinc-200/80 bg-zinc-50/50'
                }`}
              >
                <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-medium mb-2">
                  <span className="font-mono text-zinc-400 mr-2">{idx + 1}.</span>
                  {q.sentence}
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type missing term..."
                    value={userText}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    disabled={submitted}
                    className={`text-xs p-2 rounded-md border w-full max-w-xs focus:outline-none transition-all ${
                      submitted
                        ? correct
                          ? 'border-emerald-500 bg-emerald-100 text-emerald-900 font-bold'
                          : 'border-red-400 bg-red-100 text-red-900 font-medium'
                        : 'border-zinc-200 bg-white focus:border-zinc-900'
                    }`}
                  />

                  {!submitted && (
                    <button
                      onClick={() => toggleHint(idx)}
                      className="text-[11px] font-medium text-zinc-500 hover:text-zinc-800 px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 transition-colors"
                    >
                      {showHints[idx] ? 'Hide Hint' : '💡 Hint'}
                    </button>
                  )}
                </div>

                {/* Show Hint before submission */}
                {showHints[idx] && !submitted && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200/60 font-mono mt-2">
                    Hint: {q.hint}
                  </p>
                )}

                {/* Post-Submission Correction Banner */}
                {submitted && (
                  <div className="mt-2 text-xs font-sans">
                    {correct ? (
                      <p className="text-emerald-700 font-bold flex items-center gap-1">
                        ✓ Correct! Answer: <span className="underline">{q.answer}</span>
                      </p>
                    ) : (
                      <p className="text-red-700 font-medium">
                        ✗ Incorrect. Correct Answer: <strong className="font-extrabold text-red-900 bg-red-100 px-1.5 py-0.5 rounded">{q.answer}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Action Bar & Score Summary */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
            {!submitted ? (
              <button
                onClick={() => setSubmitted(true)}
                className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium py-2 px-4 rounded-md transition-all cursor-pointer"
              >
                Submit & Check Answers
              </button>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-zinc-800">
                  🎉 Final Score: {calculateScore()} / {questions.length} ({Math.round((calculateScore() / questions.length) * 100)}%)
                </span>
                <button
                  onClick={handleGenerate}
                  className="text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 py-1.5 px-3 rounded-md transition-all cursor-pointer"
                >
                  Try New Set
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}