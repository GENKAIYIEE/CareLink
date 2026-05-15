"use server";

import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { format } from "date-fns";
import { redirect } from "next/navigation";

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

export type RegisterAdminResult = {
  error?: {
    fullName?: string[];
    email?: string[] | string;
    role?: string[];
    password?: string[];
    confirmPassword?: string[];
    registrationKey?: string[] | string;
  };
};

export async function registerAdmin(prevState: any, formData: FormData): Promise<RegisterAdminResult> {
  const data = Object.fromEntries(formData.entries());
  
  const validatedFields = registerSchema.safeParse(data);
  
  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }
  
  const { fullName, email, role, password, registrationKey } = validatedFields.data;
  
  if (registrationKey !== process.env.ADMIN_REGISTRATION_KEY) {
    return { error: { registrationKey: "Invalid registration key." } };
  }
  
  const existingUser = await prisma.admin.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    return { error: { email: "This email is already registered." } };
  }
  
  const passwordHash = await bcrypt.hash(password, 12);
  
  await prisma.admin.create({
    data: {
      email,
      fullName,
      passwordHash,
      role,
    }
  });
  
  const timestamp = format(new Date(), "MMM dd, yyyy – HH:mm");
  console.log(`Admin registered: ${email} at ${timestamp}`);
  
  redirect("/admin/login?registered=true");
}
