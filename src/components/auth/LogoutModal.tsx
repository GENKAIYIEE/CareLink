'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, Loader2 } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (formData?: FormData) => void | Promise<void>;
  portalName?: string;
  userName?: string;
}

export default function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  portalName = 'Portal',
  userName,
}: LogoutModalProps) {
  const [isPending, setIsPending] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
          aria-labelledby="logout-modal-title"
        >
          {/* Backdrop with blur and smooth fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !isPending && onClose()}
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden p-6 text-center z-10"
            style={{ boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.3)' }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-5 shadow-inner">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
                <LogOut className="w-6 h-6 translate-x-0.5" />
              </div>
            </div>

            {/* Title */}
            <h3 id="logout-modal-title" className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
              Sign Out of CareLink?
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-500 mb-6 leading-relaxed px-2">
              {userName ? (
                <>
                  You are about to sign out as <span className="font-semibold text-gray-700">{userName}</span> from the{' '}
                  <span className="font-semibold text-gray-700">{portalName}</span>.
                </>
              ) : (
                <>
                  Are you sure you want to end your current session in the{' '}
                  <span className="font-semibold text-gray-700">{portalName}</span>?
                </>
              )}
              {' '}You will need to log in again to access your account.
            </p>

            {/* Action Buttons */}
            <form action={onConfirm} onSubmit={() => setIsPending(true)} className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
              >
                Stay Logged In
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold text-sm shadow-md shadow-red-500/25 hover:from-red-700 hover:to-rose-700 hover:shadow-lg hover:shadow-red-500/35 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Yes, Sign Out</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
