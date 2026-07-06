"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { FaceVerificationModal } from "@/components/admin/claims/FaceVerificationModal";

interface MarkClaimedButtonProps {
  claimId: string;
  seniorId: string;
  seniorName: string;
  oscaId: string;
  hasFaceEnrolled: boolean;
  isSuperAdmin: boolean;
}

export function MarkClaimedButton({
  claimId,
  seniorId,
  seniorName,
  oscaId,
  hasFaceEnrolled,
  isSuperAdmin,
}: MarkClaimedButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClaimedLocally, setIsClaimedLocally] = useState(false);
  const router = useRouter();

  if (isClaimedLocally) {
    return (
      <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
        Claimed
      </span>
    );
  }

  return (
    <>
      <button
        id={`mark-claimed-btn-${claimId}`}
        onClick={() => setIsModalOpen(true)}
        className="text-[#006b2c] hover:text-green-900 font-semibold text-sm transition-colors"
      >
        Mark Claimed<span className="sr-only">, {seniorName}</span>
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <FaceVerificationModal
            claimId={claimId}
            seniorId={seniorId}
            seniorName={seniorName}
            oscaId={oscaId}
            hasFaceEnrolled={hasFaceEnrolled}
            isSuperAdmin={isSuperAdmin}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              setIsClaimedLocally(true);
              setIsModalOpen(false);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
