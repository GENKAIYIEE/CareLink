'use client';

import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, Loader2, Upload, AlertCircle } from 'lucide-react';
import { uploadMonthlyPictureAction } from '@/lib/actions/seniors';
import { uploadMonthlyPictureToStorage } from '@/lib/actions/upload';

interface Props {
  seniorId: string;
  lastPictureUpdate: Date | null;
}

export default function MonthlyPictureUpload({ seniorId, lastPictureUpdate }: Props) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  // Check if update is needed (older than 30 days or never updated)
  const isUpdateNeeded = !lastPictureUpdate || 
    (new Date().getTime() - new Date(lastPictureUpdate).getTime() > 30 * 24 * 60 * 60 * 1000);

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setIsCameraOpen(false);
    }
  }, [webcamRef]);

  const handleRetake = () => {
    setCapturedImage(null);
    setIsCameraOpen(true);
  };

  const handleUpload = async () => {
    if (!capturedImage) return;
    setIsUploading(true);
    setError(null);

    // Step 1: Upload base64 image to Supabase Storage → get a public URL
    const storageResult = await uploadMonthlyPictureToStorage(seniorId, capturedImage);
    if (!storageResult.success || !storageResult.url) {
      setError(storageResult.error || 'Failed to upload image. Please try again.');
      setIsUploading(false);
      return;
    }

    // Step 2: Save the public URL to the database (not base64)
    const result = await uploadMonthlyPictureAction(seniorId, storageResult.url);
    if (result.success) {
      setSuccess(true);
      setCapturedImage(null);
      setTimeout(() => setSuccess(false), 5000);
    } else {
      setError(result.error || 'Upload failed.');
    }
    setIsUploading(false);
  };

  if (!isUpdateNeeded && !success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
        <div className="p-3 bg-green-100 rounded-full shrink-0">
          <CheckCircle className="w-6 h-6 text-green-700" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-900">Identity Verified for this Month</h3>
          <p className="text-sm text-green-700 mt-1">
            Thank you! Your monthly picture was updated on {lastPictureUpdate ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(lastPictureUpdate)) : 'recently'}. 
            You do not need to upload another picture until next month.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-amber-100 rounded-full shrink-0">
          <AlertCircle className="w-6 h-6 text-amber-700" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-amber-900">Monthly Verification Required</h3>
          <p className="text-sm text-amber-700 mt-1">
            Please capture a recent picture of yourself to verify your active status for this month&apos;s benefits.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Successfully updated your monthly picture!
        </div>
      )}

      <div className="space-y-4 flex flex-col items-center">
        {!isCameraOpen && !capturedImage && (
          <button
            onClick={() => setIsCameraOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#006b2c] hover:bg-green-800 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <Camera className="w-5 h-5" />
            Open Camera
          </button>
        )}

        {isCameraOpen && (
          <div className="w-full max-w-sm flex flex-col items-center gap-4">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-inner border-4 border-white bg-black">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                className="w-full object-cover aspect-square"
                mirrored={true}
              />
              <div className="absolute inset-0 border-[4px] border-dashed border-white/40 pointer-events-none rounded-2xl m-4"></div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsCameraOpen(false)}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCapture}
                className="px-6 py-2.5 bg-[#006b2c] hover:bg-green-800 text-white rounded-xl font-medium transition-colors"
              >
                Take Picture
              </button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="w-full max-w-sm flex flex-col items-center gap-4">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-inner border-4 border-white bg-black">
              <img src={capturedImage} alt="Captured preview" className="w-full aspect-square object-cover" />
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleRetake}
                disabled={isUploading}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Retake
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 py-3 bg-[#006b2c] hover:bg-green-800 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Submit Picture
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
