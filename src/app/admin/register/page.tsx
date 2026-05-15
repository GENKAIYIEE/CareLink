"use client";

import { useActionState, useState } from "react";
import { registerAdmin } from "@/actions/auth/registerAdmin";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { User, Mail, ShieldCheck, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import PasswordStrengthBar from "@/components/auth/PasswordStrengthBar";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["Staff", "SuperAdmin", "BHW"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  registrationKey: z.string().min(1, "Registration key is required"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AdminRegistrationPage() {
  const [state, action, pending] = useActionState(registerAdmin, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, control, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "Staff"
    }
  });

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] overflow-hidden">
      <div className="w-full min-h-screen flex flex-col md:flex-row">
        
        {/* LEFT PANEL */}
        <div className="relative flex flex-col justify-between w-full md:w-[60%] bg-[#14532d] p-8 md:p-10 overflow-hidden">
          {/* Subtle dot grid overlay */}
          <div className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
              backgroundSize: '28px 28px',
            }}
          />
          
          {/* LGU Badge */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ring-1 ring-white/20 overflow-hidden shrink-0">
              <Image
                src="/images/logo-agoo.jpg"
                alt="Municipal Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div className="leading-tight">
              <p className="text-white/90 text-[13px] font-semibold tracking-wide">Municipality of Agoo</p>
              <p className="text-white/50 text-[11px] tracking-wider uppercase">La Union</p>
            </div>
          </div>
          
          <div className="relative z-10 flex flex-col items-start gap-5 my-10 max-w-lg mx-auto md:mx-0">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="w-16 h-16 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg"
            >
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
                <path
                  d="M24 40s-16-9.6-16-22a10 10 0 0 1 16-8 10 10 0 0 1 16 8c0 12.4-16 22-16 22z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <line x1="24" y1="18" x2="24" y2="30" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="18" y1="24" x2="30" y2="24" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-none mb-3">CareLink</h1>
              <p className="text-[#f0fdf4] text-sm leading-relaxed opacity-80">
                Senior Citizen Assistance Management System
              </p>
            </motion.div>
          </div>
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="text-[11px] text-white/30 leading-relaxed">
              © 2026 CareLink · Municipality of Agoo, La Union<br />
              Powered by LGU Agoo
            </div>
            <p className="text-xs text-white/60">
              Only authorized LGU personnel may register an account. All registrations are logged and reviewed.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full md:w-[40%] bg-[#f8fafc] flex items-center justify-center p-6 md:p-12 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, y: 24 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-md bg-white rounded-[16px] p-10 shadow-[0_4px_24px_rgba(0,0,0,0.08)] my-auto"
          >
            <div className="mb-8">
              <h2 className="text-[24px] font-[600] text-[#111827]">Create Admin Account</h2>
              <p className="text-[14px] text-gray-500 mt-1">
                Register your LGU staff account to access the CareLink system.
              </p>
            </div>

            <form action={action} className="flex flex-col gap-5">
              
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-500">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register("fullName")}
                    placeholder="e.g. Juan dela Cruz"
                    className="w-full h-[48px] pl-10 pr-4 bg-[#f1f5f9] rounded-[8px] text-[15px] focus:outline-none focus:ring-2 focus:ring-green-600 transition-shadow outline-none border-none"
                  />
                </div>
                {(errors.fullName || state?.error?.fullName) && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 mt-1">
                    {errors.fullName?.message || state?.error?.fullName}
                  </motion.p>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-500">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="e.g. juan@agoo.gov.ph"
                    className="w-full h-[48px] pl-10 pr-4 bg-[#f1f5f9] rounded-[8px] text-[15px] focus:outline-none focus:ring-2 focus:ring-green-600 transition-shadow outline-none border-none"
                  />
                </div>
                {(errors.email || state?.error?.email) && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 mt-1">
                    {errors.email?.message || state?.error?.email}
                  </motion.p>
                )}
              </div>

              {/* Role */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-500">Role</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select
                    {...register("role")}
                    className="w-full h-[48px] pl-10 pr-4 bg-[#f1f5f9] rounded-[8px] text-[15px] focus:outline-none focus:ring-2 focus:ring-green-600 transition-shadow appearance-none outline-none border-none"
                  >
                    <option value="Staff">Staff</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                    <option value="BHW">BHW</option>
                  </select>
                </div>
                {(errors.role || state?.error?.role) && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 mt-1">
                    {errors.role?.message || state?.error?.role}
                  </motion.p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-500">Password</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    className="w-full h-[48px] pl-4 pr-10 bg-[#f1f5f9] rounded-[8px] text-[15px] focus:outline-none focus:ring-2 focus:ring-green-600 transition-shadow outline-none border-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <PasswordStrengthBar control={control} name="password" />
                {(errors.password || state?.error?.password) && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 mt-1">
                    {errors.password?.message || state?.error?.password}
                  </motion.p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-500">Confirm Password</label>
                <div className="relative">
                  <input
                    {...register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full h-[48px] pl-4 pr-10 bg-[#f1f5f9] rounded-[8px] text-[15px] focus:outline-none focus:ring-2 focus:ring-green-600 transition-shadow outline-none border-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {(errors.confirmPassword || state?.error?.confirmPassword) && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 mt-1">
                    {errors.confirmPassword?.message || state?.error?.confirmPassword}
                  </motion.p>
                )}
              </div>

              {/* Registration Key */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-500">LGU Registration Key</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register("registrationKey")}
                    placeholder="Enter the LGU-issued registration key"
                    className="w-full h-[48px] pl-10 pr-4 bg-[#f1f5f9] rounded-[8px] text-[15px] focus:outline-none focus:ring-2 focus:ring-green-600 transition-shadow outline-none border-none"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">This key is issued by the Municipal IT Office.</p>
                {(errors.registrationKey || state?.error?.registrationKey) && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 mt-1">
                    {errors.registrationKey?.message || state?.error?.registrationKey}
                  </motion.p>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={pending}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-[48px] bg-green-700 hover:bg-green-800 text-white font-bold rounded-[10px] flex items-center justify-center transition-colors disabled:opacity-70 mt-2 shadow-md outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700"
              >
                {pending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </motion.button>
            </form>

            <div className="mt-8 text-center">
              <span className="text-sm text-gray-500">Already have an account? </span>
              <Link href="/admin/login" className="text-sm text-green-600 font-semibold hover:underline">
                Sign in →
              </Link>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
