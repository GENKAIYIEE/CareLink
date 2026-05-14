"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronRight, ChevronLeft, Save } from "lucide-react";
import { updateSeniorAction } from "@/lib/actions/seniors";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

// Schema Validation
const seniorSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  civilStatus: z.string().min(1, "Civil status is required"),
  barangay: z.string().min(1, "Barangay is required"),
  bloodType: z.string().optional(),
  healthConditions: z.string().optional(),
  emergencyContactName: z.string().min(2, "Emergency contact name is required"),
  emergencyContactNum: z.string().min(11, "Valid contact number required"),
});

type SeniorFormData = z.infer<typeof seniorSchema>;

export function EditSeniorForm({ senior }: { senior: any }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const formattedDateOfBirth = senior.dateOfBirth 
    ? format(new Date(senior.dateOfBirth), "yyyy-MM-dd")
    : "";

  const { register, handleSubmit, trigger, formState: { errors } } = useForm<SeniorFormData>({
    resolver: zodResolver(seniorSchema),
    defaultValues: {
      firstName: senior.firstName || "", 
      lastName: senior.lastName || "", 
      middleName: senior.middleName || "", 
      dateOfBirth: formattedDateOfBirth, 
      gender: senior.gender || "Male", 
      civilStatus: senior.civilStatus || "Single",
      barangay: senior.barangay || "", 
      bloodType: senior.bloodType || "Unknown", 
      healthConditions: senior.healthConditions || "", 
      emergencyContactName: senior.emergencyContactName || "", 
      emergencyContactNum: senior.emergencyContactNum || ""
    }
  });

  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(["firstName", "lastName", "dateOfBirth", "gender", "civilStatus", "barangay"]);
    }
    if (isValid) setStep(step + 1);
  };

  const onSubmit = async (data: SeniorFormData) => {
    setIsSubmitting(true);
    try {
      const res = await updateSeniorAction(senior.id, data);
      if (res.success) {
        router.push(`/admin/seniors/${senior.id}`);
      } else {
        alert(res.error || "Failed to update senior");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col p-8">
      {/* Progress Bar */}
      <div className="flex items-center space-x-2 mb-8 border-b pb-6">
        {[1, 2].map((num) => (
          <div key={num} className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm ${step >= num ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {num}
            </div>
            {num < 2 && <div className={`w-12 h-1 mx-2 rounded ${step > num ? 'bg-indigo-600' : 'bg-gray-100'}`} />}
          </div>
        ))}
      </div>

      <div className="flex-1">
        <form id="edit-form" onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input {...register("firstName")} className="w-full border p-2 rounded-lg" placeholder="Juan" />
                  {errors.firstName && <span className="text-red-500 text-xs">{errors.firstName.message}</span>}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input {...register("lastName")} className="w-full border p-2 rounded-lg" placeholder="Dela Cruz" />
                  {errors.lastName && <span className="text-red-500 text-xs">{errors.lastName.message}</span>}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Middle Name</label>
                  <input {...register("middleName")} className="w-full border p-2 rounded-lg" placeholder="Optional" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input type="date" {...register("dateOfBirth")} className="w-full border p-2 rounded-lg" />
                  {errors.dateOfBirth && <span className="text-red-500 text-xs">{errors.dateOfBirth.message}</span>}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select {...register("gender")} className="w-full border p-2 rounded-lg">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Civil Status</label>
                  <select {...register("civilStatus")} className="w-full border p-2 rounded-lg">
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Barangay</label>
                  <input {...register("barangay")} className="w-full border p-2 rounded-lg" placeholder="e.g. San Miguel" />
                  {errors.barangay && <span className="text-red-500 text-xs">{errors.barangay.message}</span>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold mb-4">Health & Emergency</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Blood Type</label>
                  <select {...register("bloodType")} className="w-full border p-2 rounded-lg">
                    <option value="Unknown">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Known Health Conditions (Optional)</label>
                  <input {...register("healthConditions")} className="w-full border p-2 rounded-lg" placeholder="e.g. Hypertension, Diabetes" />
                </div>
                <div className="col-span-2 mt-4">
                  <h3 className="font-semibold border-b pb-2 mb-2">Emergency Contact</h3>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Contact Name</label>
                  <input {...register("emergencyContactName")} className="w-full border p-2 rounded-lg" placeholder="Full Name" />
                  {errors.emergencyContactName && <span className="text-red-500 text-xs">{errors.emergencyContactName.message}</span>}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium mb-1">Contact Number</label>
                  <input {...register("emergencyContactNum")} className="w-full border p-2 rounded-lg" placeholder="09XX XXX XXXX" />
                  {errors.emergencyContactNum && <span className="text-red-500 text-xs">{errors.emergencyContactNum.message}</span>}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Form Controls */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className={`px-4 py-2 flex items-center font-medium ${step === 1 ? 'text-gray-300' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </button>
        
        {step < 2 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center shadow-sm transition-colors"
          >
            Next Step <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        ) : (
          <button
            form="edit-form"
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center shadow-sm transition-colors disabled:opacity-70"
          >
            {isSubmitting ? "Saving..." : "Save Changes"} <Save className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
}
