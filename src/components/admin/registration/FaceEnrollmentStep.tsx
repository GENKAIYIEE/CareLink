"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { CheckCircle2, AlertCircle, Camera, Loader2, ScanFace, ChevronRight } from "lucide-react";
import { loadFaceApiModels, getFaceDescriptor } from "@/lib/faceApi";
import { enrollFaceAction } from "@/lib/actions/seniors";
import { toast } from "sonner";

interface FaceEnrollmentStepProps {
  seniorId: string;
  onComplete: (enrolled: boolean) => void;
}

type EnrollState = "idle" | "loading_models" | "ready" | "capturing" | "success" | "error" | "saving";

export function FaceEnrollmentStep({ seniorId, onComplete }: FaceEnrollmentStepProps) {
  const webcamRef = useRef<Webcam>(null);
  const [enrollState, setEnrollState] = useState<EnrollState>("loading_models");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedThumb, setCapturedThumb] = useState<string | null>(null);
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null);
  const [skipped, setSkipped] = useState(false);

  // Load face-api models on mount
  useEffect(() => {
    let cancelled = false;
    loadFaceApiModels()
      .then(() => {
        if (!cancelled) setEnrollState("ready");
      })
      .catch((err) => {
        console.error("Failed to load face-api models:", err);
        if (!cancelled) {
          setEnrollState("error");
          setErrorMsg("Failed to load face recognition models. Please refresh the page.");
        }
      });
    return () => {
      cancelled = true;
      // AUDIT FIX: Manually stop webcam stream on unmount
      if (webcamRef.current?.video?.srcObject) {
        const stream = webcamRef.current.video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = useCallback(async () => {
    if (!webcamRef.current) return;
    setEnrollState("capturing");
    setErrorMsg(null);
    setSkipped(false);

    try {
      const video = webcamRef.current.video;
      if (!video) {
        setEnrollState("error");
        setErrorMsg("Webcam not ready. Please wait a moment and try again.");
        return;
      }

      const desc = await getFaceDescriptor(video);

      if (!desc) {
        setEnrollState("ready");
        setErrorMsg(
          "No face detected. Ensure the senior faces the camera directly in good lighting."
        );
        return;
      }

      // Capture thumbnail for visual confirmation
      const thumb = webcamRef.current.getScreenshot();
      setCapturedThumb(thumb);
      setDescriptor(desc);
      setEnrollState("success");
    } catch (err) {
      console.error("Face capture error:", err);
      setEnrollState("ready");
      setErrorMsg("An error occurred during face capture. Please try again.");
    }
  }, []);

  const handleSkip = () => {
    setSkipped(true);
    setDescriptor(null);
    setCapturedThumb(null);
    setEnrollState("ready");
    setErrorMsg(null);
  };

  const handleRetake = () => {
    setCapturedThumb(null);
    setDescriptor(null);
    setSkipped(false);
    setEnrollState("ready");
    setErrorMsg(null);
  };

  const handleNextStep = async () => {
    if (skipped) {
      onComplete(false);
      return;
    }

    if (descriptor) {
      setEnrollState("saving");
      try {
        const res = await enrollFaceAction(seniorId, Array.from(descriptor));

        if (!res.success) {
          console.error("Face embedding save error:", res.error);
          toast.warning(
            "Face data could not be saved to the database. You can enroll later from the profile."
          );
          onComplete(false);
        } else {
          onComplete(true);
        }
      } catch (err) {
        console.error("Face embedding action error:", err);
        toast.warning("Face enrollment failed — please retry from profile later.");
        onComplete(false);
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-green-100 text-[#006b2c] rounded-full flex items-center justify-center shrink-0">
            <ScanFace className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Face Enrollment</h2>
            <p className="text-sm text-gray-500 mt-1">
              Capture the senior&apos;s face for identity verification during benefit claiming.
            </p>
          </div>
        </div>

        {/* Camera / Success Preview */}
        <div className="flex flex-col items-center gap-4">
          {enrollState === "success" && capturedThumb ? (
            <div className="relative w-[320px] h-[240px] rounded-xl overflow-hidden border-4 border-[#006b2c] shadow-lg">
              <img src={capturedThumb} alt="Captured face" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-400 drop-shadow-md" />
              </div>
            </div>
          ) : skipped ? (
            <div className="w-[320px] h-[240px] rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
              <ScanFace className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm font-medium">Face Enrollment Skipped</p>
            </div>
          ) : (
            <div className="relative w-[320px] h-[240px] rounded-xl overflow-hidden bg-gray-900 border-2 border-gray-200 shadow-inner">
              {(enrollState === "ready" || enrollState === "capturing") && (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  mirrored={true}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Oval face guide overlay */}
              {(enrollState === "ready" || enrollState === "capturing") && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 320 240"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <defs>
                      <mask id="oval-mask-enroll">
                        <rect width="320" height="240" fill="white" />
                        <ellipse cx="160" cy="120" rx="85" ry="105" fill="black" />
                      </mask>
                    </defs>
                    <rect
                      width="320"
                      height="240"
                      fill="rgba(0,0,0,0.5)"
                      mask="url(#oval-mask-enroll)"
                    />
                    <ellipse
                      cx="160"
                      cy="120"
                      rx="85"
                      ry="105"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="2.5"
                      strokeDasharray="8 4"
                    />
                  </svg>
                </div>
              )}

              {/* Loading state */}
              {enrollState === "loading_models" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white gap-3 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                  <span className="text-sm font-medium text-center px-4">
                    Loading face recognition models...
                  </span>
                </div>
              )}

              {/* Capturing spinner */}
              {enrollState === "capturing" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white gap-2 z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                  <span className="text-sm font-medium">Scanning face...</span>
                </div>
              )}

              {/* Error state placeholder */}
              {enrollState === "error" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white gap-2 p-4 text-center z-10">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                  <span className="text-sm font-medium">{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Instructions below webcam */}
          {!skipped && enrollState !== "success" && enrollState !== "loading_models" && (
            <p className="text-sm font-medium text-gray-700">
              Position the senior&apos;s face inside the oval and click Capture
            </p>
          )}

          {/* Inline error message */}
          {errorMsg && enrollState !== "error" && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm w-full max-w-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success message */}
          {enrollState === "success" && (
            <div className="flex items-center gap-2 text-[#006b2c] rounded-lg px-2 py-1 w-full max-w-sm justify-center">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="font-bold text-lg">Face captured successfully</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 max-w-sm mx-auto w-full mt-6">
          {enrollState === "success" || skipped ? (
            <button
              type="button"
              onClick={handleRetake}
              disabled={enrollState === "saving"}
              className="w-full py-2.5 rounded-lg border-2 border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {skipped ? "Enrol Face Now" : "Retake Photo"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCapture}
              disabled={enrollState !== "ready"}
              className="w-full py-3 rounded-lg bg-[#006b2c] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-5 h-5" />
              {enrollState === "capturing" ? "Scanning..." : "Capture Face"}
            </button>
          )}

          {!skipped && enrollState !== "success" && (
            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-center text-xs font-medium text-gray-400 hover:text-gray-600 py-2 transition-colors"
            >
              Skip face enrollment (can be added later)
            </button>
          )}

          {/* Next Step Button inside FaceEnrollmentStep */}
          <button
            type="button"
            onClick={handleNextStep}
            disabled={(!descriptor && !skipped) || enrollState === "saving"}
            className={`w-full py-3 rounded-lg text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-colors mt-4
              ${
                descriptor || skipped
                  ? "bg-gray-900 hover:bg-black"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
          >
            {enrollState === "saving" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Next Step <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
