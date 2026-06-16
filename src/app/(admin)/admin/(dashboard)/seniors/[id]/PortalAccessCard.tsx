"use client";

import { useState, useTransition } from "react";
import { KeyRound, ShieldAlert, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { resetSeniorPasswordAction } from "@/lib/actions/seniors";

interface PortalAccessCardProps {
  senior: {
    id: string;
    oscaId: string;
    firstName: string;
    lastName: string;
    passwordHash: string | null;
  };
}

export default function PortalAccessCard({ senior }: PortalAccessCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [customPassword, setCustomPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState("");

  const fullName = `${senior.firstName} ${senior.lastName}`;
  const hasPassword = !!senior.passwordHash;

  const handleOpenModal = () => {
    if (customPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (customPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        const result = await resetSeniorPasswordAction(senior.id, customPassword);

        if (result.success) {
          setSuccessMessage("Password updated successfully.");
          setCustomPassword("");
          setConfirmPassword("");
          setIsModalOpen(false); 
        } else {
          setError(result.error || "Failed to reset password.");
        }
      } catch (err) {
        setError("An unexpected error occurred.");
      }
    });
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <KeyRound className="w-5 h-5 mr-2 text-indigo-600" />
            Portal Access
          </h2>
          <div>
            {hasPassword ? (
              <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Password Set
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> No Password Set
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-8 max-w-[560px]">
          {/* Current Portal Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Login Username
            </label>
            <input
              type="text"
              readOnly
              value={senior.oscaId}
              className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-sm text-gray-500">
              This is the permanent username and cannot be changed.
            </p>
          </div>

          {/* Error Message Display */}
          {error && !isModalOpen && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Messages */}
          {successMessage && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-green-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Reset Password Options */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2 border-b pb-2">Set New Password</h3>
            <p className="text-sm text-gray-500 mb-6">
              Set a new password for this senior. Write it down on a welcome slip and hand it to them in person.
            </p>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password (min. 6 characters)"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#006b2c] focus:ring-[#006b2c] sm:text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#006b2c] focus:ring-[#006b2c] sm:text-sm pr-10"
                />
              </div>
              
              <button
                onClick={handleOpenModal}
                disabled={!customPassword || !confirmPassword || isPending}
                className="w-full bg-[#006b2c] hover:bg-[#005a24] text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full sm:p-6 mx-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <ShieldAlert className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Confirm Password Reset
                </h3>
                <div className="mt-2 text-sm text-gray-500">
                  <p className="mb-2">
                    Are you sure you want to reset the password for:
                  </p>
                  <p className="font-semibold text-gray-900 mb-1">{fullName}</p>
                  <p className="text-gray-700 mb-4">OSCA ID: <span className="font-mono">{senior.oscaId}</span></p>
                  
                  <p>The system will save the new custom password you entered. This action will be logged.</p>
                  
                  {error && (
                    <p className="mt-2 text-red-600 text-sm">{error}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isPending ? "Resetting..." : "Confirm & Reset"}
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
