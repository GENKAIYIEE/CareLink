"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Webcam from "react-webcam";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ScanFace,
  RefreshCw,
  ShieldAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { loadFaceApiModels, getFaceDescriptor } from "@/lib/faceApi";
import { supabase } from "@/lib/supabase";
import { markClaimAsClaimed } from "@/actions/admin/markClaimAsClaimed";

// ─── Types ────────────────────────────────────────────────────────────────────

type VerificationState =
  | "loading_models"
  | "ready"
  | "scanning"
  | "success"
  | "failed"
  | "no_enrollment"
  | "confirming";

interface FaceVerificationModalProps {
  claimId: string;
  seniorId: string;
  seniorName: string;
  oscaId: string;
  hasFaceEnrolled: boolean;
  isSuperAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FaceVerificationModal({
  claimId,
  seniorId,
  seniorName,
  oscaId,
  hasFaceEnrolled,
  isSuperAdmin,
  onClose,
  onSuccess,
}: FaceVerificationModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [state, setState] = useState<VerificationState>(
    hasFaceEnrolled ? "loading_models" : "no_enrollment"
  );
  const [overrideReason, setOverrideReason] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  // Load face-api models on mount (only if enrolled)
  useEffect(() => {
    if (!hasFaceEnrolled) return;
    let cancelled = false;
    loadFaceApiModels()
      .then(() => {
        if (!cancelled) setState("ready");
      })
      .catch((err) => {
        console.error("Failed to load face-api models:", err);
        if (!cancelled) setState("no_enrollment"); // fallback gracefully
      });
    return () => {
      cancelled = true;
      // AUDIT FIX: Manually stop webcam stream on unmount
      if (webcamRef.current?.video?.srcObject) {
        const stream = webcamRef.current.video.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [hasFaceEnrolled]);

  // ─── Confirm claim (after successful face verification) ───────────────────

  const handleConfirmClaim = useCallback(async (note?: string) => {
    setIsConfirming(true);
    try {
      const res = await markClaimAsClaimed(claimId, note);
      if (res.success) {
        toast.success(`Benefit claimed for ${seniorName}.`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to mark as claimed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsConfirming(false);
    }
  }, [claimId, seniorName, onSuccess, onClose]);

  // ─── Scan handler ──────────────────────────────────────────────────────────

  const handleScan = useCallback(async () => {
    if (!webcamRef.current) return;
    setState("scanning");

    try {
      const video = webcamRef.current.video;
      if (!video) {
        setState("ready");
        toast.error("Webcam not ready. Please wait and try again.");
        return;
      }

      const descriptor = await getFaceDescriptor(video);

      if (!descriptor) {
        setState("failed");
        return;
      }

      // Call the Supabase match_face RPC
      const { data, error } = await supabase.rpc("match_face", {
        query_embedding: Array.from(descriptor),
        match_threshold: 0.6,
        match_count: 1,
      });

      if (error) {
        console.error("match_face RPC error:", error);
        setState("failed");
        return;
      }

      const matches = data as Array<{
        id: string;
        oscaId: string;
        firstName: string;
        lastName: string;
        similarity: number;
      }> | null;

      if (!matches || matches.length === 0) {
        setState("failed");
        return;
      }

      const topMatch = matches[0];

      // Verify the matched senior is the one we're claiming for
      if (topMatch.oscaId === oscaId) {
        setState("success");
        // AUDIT FIX: Automatically confirm claim upon successful face verification
        await handleConfirmClaim("Face verification completed successfully.");
      } else {
        setState("failed");
      }
    } catch (err) {
      console.error("Face scan error:", err);
      setState("failed");
    }
  }, [oscaId, handleConfirmClaim]);

  // ─── Proceed without verification (no enrollment) ─────────────────────────

  const handleProceedWithoutVerification = async () => {
    await handleConfirmClaim(
      "Claim processed without face verification — no face enrollment data found for this senior."
    );
  };

  // ─── Override claim (SuperAdmin only) ─────────────────────────────────────

  const handleOverrideClaim = async () => {
    if (!overrideReason.trim()) {
      toast.error("Please provide a reason for the override.");
      return;
    }
    await handleConfirmClaim(
      `FACE VERIFICATION OVERRIDE by SuperAdmin. Reason: ${overrideReason.trim()}`
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="fv-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden"
        style={{ boxShadow: "0 8px 40px rgba(0,107,44,0.15)" }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="fv-modal-title"
                className="text-lg font-bold text-gray-900 flex items-center gap-2"
              >
                <ScanFace className="w-5 h-5 text-[#006b2c]" />
                Verify Senior Identity
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Ask the senior to look directly at the camera.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Senior info badge */}
          <div className="mt-3 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-900">{seniorName}</p>
              <p className="text-xs text-gray-500">OSCA ID: {oscaId}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <AnimatePresence mode="wait">
            {/* ── Loading models ──────────────────────────────────────── */}
            {state === "loading_models" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-8"
              >
                <Loader2 className="w-8 h-8 animate-spin text-[#006b2c]" />
                <p className="text-sm text-gray-500 text-center">
                  Loading face recognition models...
                </p>
              </motion.div>
            )}

            {/* ── No enrollment ────────────────────────────────────────── */}
            {state === "no_enrollment" && (
              <motion.div
                key="no_enrollment"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">
                      No Face Data Enrolled
                    </p>
                    <p className="text-xs text-yellow-700 mt-0.5">
                      This senior has no face data enrolled. Face verification is not
                      available. You may proceed without it, but this action will be logged.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleProceedWithoutVerification}
                  disabled={isConfirming}
                  className="w-full py-2.5 rounded-xl bg-yellow-500 text-white font-bold text-sm hover:bg-yellow-600 transition-colors disabled:opacity-60"
                >
                  {isConfirming ? "Processing..." : "Proceed Without Verification"}
                </button>
              </motion.div>
            )}

            {/* ── Ready / Scanning ─────────────────────────────────────── */}
            {(state === "ready" || state === "scanning") && (
              <motion.div
                key="scanner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Webcam + oval overlay */}
                <div className="relative mx-auto w-64 h-48 rounded-xl overflow-hidden bg-gray-900 border-2 border-gray-200 shadow-inner">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    mirrored={true}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Oval face guide */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 256 192"
                  >
                    <defs>
                      <mask id="fv-oval-mask">
                        <rect width="256" height="192" fill="white" />
                        <ellipse cx="128" cy="96" rx="70" ry="88" fill="black" />
                      </mask>
                    </defs>
                    <rect
                      width="256"
                      height="192"
                      fill="rgba(0,0,0,0.45)"
                      mask="url(#fv-oval-mask)"
                    />
                    <ellipse
                      cx="128"
                      cy="96"
                      rx="70"
                      ry="88"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="2.5"
                      strokeDasharray="8 4"
                    />
                  </svg>
                  {/* Scanning overlay */}
                  {state === "scanning" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                      <span className="text-xs">Scanning...</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleScan}
                  disabled={state === "scanning"}
                  className="w-full py-2.5 rounded-xl bg-[#006b2c] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-800 transition-colors disabled:opacity-60"
                >
                  <ScanFace className="w-4 h-4" />
                  {state === "scanning" ? "Scanning face..." : "Scan Face"}
                </button>
              </motion.div>
            )}

            {/* ── Success ──────────────────────────────────────────────── */}
            {state === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 text-center"
              >
                <div className="flex flex-col items-center gap-2 py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </motion.div>
                  <p className="text-base font-bold text-green-700">Identity Verified</p>
                  <p className="text-sm text-gray-600">{seniorName}</p>
                </div>
                <button
                  onClick={() => handleConfirmClaim("Face verification completed successfully.")}
                  disabled={isConfirming}
                  className="w-full py-2.5 rounded-xl bg-[#006b2c] text-white font-bold text-sm hover:bg-green-800 transition-colors disabled:opacity-60 hidden"
                >
                  {isConfirming ? "Processing..." : "Confirm Claim"}
                </button>
              </motion.div>
            )}

            {/* ── Failed ───────────────────────────────────────────────── */}
            {state === "failed" && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"
                  >
                    <XCircle className="w-10 h-10 text-red-600" />
                  </motion.div>
                  <p className="text-base font-bold text-red-700">Face Does Not Match</p>
                  <p className="text-sm text-gray-500">
                    Please verify the senior&apos;s identity manually or try again.
                  </p>
                </div>

                {/* Try again */}
                <button
                  onClick={() => setState("ready")}
                  className="w-full py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                {/* SuperAdmin override */}
                {isSuperAdmin && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      SuperAdmin Override
                    </div>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Enter reason for bypassing face verification..."
                      rows={2}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                    />
                    <button
                      onClick={handleOverrideClaim}
                      disabled={isConfirming || !overrideReason.trim()}
                      className="w-full py-2 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                      {isConfirming ? "Processing..." : "Override & Claim"}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
