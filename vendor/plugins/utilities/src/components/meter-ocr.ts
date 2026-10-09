'use client';

// Reads the digits on a photo of a meter in the browser (tesseract.js; the engine and its
// language data load from a CDN the first time, then come from the browser cache). The photo
// never leaves the device for this step. lib/meter.ts picks the index out of the text.

export async function readMeterText(image: Blob): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    await worker.setParameters({ tessedit_char_whitelist: '0123456789.,' });
    const { data } = await worker.recognize(image);
    return data.text ?? '';
  } finally {
    await worker.terminate();
  }
}
