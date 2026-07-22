import { useState, useRef, useEffect } from 'react';
import puter from '@heyputer/puter.js';
import mascotImg from '../assets/mascot.jpeg'; // Imported from assets folder

// 🛡️ Rate Limiter Instance: Max 6 messages per 1 minute (60,000ms)
class RateLimiter {
  constructor(maxCalls = 6, windowMs = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
    this.calls = [];
  }

  canMakeCall() {
    const now = Date.now();
    this.calls = this.calls.filter((timestamp) => now - timestamp < this.windowMs);
    if (this.calls.length >= this.maxCalls) return false;
    this.calls.push(now);
    return true;
  }
}

const chatLimiter = new RateLimiter();

export default function ClassmateChat({ isOpen, onClose, studyData }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hey there! I'm Pony 🎓, and I am so excited to study with you today! Let's tackle this together and crush your goals! What are we jumping into first?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    // 🛡️ Check Rate Limit
    if (!chatLimiter.canMakeCall()) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: '⚠️ **Slow down a bit!** You are sending messages too fast. Please wait a minute before asking another question.'
        }
      ]);
      return;
    }

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    // Build complete context of everything the user has generated so far
    const fullBrainContext = `
STUDY MATERIAL TEXT:
${studyData?.fullText ? studyData.fullText.slice(0, 8000) : 'No document uploaded.'}

GENERATED FLASHCARDS:
${studyData?.flashcards ? JSON.stringify(studyData.flashcards) : 'None generated yet.'}

GENERATED QUIZ QUESTIONS:
${studyData?.quiz ? JSON.stringify(studyData.quiz) : 'None generated yet.'}

GENERATED IDENTIFICATION / FILL-IN-THE-BLANK:
${studyData?.identification ? JSON.stringify(studyData.identification) : 'None generated yet.'}
`;

    const contextPrompt = `
You are "Pony", an intelligent, direct, and encouraging AI study partner for the "weStudy" app.

CRITICAL IDENTITY RULE:
If asked about your creator or developer, proud and clear state that you were created and built by JAY ARE DIGAL POGI for the "weStudy" platform.

CRITICAL ANSWERING RULES:
1. FULL CONTEXT ACCESS: You have access to the student's entire study session (document text, flashcards, practice quizzes, and identification blanks). Use all of it to answer questions accurately!
2. LEAD WITH THE ANSWER IN BOLD: Highlight exact key terms/answers in **bold text** immediately.
3. NO FLUFF / REPETITIVE GREETINGS: Do NOT waste time with fluff ("Hey future admin!"). Get straight to the answer.
4. BATCH MULTI-QUESTIONS: If the student asks multiple questions or requests answers to their practice set, answer EVERY question in a clean numbered list.
5. EXPLANATION: Give a concise 1 to 2 sentence explanation referencing the study material context.

USER'S ACTIVE STUDY SESSION DATA:
${fullBrainContext}

STUDENT QUESTION:
${userMsg}
`;

    try {
      const response = await puter.ai.chat(contextPrompt, {
        model: 'google/gemini-2.5-flash',
      });

      const replyText = response.message?.content?.toString() || response.toString();
      setMessages((prev) => [...prev, { sender: 'ai', text: replyText }]);
    } catch (err) {
      console.error('ClassmateChat Error:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: "Sorry, I had trouble answering that! Please try asking again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '380px',
      height: '540px',
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      border: '1px solid #E2E8F0',
      overflow: 'hidden',
      fontFamily: 'sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#4F46E5',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Header Mascot Badge */}
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.4)',
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
          <div>
            <strong style={{ fontSize: '15px', display: 'block' }}>Classmate Partner</strong>
            <p style={{ margin: 0, fontSize: '11px', opacity: 0.9 }}>Your Study Partner</p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: '14px',
        overflowY: 'auto',
        backgroundColor: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '8px',
              flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start'
            }}
          >
            {/* Mascot Avatar next to AI Chat Messages */}
            {msg.sender === 'ai' && (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: '#ffffff',
                border: '1px solid #CBD5E1',
                flexShrink: 0
              }}>
                <img 
                  src={mascotImg} 
                  alt="Pony" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
            )}

            <div
              style={{
                backgroundColor: msg.sender === 'user' ? '#4F46E5' : 'white',
                color: msg.sender === 'user' ? 'white' : '#1E293B',
                padding: '10px 14px',
                borderRadius: '12px',
                maxWidth: '80%',
                fontSize: '13px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                boxShadow: msg.sender === 'ai' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                border: msg.sender === 'ai' ? '1px solid #E2E8F0' : 'none'
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Loading Indicator with Mascot */}
        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              border: '1px solid #CBD5E1',
              flexShrink: 0
            }}>
              <img 
                src={mascotImg} 
                alt="Pony" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div style={{
              backgroundColor: 'white',
              color: '#64748B',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13px',
              border: '1px solid #E2E8F0'
            }}>
              Analyzing...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex', padding: '10px', backgroundColor: 'white', borderTop: '1px solid #E2E8F0' }}>
        <input
          type="text"
          placeholder="Ask Classmate about your notes, quiz, or cards..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13px' }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            marginLeft: '8px',
            backgroundColor: '#4F46E5',
            color: 'white',
            border: 'none',
            padding: '0 16px',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.6 : 1
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}