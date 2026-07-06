'use client';
import { Printer } from "lucide-react";

export default function PrintFormButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors print:hidden"
    >
      <Printer className="w-4 h-4 mr-1.5 text-gray-500" /> Print A4 Form
    </button>
  );
}
