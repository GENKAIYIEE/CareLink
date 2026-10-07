"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { CheckCircle2, AlertCircle, Camera, Loader2, ScanFace, X } from "lucide-react";
import { loadFaceApiModels, getFaceDescriptor } from "@/lib/faceApi";
import { enrollFaceAction } from "@/lib/actions/seniors";
import { toast } from "sonner";

interface FaceEnrollmentModalProps {
  seniorId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type EnrollState = "idle" | "loading_models" | "ready" | "capturing" | "success" | "error" | "saving";

export function FaceEnrollmentModal({ seniorId, isOpen, onClose, onComplete }: FaceEnrollmentModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [enrollState, setEnrollState] = useState<EnrollState>("loading_models");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedThumb, setCapturedThumb] = useState<string | null>(null);
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Load face-api models when modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    setEnrollState("loading_models");
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
      if (webcamRef.current?.video?.srcObject) {
        const stream = webcamRef.current.video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const handleCapture = useCallback(async () => {
    if (!webcamRef.current) return;
    setEnrollState("capturing");
    setErrorMsg(null);

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
          "No face detected. Please ensure you are facing the camera directly in good lighting."
        );
        return;
      }

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

  const handleRetake = () => {
    setCapturedThumb(null);
    setDescriptor(null);
    setEnrollState("ready");
    setErrorMsg(null);
  };

  const handleSave = async () => {
    if (descriptor) {
      setEnrollState("saving");
      try {
        const res = await enrollFaceAction(seniorId, Array.from(descriptor));

        if (!res.success) {
          console.error("Face embedding save error:", res.error);
          toast.warning("Face data could not be saved to the database. Please try again.");
          setEnrollState("success");
        } else {
          toast.success("Face enrolled successfully!");
          onComplete();
          onClose();
        }
      } catch (err) {
        console.error("Face embedding action error:", err);
        toast.warning("Face enrollment failed — please try again later.");
        setEnrollState("success");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-green-100 text-[#006b2c] rounded-full flex items-center justify-center shrink-0">
              <ScanFace className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Enroll Face Data</h2>
              <p className="text-sm text-gray-500 mt-1">
                Scan your face to enable quick biometric verification for benefit claiming.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            {enrollState === "success" && capturedThumb ? (
              <div className="relative w-[320px] h-[240px] rounded-xl overflow-hidden border-4 border-[#006b2c] shadow-lg">
                <img src={capturedThumb} alt="Captured face" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-green-900/20 flex items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-green-400 drop-shadow-md" />
                </div>
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
                    onUserMedia={() => setIsCameraReady(true)}
                    onUserMediaError={(err) => {
                      console.error("Webcam error:", err);
                      setEnrollState("error");
                      setErrorMsg("Camera access denied or unavailable. Please check permissions.");
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {(enrollState === "ready" || enrollState === "capturing") && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 320 240"
                      preserveAspectRatio="xMidYMid slice"
                    >
                      <defs>
                        <mask id="oval-mask-enroll-user">
                          <rect width="320" height="240" fill="white" />
                          <ellipse cx="160" cy="120" rx="85" ry="105" fill="black" />
                        </mask>
                      </defs>
                      <rect
                        width="320"
                        height="240"
                        fill="rgba(0,0,0,0.5)"
                        mask="url(#oval-mask-enroll-user)"
                      />
                      <ellipse
                        cx="160"
                        cy="120"
                        rx="85"
                        ry="105"
                        fill="none"
                        stroke="#006b2c"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    </svg>
                  </div>
                )}

                {(enrollState === "loading_models" || !isCameraReady && enrollState !== "error") && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-sm font-medium">
                      {enrollState === "loading_models" ? "Loading models..." : "Initializing camera..."}
                    </span>
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="w-full p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            {enrollState === "success" ? (
              <div className="w-full grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="w-full py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full py-2.5 rounded-lg bg-[#006b2c] text-white font-bold hover:bg-green-800 transition-colors"
                >
                  Save Face Data
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCapture}
                disabled={enrollState !== "ready" || !isCameraReady}
                className="w-full py-3 mt-2 rounded-lg bg-[#006b2c] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-5 h-5" />
                {enrollState === "capturing" ? "Scanning..." : !isCameraReady ? "Initializing Camera..." : "Capture Face"}
              </button>
            )}

            {enrollState === "saving" && (
              <div className="w-full flex justify-center py-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#006b2c]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
