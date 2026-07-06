"use client";

// src/lib/faceApi.ts
// Singleton face-api model loader + descriptor extractor.
// All face processing is 100% client-side — no external API calls.

let modelsLoaded = false;
let loadingPromise: Promise<void> | null = null;

/**
 * Idempotent loader. Safe to call multiple times — models only load once.
 * Models are served from /public/models/ (must be placed there manually).
 */
export async function loadFaceApiModels(): Promise<void> {
  // AUDIT FIX: Prevent server-side execution of browser-only library
  if (typeof window === "undefined") return;
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    // Dynamic import so face-api never runs on the server
    const faceapi = await import("@vladmandic/face-api");
    const MODEL_URL = "/models";

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoaded = true;
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

  const faceapi = await import("@vladmandic/face-api");

  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return detection.descriptor;
}
