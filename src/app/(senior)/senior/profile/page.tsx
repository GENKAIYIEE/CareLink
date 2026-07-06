import React from 'react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { User, AlertCircle, Phone, MapPin, Calendar, Heart, Shield } from 'lucide-react';
import { LiveUpdate } from '@/components/senior/LiveUpdate';
import MonthlyPictureUpload from './MonthlyPictureUpload';
import PrintFormButton from './PrintFormButton';
import { getEffectiveStatus } from '@/lib/utils/status';
import { format } from 'date-fns';

export default async function SeniorProfilePage() {
  const session = await getSession();
  if (!session || session.role !== 'SENIOR') return null;

  const senior = await prisma.senior.findUnique({
    where: { id: session.userId },
  });

  if (!senior) return null;

  const age = senior.dateOfBirth ? new Date().getFullYear() - new Date(senior.dateOfBirth).getFullYear() : 'N/A';

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-12 print:p-0 print:max-w-none print:m-0 print:space-y-0 print:block">
      <LiveUpdate interval={30000} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
            <AlertCircle className="w-4 h-4" />
            <span>To update your information, contact your OSCA office.</span>
          </div>
        </div>
        <PrintFormButton />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:hidden">
        {/* Header Cover */}
        <div className="h-32 bg-[#006b2c] relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center overflow-hidden text-3xl font-bold text-gray-300">
              {senior.photoUrl ? (
                <img src={senior.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{senior.firstName[0]}{senior.lastName[0]}</span>
              )}
            </div>
          </div>
        </div>

        <div className="pt-16 px-8 pb-8">
          <div className="mb-8">
            <MonthlyPictureUpload seniorId={senior.id} lastPictureUpdate={senior.lastPictureUpdate} />
          </div>

          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {senior.firstName} {senior.middleName} {senior.lastName}
              </h2>
              <p className="text-gray-500">OSCA ID: {senior.oscaId}</p>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
              getEffectiveStatus(senior) === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 
              getEffectiveStatus(senior).includes('Inactive') ? 'bg-red-50 text-red-700 border-red-200' : 
              'bg-gray-50 text-gray-700 border-gray-200'
            }`}>
              Status: {getEffectiveStatus(senior)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <User className="w-5 h-5 text-[#006b2c]" /> Personal Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Date of Birth</p>
                  <p className="text-gray-900 font-medium flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(senior.dateOfBirth))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Gender</p>
                  <p className="text-gray-900 font-medium mt-1">{senior.gender || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Civil Status</p>
                  <p className="text-gray-900 font-medium mt-1">{senior.civilStatus || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Contact & Health */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#006b2c]" /> Contact & Health
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Barangay</p>
                  <p className="text-gray-900 font-medium flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {senior.barangay}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Contact Number</p>
                  <p className="text-gray-900 font-medium flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {senior.contactNumber || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Blood Type</p>
                  <p className="text-gray-900 font-medium flex items-center gap-2 mt-1">
                    <Heart className="w-4 h-4 text-gray-400" />
                    {senior.bloodType || 'Not specified'}
                  </p>
                </div>
                {senior.healthConditions && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Health Conditions</p>
                    <p className="text-gray-900 font-medium mt-1">{senior.healthConditions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="md:col-span-2 bg-red-50 rounded-xl p-6 border border-red-100 mt-4">
              <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-red-700/70 font-medium">Name</p>
                  <p className="text-red-900 font-medium mt-1">{senior.emergencyContactName || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-red-700/70 font-medium">Contact Number</p>
                  <p className="text-red-900 font-medium mt-1">{senior.emergencyContactNum || 'Not specified'}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* PRINTABLE A4 FORM (Hidden on screen, visible on print) */}
      <div id="print-a4-form" className="hidden print:flex print:flex-col print:w-[210mm] print:h-[260mm] print:mx-auto print:bg-white text-black p-8 relative">
        
        {/* HEADER */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-widest mb-1">Office of the Senior Citizens Affairs (OSCA)</h1>
          <h2 className="text-xl font-bold mt-1">Registration & Benefit Form</h2>
          <p className="mt-2 text-base font-medium">Barangay: {senior.barangay}</p>
        </div>

        {/* MIDDLE CONTENT - flex-1 pushes the footer down */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 text-base pr-8">
              
              {/* ID & Status */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-base bg-gray-50 p-3 border border-gray-200">
                <p><strong className="text-gray-800">OSCA ID:</strong> <span className="font-mono text-lg ml-2">{senior.oscaId}</span></p>
                <p><strong className="text-gray-800">Status:</strong> <span className={`uppercase tracking-wider ml-2 font-bold ${getEffectiveStatus(senior).includes('Inactive') ? 'text-red-600' : 'text-green-600'}`}>{getEffectiveStatus(senior)}</span></p>
              </div>
              
              {/* Personal Info */}
              <div className="border-b-2 border-gray-400 pb-2 mb-4 mt-6">
                <h3 className="font-bold uppercase text-gray-800 tracking-wide text-lg">I. Personal Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-base">
                <p><strong>First Name:</strong> <span className="ml-2 border-b border-gray-300 pb-1 px-2">{senior.firstName}</span></p>
                <p><strong>Last Name:</strong> <span className="ml-2 border-b border-gray-300 pb-1 px-2">{senior.lastName}</span></p>
                <p><strong>Middle Name:</strong> <span className="ml-2 border-b border-gray-300 pb-1 px-2">{senior.middleName || ''}</span></p>
                <p><strong>Date of Birth:</strong> <span className="ml-2 border-b border-gray-300 pb-1 px-2">{senior.dateOfBirth ? format(new Date(senior.dateOfBirth), 'MMMM d, yyyy') : 'N/A'}</span></p>
                <p><strong>Age:</strong> <span className="ml-2 border-b border-gray-300 pb-1 px-2">{age}</span></p>
                <p><strong>Gender:</strong> <span className="ml-2 border-b border-gray-300 pb-1 px-2">{senior.gender}</span></p>
                <p className="col-span-2"><strong>Civil Status:</strong> <span className="ml-2 border-b border-gray-300 pb-1 px-2">{senior.civilStatus}</span></p>
                <p className="col-span-2"><strong>Contact Number:</strong> <span className="ml-2 border-b border-gray-300 pb-1 px-2">{senior.contactNumber || 'N/A'}</span></p>
              </div>
            </div>

            {/* 2x2 Picture */}
            <div className="border-2 border-black w-36 h-36 flex items-center justify-center bg-gray-50 shrink-0">
              <span className="text-xs text-gray-400 font-medium tracking-widest">2x2 PICTURE</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="border-b-2 border-gray-400 pb-2 mb-4">
              <h3 className="font-bold uppercase text-gray-800 tracking-wide text-lg">II. Medical & Emergency</h3>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-base">
              <p><strong>Blood Type:</strong> <span className="ml-2 border-b border-gray-300 pb-1 px-2">{senior.bloodType}</span></p>
              <p><strong>Health Conditions:</strong> <span className="ml-2 border-b border-gray-300 pb-1 px-2">{senior.healthConditions || 'None'}</span></p>
              <p className="col-span-2 mt-2"><strong>Emergency Contact Name:</strong> <span className="ml-2 border-b border-gray-300 pb-1 px-2">{senior.emergencyContactName}</span></p>
              <p className="col-span-2"><strong>Emergency Contact Number:</strong> <span className="ml-2 border-b border-gray-300 pb-1 px-2">{senior.emergencyContactNum}</span></p>
            </div>
          </div>
        </div>

        {/* CLAIMING SIGNATURE SECTION */}
        <div className="mt-auto border-t-[3px] border-black pt-6">
          <h3 className="font-bold uppercase text-center mb-4 text-lg tracking-widest">Certification & Verification</h3>
          <p className="text-sm text-justify mb-8 leading-relaxed italic text-gray-700">
            "I hereby certify that all information provided above is true and correct to the best of my knowledge. 
            I fully understand that any false statement or misrepresentation may result in the immediate suspension or cancellation of my OSCA benefits."
          </p>

          <div className="flex justify-between items-end px-12 pb-8">
            <div className="flex flex-col items-center">
              <div className="border-b-2 border-black w-64 mb-3"></div>
              <span className="text-sm uppercase font-bold tracking-wider">Signature over Printed Name</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="border-2 border-black w-28 h-28 mb-3 flex items-center justify-center bg-gray-50">
                <span className="text-xs text-gray-400 font-medium">THUMBMARK</span>
              </div>
              <span className="text-sm uppercase font-bold tracking-wider">Right Thumbmark</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
