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
    // Prefer WebGL (GPU) — dramatically faster for face detection.
    // Falls back to CPU if WebGL is unavailable (old/low-spec laptops, no GPU, etc.)
    await _faceapi.tf.setBackend('webgl');
    await _faceapi.tf.ready();
    console.info('[FaceAPI] Using WebGL (GPU) backend — fast mode.');
  } catch {
    try {
      console.warn('[FaceAPI] WebGL unavailable — falling back to CPU backend.');
      await _faceapi.tf.setBackend('cpu');
      await _faceapi.tf.ready();
    } catch (err) {
      console.error('[FaceAPI] All backends failed:', err);
    }
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

  try {
    const detection = await faceapi
      .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    // Proactive WebGL health check if detection is null:
    // TensorFlow.js often swallows WebGL context loss errors and just returns undefined.
    // If we didn't find a face AND we are on WebGL, test the GPU with a tiny operation.
    // If WebGL is lost, this will throw and trigger the CPU fallback catch block.
    if (!detection && faceapi.tf.getBackend() === 'webgl') {
      try {
        faceapi.tf.zeros([1]).dataSync();
      } catch (glErr) {
        throw new Error("Silent WebGL context loss detected");
      }
    }

    if (!detection) return null;
    return detection.descriptor;
  } catch (err) {
    // WebGL context loss recovery:
    // The GPU context can be lost mid-inference on some devices (CONTEXT_LOST_WEBGL).
    // When that happens, automatically fall back to CPU and retry once.
    console.warn('[FaceAPI] Inference error (possible WebGL context loss). Retrying with CPU backend…', err);
    try {
      await faceapi.tf.setBackend('cpu');
      await faceapi.tf.ready();
      console.info('[FaceAPI] Switched to CPU backend after WebGL failure. Retrying scan…');

      const detection = await faceapi
        .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return null;
      return detection.descriptor;
    } catch (retryErr) {
      console.error('[FaceAPI] CPU retry also failed:', retryErr);
      return null;
    }
  }
}
