import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        <Link href="/login" className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-500 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service & Privacy Policy</h1>
        
        <div className="prose prose-green max-w-none text-gray-600">
          <p className="lead text-lg text-gray-900 font-medium mb-8">
            Welcome to CareLink, the official Senior Citizen Assistance Management System of the Municipality of Agoo, La Union.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using the CareLink system, you agree to be bound by these Terms of Service and all applicable laws and regulations of the Republic of the Philippines.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">2. Data Privacy Act of 2012 (RA 10173)</h2>
          <p>
            The Municipality of Agoo is committed to protecting your privacy. Any personal information collected through this system will be kept highly confidential and will be used exclusively for the processing and administration of senior citizen benefits, in strict compliance with the Data Privacy Act of 2012.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">3. Authorized Access</h2>
          <p>
            Access to this system is restricted to authorized personnel of the Municipal Social Welfare and Development Office (MSWDO) and registered senior citizens or their verified delegates. Unauthorized access or attempt to alter data is punishable by law.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">4. Accuracy of Information</h2>
          <p>
            Users are responsible for providing accurate and truthful information. Misrepresentation of facts, especially regarding eligibility for senior citizen benefits, may result in the revocation of benefits and potential legal action.
          </p>

          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">5. System Maintenance</h2>
          <p>
            The local government unit reserves the right to modify, suspend, or discontinue any aspect of the CareLink system at any time for maintenance, upgrades, or security purposes.
          </p>

          <div className="mt-12 pt-8 border-t border-gray-100 text-sm text-gray-500">
            <p>Last updated: June 2026</p>
            <p className="mt-2">For inquiries, please visit the MSWDO at the Agoo Municipal Hall or contact us at support@carelink.agoo.ph</p>
          </div>
        </div>
      </div>
    </div>
  );
}
