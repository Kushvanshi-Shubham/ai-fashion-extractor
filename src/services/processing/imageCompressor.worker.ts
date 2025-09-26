// src/services/processing/imageCompressor.worker.ts
/* eslint-disable no-restricted-globals */
importScripts('https://unpkg.com/browser-image-compression@latest/dist/browser-image-compression.js');

self.onmessage = async (event) => {
  const { file, options } = event.data;
  try {
    const compressed = await ImageCompressionService(file, options);
    const reader = new FileReader();
    reader.onload = () => {
      self.postMessage({ success: true, dataUrl: reader.result });
    };
    reader.readAsDataURL(compressed);
  } catch (err) {
    self.postMessage({ success: false, error: err.message });
  }
};
