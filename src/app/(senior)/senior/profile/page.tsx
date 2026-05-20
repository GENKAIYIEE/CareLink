import React from 'react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { User, AlertCircle, Phone, MapPin, Calendar, Heart, Shield } from 'lucide-react';

export default async function SeniorProfilePage() {
  const session = await getSession();
  if (!session || session.role !== 'SENIOR') return null;

  const senior = await prisma.senior.findUnique({
    where: { id: session.userId },
  });

  if (!senior) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
          <AlertCircle className="w-4 h-4" />
          <span>To update your information, contact your OSCA office.</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {senior.firstName} {senior.middleName} {senior.lastName}
              </h2>
              <p className="text-gray-500">OSCA ID: {senior.oscaId}</p>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${senior.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              Status: {senior.status}
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
    </div>
  );
}
