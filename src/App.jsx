import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { localDb } from './lib/db';
import { generateFlashcardsWithAI, generateMoreCardsWithAI } from './lib/gemini';
import FileUpload from './components/FileUpload';
import FlashcardViewer from './components/FlashcardViewer';
import NotificationModal from './components/NotificationModal';
import ClassmateChat from './components/ClassmateChat';
import StudyTools from './components/StudyTools';
import Feedback from './components/Feedback';
import mascotImg from './assets/mascot.jpeg'; // Adjust relative path if needed
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [pastedText, setPastedText] = useState('');
  const [extractedContent, setExtractedContent] = useState('');
  const [activeFileName, setActiveFileName] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [currentDeck, setCurrentDeck] = useState(null);
  const [savedDecks, setSavedDecks] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Active Quiz & Identification state to feed into AI Chat
  const [activeQuiz, setActiveQuiz] = useState([]);
  const [activeIdentification, setActiveIdentification] = useState([]);

  // Feedback Modal state
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // 🌙 / ☀️ Light & Dark Mode State Management
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('westudy-theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('westudy-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null
  });

  const showNotice = (message, title = 'Notice', type = 'info') => {
    setModal({ isOpen: true, title, message, type, onConfirm: null });
  };

  const showConfirm = (message, title, onConfirm) => {
    setModal({ isOpen: true, title, message, type: 'confirm', onConfirm });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadSavedDecks();
  }, [user]);

  const loadSavedDecks = async () => {
    const decks = await localDb.decks.toArray();
    setSavedDecks(decks);
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setExtractedContent('');
    setCurrentDeck(null);
    setActiveQuiz([]);
    setActiveIdentification([]);
  };

  const handleDeleteDeck = (e, deckId) => {
    e.stopPropagation();
    showConfirm(
      'Are you sure you want to delete this flashcard deck?',
      'Delete Deck',
      async () => {
        await localDb.decks.delete(deckId);
        if (currentDeck?.id === deckId) setCurrentDeck(null);
        loadSavedDecks();
      }
    );
  };

  const handleTextExtracted = (fileName, text) => {
    setActiveFileName(fileName);
    setExtractedContent(text);
  };

  const handleGenerateAI = async () => {
    const textToProcess = activeTab === 'upload' ? extractedContent : pastedText;
    const title = activeTab === 'upload' 
      ? activeFileName 
      : `Summary Deck (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;

    if (!textToProcess.trim()) {
      showNotice('Please upload a file or paste some notes first.', 'Missing Input', 'error');
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateFlashcardsWithAI(textToProcess);
      
      const deckId = await localDb.decks.add({
        title,
        summary: result.summary,
        cards: result.flashcards,
        fullText: textToProcess,
        createdAt: new Date()
      });

      const newDeck = { id: deckId, title, summary: result.summary, cards: result.flashcards, fullText: textToProcess };
      setCurrentDeck(newDeck);
      setExtractedContent(textToProcess);
      loadSavedDecks();
    } catch (err) {
      showNotice(err.message, 'Generation Failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!currentDeck) return;

    setIsGeneratingMore(true);
    try {
      const existingQuestions = currentDeck.cards.map(c => c.question || c.term);
      const textSource = currentDeck.fullText || currentDeck.summary;

      const newCards = await generateMoreCardsWithAI(textSource, existingQuestions);
      const updatedCards = [...currentDeck.cards, ...newCards];

      await localDb.decks.update(currentDeck.id, { cards: updatedCards });
      setCurrentDeck({ ...currentDeck, cards: updatedCards });
      loadSavedDecks();
    } catch (err) {
      showNotice(err.message, 'Could Not Add Cards', 'error');
    } finally {
      setIsGeneratingMore(false);
    }
  };

  // Main Authenticated View
  if (user) {
    return (
      <div className="app-container">
        {/* Navigation Bar */}
        <header className="app-header">
          <div className="header-content">
            <div className="brand-wrapper">
              <div className="brand-logo">w</div>
              <span className="brand-text">weStudy</span>
            </div>

            <div className="user-nav-wrapper">
              <div className="user-badge">
                <div className="status-indicator" />
                <span className="user-email">{user.email}</span>
              </div>
              
              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme} 
                className="btn-outline" 
                title="Toggle Light/Dark Theme"
                style={{ padding: '8px 12px', fontSize: '14px', cursor: 'pointer' }}
              >
                {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </button>

              {/* 💬 Feedback Button */}
              <button 
                onClick={() => setIsFeedbackOpen(true)} 
                className="btn-outline"
                style={{ padding: '8px 12px', fontSize: '14px', cursor: 'pointer' }}
              >
                💬 Feedback
              </button>
              
              <button onClick={handleLogout} className="btn-outline">
                Log Out
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="main-content">
          <div className="hero-section">
            <h1 className="hero-title">Turn Study Material into Instant Knowledge</h1>
            <p className="hero-subtitle">
              Upload your summary note or documents to generate summaries, interactive quizzes, and flashcard decks.
            </p>
          </div>

          <div className="content-grid">
            {/* Input Card Container */}
            <div className="card-container">
              <div className="tab-switcher">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                >
                  📁 Upload Document
                </button>
                <button
                  onClick={() => setActiveTab('paste')}
                  className={`tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
                >
                  ✍️ Paste Text Notes
                </button>
              </div>

              {activeTab === 'upload' && <FileUpload onTextExtracted={handleTextExtracted} />}

              {activeTab === 'paste' && (
                <textarea
                  rows={7}
                  placeholder="Paste lecture notes, study outlines, or article text here..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  className="notes-textarea"
                />
              )}

              {((activeTab === 'upload' && extractedContent) || (activeTab === 'paste' && pastedText.trim())) && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <button onClick={handleGenerateAI} disabled={isGenerating} className="btn-primary">
                    {isGenerating ? (
                      <>
                        <span className="spinner"></span> AI is Processing Material...
                      </>
                    ) : (
                      '✨ Generate Summary & AI Flashcard Deck'
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Interactive Quiz, Flashcard & Identification Practice Tools */}
            <div className="card-container">
              <StudyTools 
                documentContext={currentDeck?.fullText || extractedContent || pastedText} 
                onQuizGenerated={(data) => setActiveQuiz(data)}
                onIdentificationGenerated={(data) => setActiveIdentification(data)}
              />
            </div>

            {/* Current Generated Deck Preview */}
            {currentDeck && (
              <div className="card-container full-width">
                <FlashcardViewer summary={currentDeck.summary} cards={currentDeck.cards} />
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <button onClick={handleGenerateMore} disabled={isGeneratingMore} className="btn-secondary">
                    {isGeneratingMore ? '⏳ Generating New Questions...' : '➕ Expand Deck with 5 More Cards'}
                  </button>
                </div>
              </div>
            )}

            {/* Saved Decks Grid */}
            {savedDecks.length > 0 && (
              <div className="card-container full-width">
                <div className="decks-header">
                  <h3 className="decks-title">💾 Saved Flashcard Decks</h3>
                  <span className="decks-count-badge">{savedDecks.length} Decks</span>
                </div>

                <div className="decks-grid">
                  {savedDecks.map((deck) => {
                    const isSelected = currentDeck?.id === deck.id;
                    return (
                      <div
                        key={deck.id}
                        onClick={() => setCurrentDeck(deck)}
                        className={`deck-card ${isSelected ? 'selected' : ''}`}
                      >
                        <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
                          <p className="deck-info-title">{deck.title}</p>
                          <p className="deck-info-count">🎴 {deck.cards?.length || 0} Flashcards</p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteDeck(e, deck.id)}
                          title="Delete Deck"
                          className="btn-delete"
                        >
                          DELETE
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Notification Modal */}
        <NotificationModal
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onConfirm={modal.onConfirm}
          onClose={closeModal}
        />

        {/* Feedback Modal */}
        <Feedback
          userEmail={user?.email}
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
        />

      {/* Floating Chat Button */}
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="floating-chat-btn">
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <img 
              src={mascotImg} 
              alt="Pony Mascot" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          Ask Partner
        </button>
        {/* AI Assistant Chat Panel */}
        <ClassmateChat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          studyData={{
            fullText: currentDeck?.fullText || extractedContent || pastedText,
            flashcards: currentDeck?.cards || [],
            quiz: activeQuiz,
            identification: activeIdentification
          }}
        />
      </div>
    );
  }

  // Login View
  return (
    <div className="login-container">
      {/* Login Page Theme Switcher Positioned Top-Right */}
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <button 
          onClick={toggleTheme} 
          className="btn-outline" 
          title="Toggle Light/Dark Theme"
          style={{ padding: '8px 12px', fontSize: '14px', cursor: 'pointer' }}
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      <div className="login-card">
        <div className="brand-logo large">w</div>
        <h1 className="login-title">Welcome to weStudy</h1>
        <p className="login-subtitle">
          Your study assistant. Convert documents into quizzes, flashcards,  Identification and summary decks in seconds.
        </p>
        <button onClick={handleGoogleSignIn} className="btn-primary">
          Sign in with Google
        </button>
      </div>
    </div>
  );
}