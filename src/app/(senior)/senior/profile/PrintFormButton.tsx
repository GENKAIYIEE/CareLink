'use client';
import { Printer } from "lucide-react";

export default function PrintFormButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#006b2c] shadow-sm ring-1 ring-inset ring-green-600 hover:bg-green-50 transition-colors print:hidden"
    >
      <Printer className="w-4 h-4 mr-1.5" /> Print My Registration Form
    </button>
  );
}
