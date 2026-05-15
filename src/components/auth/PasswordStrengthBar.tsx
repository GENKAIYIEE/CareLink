"use client";

import { useWatch, Control, FieldValues, Path } from "react-hook-form";
import { motion } from "framer-motion";

interface PasswordStrengthBarProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
}

export default function PasswordStrengthBar<TFieldValues extends FieldValues>({ control, name }: PasswordStrengthBarProps<TFieldValues>) {
  const password = useWatch({ control, name }) as string || "";
  
  let strength = 0;
  let label = "Weak";
  let colorClass = "bg-red-400";

  if (password.length >= 8 && /[0-9!@#$%^&*(),.?":{}|<>]/.test(password)) {
    strength = 1;
    label = "Fair";
    colorClass = "bg-amber-400";
  }
  if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    strength = 2;
    label = "Strong";
    colorClass = "bg-green-500";
  }
  if (password.length < 8) {
    strength = 0;
    label = "Weak";
    colorClass = "bg-red-400";
  }

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex gap-1.5 w-full">
        <div className={`h-1.5 flex-1 rounded-full ${password.length > 0 && strength >= 0 ? colorClass : 'bg-gray-200'}`} />
        <div className={`h-1.5 flex-1 rounded-full ${password.length > 0 && strength >= 1 ? colorClass : 'bg-gray-200'}`} />
        <div className={`h-1.5 flex-1 rounded-full ${password.length > 0 && strength >= 2 ? colorClass : 'bg-gray-200'}`} />
      </div>
      {password.length > 0 && (
        <motion.span 
          key={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-xs font-medium text-right text-${colorClass.split('-')[1]}-500`}
          style={{ color: colorClass === 'bg-red-400' ? '#f87171' : colorClass === 'bg-amber-400' ? '#fbbf24' : '#22c55e' }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );
}
