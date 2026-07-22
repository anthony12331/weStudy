import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import JSZip from "jszip";

// 🟢 Tell Vite to process and bundle the local PDF worker file as a static URL
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Extracts plain text from a PDF file locally
 */
export async function parsePdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");
    fullText += `[Page ${i}]\n${pageText}\n\n`;
  }

  return fullText.trim();
}

/**
 * Extracts plain text from a .docx file locally
 */
export async function parseDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

/**
 * Reads plain text files (.txt, .md)
 */
export async function parseTxt(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

/**
 * Extracts plain text slide-by-slide from PowerPoint (.pptx) files locally
 */
export async function parsePptx(file) {
  const zip = await JSZip.loadAsync(file);
  let extractedText = "";

  const slideFiles = Object.keys(zip.files).filter(
    (path) => path.startsWith("ppt/slides/slide") && path.endsWith(".xml"),
  );

  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
    const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
    return numA - numB;
  });

  const parser = new DOMParser();
  for (let i = 0; i < slideFiles.length; i++) {
    const slidePath = slideFiles[i];
    const xmlString = await zip.file(slidePath).async("text");
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    const textNodes = xmlDoc.getElementsByTagName("a:t");
    let slideText = "";
    for (let j = 0; j < textNodes.length; j++) {
      slideText += textNodes[j].textContent + " ";
    }

    if (slideText.trim()) {
      extractedText += `[Slide ${i + 1}]\n${slideText.trim()}\n\n`;
    }
  }

  return extractedText.trim();
}

/**
 * Dispatcher function to handle file parsing by extension
 */
export async function extractTextFromFile(file) {
  const extension = file.name.split(".").pop().toLowerCase();

  switch (extension) {
    case "pdf":
      return await parsePdf(file);
    case "docx":
      return await parseDocx(file);
    case "txt":
    case "md":
      return await parseTxt(file);
    case "pptx":
    case "ppt":
      return await parsePptx(file);
    default:
      throw new Error(
        `Unsupported file type: .${extension}. Please upload a .pdf, .docx, .pptx, or .txt file.`,
      );
  }
}
