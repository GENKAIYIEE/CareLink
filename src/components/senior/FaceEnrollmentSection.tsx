"use client";

import { useState } from "react";
import { ScanFace, CheckCircle } from "lucide-react";
import { FaceEnrollmentModal } from "./FaceEnrollmentModal";

interface FaceEnrollmentSectionProps {
  seniorId: string;
  hasFaceEnrolled: boolean;
}

export function FaceEnrollmentSection({ seniorId, hasFaceEnrolled: initialEnrolled }: FaceEnrollmentSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(initialEnrolled);

  return (
    <div className="bg-white rounded-lg p-5 border border-gray-200 mt-6">
      <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${isEnrolled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            <ScanFace className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Face Biometric Data</p>
            {isEnrolled ? (
              <p className="text-green-600 font-semibold text-lg flex items-center gap-1.5 mt-0.5">
                <CheckCircle className="w-5 h-5" /> Registered
              </p>
            ) : (
              <p className="text-gray-900 font-semibold text-lg mt-0.5">Not Registered</p>
            )}
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              {isEnrolled 
                ? "Your face is enrolled for quick identity verification during benefit claims."
                : "Register your face data to enable quick and secure verification when claiming benefits."}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className={`shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            isEnrolled 
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              : "bg-[#006b2c] text-white shadow hover:bg-green-800"
          }`}
        >
          {isEnrolled ? "Update Face Data" : "Enroll Face Now"}
        </button>
      </div>

      <FaceEnrollmentModal 
        seniorId={seniorId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={() => setIsEnrolled(true)}
      />
    </div>
  );
}
