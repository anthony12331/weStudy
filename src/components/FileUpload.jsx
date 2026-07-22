import { useState } from 'react';
import { extractTextFromFile } from '../lib/fileParser';

export default function FileUpload({ onTextExtracted }) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    try {
      // Delegate all parsing (PDF, DOCX, PPTX, TXT) to fileParser.js
      const text = await extractTextFromFile(file);

      if (!text.trim()) {
        throw new Error('No readable text found in the file!');
      }

      onTextExtracted(file.name, text);
    } catch (err) {
      alert('Error reading file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      border: '2px dashed #CBD5E1',
      padding: '2rem',
      borderRadius: '8px',
      textAlign: 'center',
      backgroundColor: '#F8FAFC'
    }}>
      <h3>📁 Drop or Select Your Study File</h3>
      <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '16px' }}>
        Supports PDF, DOCX, PPTX, and TXT files
      </p>

      <input
        type="file"
        accept=".pdf,.docx,.pptx,.ppt,.txt"
        onChange={handleFileChange}
        disabled={loading}
        id="fileInput"
        style={{ display: 'none' }}
      />

      <label
        htmlFor="fileInput"
        style={{
          backgroundColor: '#3B82F6',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          display: 'inline-block'
        }}
      >
        {loading ? '⏳ Reading File...' : 'Choose File'}
      </label>

      {fileName && (
        <p style={{ marginTop: '12px', fontSize: '14px', color: '#10B981', fontWeight: 'bold' }}>
          📄 Loaded: {fileName}
        </p>
      )}
    </div>
  );
}