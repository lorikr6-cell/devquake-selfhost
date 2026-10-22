'use client';

// Reads the text on a picture in the browser (tesseract.js with Romanian and English; the engine
// and the language data load from a CDN the first time). The picture never leaves the device
// for this, and the server does no work (CLAUDE.md rule 12).
export async function recognise(image: Blob): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(['ron', 'eng']);
  try {
    const { data } = await worker.recognize(image);
    return data.text ?? '';
  } finally {
    await worker.terminate();
  }
}
