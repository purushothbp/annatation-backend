const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { env } = require('../config/env');

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

const ensureDir = async (dirPath) => {
  await mkdir(dirPath, { recursive: true });
};

const normalizeBuffer = (buffer) => {
  if (buffer instanceof Uint8Array && buffer.constructor === Uint8Array) return buffer;
  if (buffer instanceof ArrayBuffer) return new Uint8Array(buffer);
  if (Buffer.isBuffer(buffer)) {
    const typed = new Uint8Array(buffer.length);
    typed.set(buffer);
    return typed;
  }
  if (buffer instanceof Uint8Array) {
    // Buffer subclasses (like Node's Buffer) inherit from Uint8Array; clone to plain Uint8Array.
    const typed = new Uint8Array(buffer.length);
    typed.set(buffer);
    return typed;
  }
  throw new TypeError('Unsupported buffer type for PDF extraction');
};

const gatherPageText = (textContent) => {
  if (!textContent?.items) return '';
  return textContent.items
    .map((item) => {
      if (typeof item.str === 'string') return item.str;
      if (item.type === 'space') return ' ';
      return '';
    })
    .join('');
};

const extractPdfText = async (buffer) => {
  const data = normalizeBuffer(buffer);
  const loadingTask = pdfjsLib.getDocument({ data, useSystemFonts: true });
  const doc = await loadingTask.promise;

  try {
    const numPages = doc.numPages;
    const pageOffsets = [];
    let combinedText = '';

    for (let pageNumber = 1; pageNumber <= numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = gatherPageText(textContent);
      const start = combinedText.length;
      combinedText += pageText;
      const end = combinedText.length;
      pageOffsets.push({ start, end, page: pageNumber });
      combinedText += '\n\n';
      page.cleanup();
    }

    const metadataResult = await doc.getMetadata().catch(() => ({ info: {}, metadata: {} }));

    return {
      text: combinedText,
      metadata: {
        pageOffsets,
        info: metadataResult.info || {},
        metadata: metadataResult.metadata || {},
        numpages: numPages,
      },
    };
  } finally {
    if (typeof doc.cleanup === 'function') {
      await doc.cleanup();
    }
    await doc.destroy();
  }
};

const storeExtractedText = async ({ documentId, buffer }) => {
  await ensureDir(env.textDir);
  const textFileName = `${documentId}.txt`;
  const metaFileName = `${documentId}.meta.json`;
  const textPath = path.join(env.textDir, textFileName);
  const metaPath = path.join(env.textDir, metaFileName);

  const { text, metadata } = await extractPdfText(buffer);

  await writeFile(textPath, text, 'utf8');
  await writeFile(metaPath, JSON.stringify(metadata, null, 2), 'utf8');

  return {
    textPath,
    metadataPath: metaPath,
    textFileName,
    metaFileName,
  };
};

module.exports = {
  storeExtractedText,
};
