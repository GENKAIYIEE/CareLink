"use client";

// src/lib/faceApi.ts
// Singleton face-api model loader + descriptor extractor.
// All face processing is 100% client-side — no external API calls.

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;
// Module-level cache — avoids re-importing the library on every getFaceDescriptor call.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _faceapi: any = null;

async function getFaceApi() {
  if (_faceapi) return _faceapi;
  _faceapi = await import("@vladmandic/face-api");
  
  try {
    // Explicitly initialize the WebGL backend. If this hangs or fails, we catch it.
    await _faceapi.tf.setBackend('webgl');
    await _faceapi.tf.ready();
  } catch (err) {
    console.warn("WebGL initialization failed, falling back to CPU:", err);
    await _faceapi.tf.setBackend('cpu');
    await _faceapi.tf.ready();
  }
  
  return _faceapi;
}

/**
 * Synchronous check — lets components skip the 'loading_models' UI state
 * entirely when models are already cached in memory from a previous load.
 */
export function areFaceApiModelsLoaded(): boolean {
  return modelsLoaded;
}

/**
 * Idempotent loader. Safe to call multiple times — models only load once.
 * Models are served from /public/models/ (must be placed there manually).
 */
export async function loadFaceApiModels(): Promise<void> {
  if (typeof window === "undefined") return;
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const faceapi = await getFaceApi();
      const MODEL_URL = "/models";

      // Load sequentially to avoid overwhelming the dev server or network
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

      modelsLoaded = true;
    } catch (err) {
      // If it fails, clear the promise so we can retry next time
      loadingPromise = null;
      throw err;
    }
  })();

  return loadingPromise;
}

/**
 * Captures a single face descriptor from a video element.
 * @param videoEl - The <video> element currently showing the webcam feed.
 * @returns A Float32Array of 128 values, or null if no face was detected.
 */
export async function getFaceDescriptor(
  videoEl: HTMLVideoElement
): Promise<Float32Array | null> {
  // AUDIT FIX: Prevent server-side execution of browser-only library
  if (typeof window === "undefined") return null;

  // Use cached module reference — no repeated dynamic import overhead per scan.
  const faceapi = await getFaceApi();

  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return detection.descriptor;
}
