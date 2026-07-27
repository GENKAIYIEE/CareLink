"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Printer,
  Camera,
  ScanFace,
} from "lucide-react";
import { toast } from "sonner";
import { registerSeniorAction } from "@/lib/actions/seniors";
import { uploadPhotoAction } from "@/lib/actions/upload";
import { PhotoEditor, CropState } from "./PhotoEditor";
import { FaceEnrollmentStep } from "@/components/admin/registration/FaceEnrollmentStep";
import { supabase } from "@/lib/supabase";

// ─── Schema ──────────────────────────────────────────────────────────────────

const seniorSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  middleName: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required").refine((dateStr) => {
    const dob = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 60;
  }, { message: "Applicant must be at least 60 years old to register." }),
  gender: z.string().min(1, "Gender is required"),
  civilStatus: z.string().min(1, "Civil status is required"),
  barangay: z.string().min(1, "Barangay is required"),
  bloodType: z.string().optional(),
  healthConditions: z.string().optional(),
  emergencyContactName: z.string().min(2, "Emergency contact name is required"),
  emergencyContactNum: z.string().min(11, "Valid contact number required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type SeniorFormData = z.infer<typeof seniorSchema>;

// ─── Wizard steps ─────────────────────────────────────────────────────────────
// 1 → Personal Info
// 2 → Health & Emergency
// 3 → Face Enrollment
// 4 → Success / Print

export function RegistrationForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    id: string;
    oscaId: string;
    password: string;
  } | null>(null);

  // Photo state
  const [rawImageFile, setRawImageFile] = useState<File | null>(null);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [imageRatio, setImageRatio] = useState<number | null>(null);
  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, zoom: 1 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Face enrollment state
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [faceEnrolled, setFaceEnrolled] = useState<boolean | null>(null); // null = not attempted yet

  // ─── Photo handlers ────────────────────────────────────────────────────────

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 2MB.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPG or PNG image.");
      return;
    }

    setRawImageFile(file);
    const url = URL.createObjectURL(file);
    setRawImageUrl(url);

    const img = new Image();
    img.onload = () => {
      setImageRatio(img.naturalWidth / img.naturalHeight);
      setCrop({ x: 0, y: 0, zoom: 1 });
    };
    img.src = url;
  };

  const generateCroppedBlob = async (): Promise<Blob | null> => {
    if (!rawImageUrl || !imageRatio) return null;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        canvas.width = 600;
        canvas.height = 600;

        const coverWidthRatio = imageRatio > 1 ? imageRatio : 1;
        const coverHeightRatio = imageRatio > 1 ? 1 : 1 / imageRatio;

        const drawWidth = canvas.width * coverWidthRatio * crop.zoom;
        const drawHeight = canvas.height * coverHeightRatio * crop.zoom;

        const drawX = (crop.x / 100) * canvas.width;
        const drawY = (crop.y / 100) * canvas.height;

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
      };
      img.src = rawImageUrl;
    });
  };

  // ─── Form ──────────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<SeniorFormData>({
    resolver: zodResolver(seniorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      dateOfBirth: "",
      gender: "Male",
      civilStatus: "Single",
      barangay: "",
      healthConditions: "",
      emergencyContactName: "",
      emergencyContactNum: "",
      email: "",
    },
  });

  const formData = watch();
  const age = formData.dateOfBirth
    ? new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear()
    : 0;

  // ─── Navigation ───────────────────────────────────────────────────────────

  const handleRegistration = async (data: SeniorFormData) => {
    setIsSubmitting(true);
    try {
      // 1. Upload photo
      let photoUrl = null;
      if (rawImageUrl) {
        const blob = await generateCroppedBlob();
        if (blob) {
          const file = new File([blob], "cropped-photo.jpg", { type: "image/jpeg" });
          const fd = new FormData();
          fd.append("file", file);
          const uploadRes = await uploadPhotoAction(fd);
          if (uploadRes.success) {
            photoUrl = uploadRes.url;
          } else {
            toast.error("Photo upload failed. Please try again.");
            setIsSubmitting(false);
            return;
          }
        }
      }

      // 2. Register senior (creates DB row, returns id + oscaId + password)
      const submitData = { ...data, photoUrl };
      const res = await registerSeniorAction(submitData);

      if (!res.success || !res.data) {
        toast.error("Registration failed. Please check the form and try again.");
        setIsSubmitting(false);
        return;
      }

      toast.success("Senior citizen registered successfully.");
      setSuccessData(res.data);
      setStep(3); // Move to Face Enrollment step
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger([
        "firstName",
        "lastName",
        "dateOfBirth",
        "gender",
        "civilStatus",
        "barangay",
      ]);
      if (isValid) setStep(2);
    } else if (step === 2) {
      isValid = await trigger(["emergencyContactName", "emergencyContactNum"]);
      if (isValid) {
        await handleRegistration(formData);
      }
    }
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const TOTAL_STEPS = 3; // progress bar steps (not counting success)
  const progressStep = Math.min(step, TOTAL_STEPS);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px] print:block">
      {/* LEFT PANE: Form Wizard */}
      <div className="p-8 border-r border-gray-100 flex flex-col print:hidden">
        {/* Progress Bar */}
        {step < 4 && (
          <div className="flex items-center space-x-2 mb-8">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    progressStep >= num ? "bg-[#006b2c] text-white" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 rounded ${
                      progressStep > num ? "bg-[#006b2c]" : "bg-gray-100"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1">
          <form id="registration-form" onSubmit={handleSubmit(handleRegistration)}>
            {/* ── STEP 1: Personal Information ─────────────────────────── */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h2 className="text-xl font-bold mb-4">Personal Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium mb-1">First Name</label>
                    <input
                      {...register("firstName")}
                      className="w-full border p-2 rounded-lg"
                      placeholder="Juan"
                    />
                    {errors.firstName && (
                      <span className="text-red-500 text-xs">{errors.firstName.message}</span>
                    )}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium mb-1">Last Name</label>
                    <input
                      {...register("lastName")}
                      className="w-full border p-2 rounded-lg"
                      placeholder="Dela Cruz"
                    />
                    {errors.lastName && (
                      <span className="text-red-500 text-xs">{errors.lastName.message}</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      {...register("email")}
                      className="w-full border p-2 rounded-lg"
                      placeholder="juan.delacruz@example.com"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">If the senior does not have an email, you may use their delegate's email.</p>
                    {errors.email && (
                      <span className="text-red-500 text-xs">{errors.email.message}</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Middle Name</label>
                    <input
                      {...register("middleName")}
                      className="w-full border p-2 rounded-lg"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium mb-1">Date of Birth</label>
                    <input
                      type="date"
                      {...register("dateOfBirth")}
                      className="w-full border p-2 rounded-lg"
                    />
                    {errors.dateOfBirth && (
                      <span className="text-red-500 text-xs">{errors.dateOfBirth.message}</span>
                    )}
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
                    <input
                      {...register("barangay")}
                      className="w-full border p-2 rounded-lg"
                      placeholder="e.g. San Miguel"
                    />
                    {errors.barangay && (
                      <span className="text-red-500 text-xs">{errors.barangay.message}</span>
                    )}
                  </div>

                  {/* Photo upload */}
                  <div className="col-span-2 mt-4">
                    <h3 className="text-sm font-medium mb-2 border-b pb-2">Photo (Optional)</h3>
                    {!rawImageUrl ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full max-w-[280px] h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-green-700 cursor-pointer transition-colors"
                      >
                        <Camera className="w-8 h-8 mb-2 text-gray-400" />
                        <span className="font-medium text-sm">Upload Photo</span>
                        <span className="text-[10px] text-gray-400 mt-1">
                          JPEG, PNG or WEBP • Max 2MB
                        </span>
                      </div>
                    ) : (
                      <PhotoEditor
                        imageUrl={rawImageUrl}
                        imageRatio={imageRatio!}
                        crop={crop}
                        onChangeCrop={setCrop}
                        onReset={() => setCrop({ x: 0, y: 0, zoom: 1 })}
                        onChangePhoto={() => fileInputRef.current?.click()}
                      />
                    )}
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Health & Emergency ───────────────────────────── */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h2 className="text-xl font-bold mb-4">Health &amp; Emergency</h2>
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
                    <label className="block text-sm font-medium mb-1">
                      Known Health Conditions (Optional)
                    </label>
                    <input
                      {...register("healthConditions")}
                      className="w-full border p-2 rounded-lg"
                      placeholder="e.g. Hypertension, Diabetes"
                    />
                  </div>
                  <div className="col-span-2 mt-4">
                    <h3 className="font-semibold border-b pb-2 mb-2">Emergency Contact</h3>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium mb-1">Contact Name</label>
                    <input
                      {...register("emergencyContactName")}
                      className="w-full border p-2 rounded-lg"
                      placeholder="Full Name"
                    />
                    {errors.emergencyContactName && (
                      <span className="text-red-500 text-xs">
                        {errors.emergencyContactName.message}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium mb-1">Contact Number</label>
                    <input
                      {...register("emergencyContactNum")}
                      className="w-full border p-2 rounded-lg"
                      placeholder="09XX XXX XXXX"
                    />
                    {errors.emergencyContactNum && (
                      <span className="text-red-500 text-xs">
                        {errors.emergencyContactNum.message}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </form>

          {/* ── STEP 3: Face Enrollment ───────────────────────────────── */}
            {step === 3 && successData?.id && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <FaceEnrollmentStep
                  seniorId={successData.id}
                  onComplete={(enrolled) => {
                    setFaceEnrolled(enrolled);
                    setStep(4);
                  }}
                />
              </motion.div>
            )}

            {/* ── STEP 4: Success ───────────────────────────────────────── */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
                <p className="text-gray-500 mb-2">The senior citizen profile has been created.</p>

                {faceEnrolled === true && (
                  <p className="text-xs text-green-600 mb-6 flex items-center justify-center gap-1">
                    <ScanFace className="w-3.5 h-3.5" /> Face data enrolled — liveness
                    verification is active.
                  </p>
                )}
                {faceEnrolled === false && (
                  <p className="text-xs text-yellow-600 mb-6">
                    ⚠ No face data enrolled — verification will be bypassed for this senior.
                  </p>
                )}

                <div className="bg-green-50 border border-green-200 rounded-xl p-4 inline-block text-left mb-8">
                  <p className="text-sm text-green-800 font-medium mb-1">OSCA ID No.</p>
                  <p className="text-xl font-bold text-green-900 mb-3">{successData?.oscaId}</p>

                  <p className="text-sm text-green-800 font-medium mb-1">Portal Password</p>
                  <div className="bg-white px-3 py-2 rounded-lg border border-green-200 font-mono text-lg flex items-center space-x-4">
                    <span>{successData?.password}</span>
                  </div>
                  <p className="text-xs text-green-600 mt-2">Write this password down on the welcome slip.</p>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setSuccessData(null);
                      setFaceDescriptor(null);
                      setFaceEnrolled(null);
                      setRawImageFile(null);
                      setRawImageUrl(null);
                    }}
                    className="px-6 py-2 border rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Register Another
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-6 py-2 bg-[#006b2c] text-white rounded-lg hover:bg-green-800 font-medium flex items-center shadow-sm"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print ID Card
                  </button>
                </div>
              </motion.div>
            )}
        </div>

        {/* Form Controls */}
        {step < 3 && (
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between">
            <button
              type="button"
              onClick={() => step === 1 ? router.push('/admin/seniors') : setStep(step - 1)}
              className="px-4 py-2 flex items-center font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </button>

            {/* Steps 1–2: Next / Register */}
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#006b2c] text-white rounded-lg hover:bg-green-800 font-medium flex items-center shadow-sm transition-colors disabled:opacity-70"
            >
              {isSubmitting ? "Processing..." : step === 2 ? "Register Senior" : "Next Step"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANE: Live ID Preview */}
      <div
        className={`bg-gray-50 p-8 flex items-center justify-center ${
          step === 4 ? "print:p-0 print:bg-white print:block" : "print:hidden"
        }`}
      >
        <div className="w-full max-w-[340px] print:max-w-none print:w-[3.375in] print:h-[2.125in]">
          <p className="text-sm font-semibold text-gray-400 mb-4 text-center print:hidden">
            Live ID Card Preview
          </p>

          {/* ID CARD */}
          <div
            id="print-id-card"
            className="bg-white shadow-xl overflow-hidden border border-gray-200 relative print:shadow-none print:border-black print:rounded-none"
            style={{ aspectRatio: "85.6/53.98" }}
          >
            {/* Header */}
            <div className="print-card-header bg-indigo-900 text-white py-2 px-2 sm:py-2.5 flex items-center justify-center text-center print:py-2">
              <div className="w-full">
                <p className="text-[10px] sm:text-xs font-bold leading-none uppercase mb-[2px]">
                  Republic of the Philippines
                </p>
                <p className="text-[7px] sm:text-[9px] text-indigo-200 uppercase tracking-wider leading-none">
                  Municipality of Agoo, La Union
                </p>
                <p className="text-xs sm:text-sm font-bold text-yellow-400 mt-[4px] uppercase leading-none">
                  Senior Citizen ID
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="print-card-body p-3 pb-[24px] sm:p-4 sm:pb-[28px] flex items-start gap-3 sm:gap-4 print:p-4">
              {/* Photo Area */}
              <div className="print-photo-box w-20 h-20 sm:w-[84px] sm:h-[84px] bg-gray-100 border border-gray-300 shadow-sm flex flex-col items-center justify-center text-gray-400 shrink-0 print:border-gray-800 relative overflow-hidden">
                {rawImageUrl && imageRatio ? (
                  <img
                    src={rawImageUrl}
                    alt="Preview"
                    className="absolute max-w-none pointer-events-none"
                    style={{
                      left: `${crop.x}%`,
                      top: `${crop.y}%`,
                      width: `${(imageRatio > 1 ? imageRatio : 1) * crop.zoom * 100}%`,
                      height: `${(imageRatio > 1 ? 1 : 1 / imageRatio) * crop.zoom * 100}%`,
                      transformOrigin: "0 0",
                    }}
                  />
                ) : (
                  <>
                    <Camera className="w-6 h-6 mb-1 print:hidden" />
                    <span className="text-[8px] print:hidden">Photo</span>
                  </>
                )}
              </div>

              {/* Details Area */}
              <div className="print-fields flex-1 min-w-0 flex flex-col gap-[3px] sm:gap-1">
                <div>
                  <p className="text-[7px] text-gray-500 uppercase leading-none mb-[1px]">
                    ID Number
                  </p>
                  <p className="font-mono font-bold text-red-600 text-[12px] sm:text-[14px] leading-none">
                    {successData?.oscaId || "OSCA-XXXX-XXXX"}
                  </p>
                </div>

                <div>
                  <p className="text-[7px] text-gray-500 uppercase leading-none mb-[1px]">Name</p>
                  <p className="font-bold text-gray-900 text-[11px] sm:text-[12px] uppercase leading-tight truncate">
                    {formData.lastName || "LASTNAME"}, {formData.firstName || "FIRSTNAME"}
                  </p>
                  <p className="text-[8px] sm:text-[9px] text-gray-600 uppercase mt-[1px] truncate">
                    {formData.middleName || "M.I."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <p className="text-[7px] text-gray-500 uppercase leading-none mb-[1px]">DOB</p>
                    <p className="text-[9px] sm:text-[10px] font-semibold leading-none">
                      {formData.dateOfBirth || "--/--/----"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[7px] text-gray-500 uppercase leading-none mb-[1px]">
                      Blood
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-semibold text-red-600 leading-none">
                      {formData.bloodType || "--"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[7px] text-gray-500 uppercase leading-none mb-[1px]">
                    Barangay
                  </p>
                  <p className="text-[9px] sm:text-[10px] font-semibold truncate uppercase leading-none">
                    {formData.barangay || "BRGY NAME"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer / Emergency Contact */}
            <div className="print-emergency absolute bottom-0 left-0 right-0 bg-yellow-400 py-1 px-2 text-center print:py-1 z-10">
              <p className="text-[6px] font-bold text-yellow-900 uppercase leading-none mb-[1px]">
                In case of emergency
              </p>
              <p className="text-[8px] font-bold text-black leading-none truncate">
                {formData.emergencyContactName || "NAME"} -{" "}
                {formData.emergencyContactNum || "NUMBER"}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-6 text-center print:hidden">
            The preview automatically updates as you type.
          </p>
        </div>
      </div>
    </div>
  );
}
