import puter from "@heyputer/puter.js";

// Silence Puter startup messages
if (typeof window !== "undefined") {
  puter.quiet = true;
}

// Helper prompt guidelines to filter out administrative syllabus junk
const ACADEMIC_FILTER_INSTRUCTIONS = `
CRITICAL QUALITY FILTER RULES:
1. ONLY generate study materials testing core academic concepts, definitions, theories, technical terms, processes, formulas, and main topic insights.
2. IGNORE all administrative or syllabus rules. NEVER generate items about:
   - Course codes (e.g., "IT 411"), grading schemes, percentages, or passing scores.
   - Attendance policies, exam schedules (e.g., Prelim, Midterm, Finals), due dates, or teacher names.
   - Project submissions or general classroom requirements.
3. Make every item meaningful for a student studying for a real subject exam.
`;

export async function generateFlashcardsWithAI(textContent) {
  const prompt = `
  You are an expert academic study assistant. Analyze the following study text and generate:
  1. A concise overview summary (2-3 paragraphs) focusing strictly on subject matter concepts.
  2. A list of 5 to 10 high-quality academic flashcards (Question and Answer pairs).

  ${ACADEMIC_FILTER_INSTRUCTIONS}

  Study Text:
  ${textContent.slice(0, 15000)}

  Return ONLY a valid JSON object matching this schema, without markdown formatting or backticks:
  {
    "summary": "Your text summary here...",
    "flashcards": [
      {
        "question": "Clear academic question here?",
        "answer": "Concise answer here."
      }
    ]
  }
  `;

  try {
    const response = await puter.ai.chat(prompt, {
      model: "google/gemini-2.5-flash",
    });

    const rawContent =
      response.message?.content?.toString() || response.toString();
    const cleanText = rawContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Puter AI Generation Error:", error);
    throw new Error("Failed to generate flashcards: " + error.message);
  }
}

export async function generateMoreCardsWithAI(
  textContent,
  existingQuestions = [],
) {
  const prompt = `
  You are an expert academic study assistant. Based on the study text below, generate 5 MORE NEW academic flashcards.

  ${ACADEMIC_FILTER_INSTRUCTIONS}

  CRITICAL RULE: Do NOT duplicate or rephrase any of these existing questions:
  ${JSON.stringify(existingQuestions)}

  Study Text:
  ${textContent.slice(0, 15000)}

  Return ONLY a valid JSON array matching this schema, without markdown formatting or backticks:
  [
    {
      "question": "New clear academic question here?",
      "answer": "Concise answer here."
    }
  ]
  `;

  try {
    const response = await puter.ai.chat(prompt, {
      model: "google/gemini-2.5-flash",
    });

    const rawContent =
      response.message?.content?.toString() || response.toString();
    const cleanText = rawContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Puter AI More Cards Error:", error);
    throw new Error(
      "Failed to generate additional flashcards: " + error.message,
    );
  }
}

export async function generateFillInBlanksWithAI(textContent) {
  const prompt = `
  You are an expert academic study assistant. Analyze the study text below and generate 5 Fill-in-the-Blank / Identification questions.
  Focus on core academic concepts, definitions, technical terms, processes, and formulas.

  ${ACADEMIC_FILTER_INSTRUCTIONS}

  For each question:
  - "sentence": The concept sentence with '_____' representing the missing key term.
  - "answer": The exact word or short phrase that goes in the blank.
  - "hint": A subtle contextual hint (e.g., first letter, synonym, or prefix/suffix hint) without giving away the exact answer.

  Study Text:
  ${textContent.slice(0, 15000)}

  Return ONLY a valid JSON array matching this schema, without markdown formatting or backticks:
  [
    {
      "sentence": "The process of fat breakdown in the body is known as _____.",
      "answer": "lipolysis",
      "hint": "Starts with 'lipo-'"
    }
  ]
  `;

  try {
    const response = await puter.ai.chat(prompt, {
      model: "google/gemini-2.5-flash",
    });

    const rawContent =
      response.message?.content?.toString() || response.toString();
    const cleanText = rawContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Puter AI Identification Error:", error);
    throw new Error(
      "Failed to generate identification questions: " + error.message,
    );
  }
}
