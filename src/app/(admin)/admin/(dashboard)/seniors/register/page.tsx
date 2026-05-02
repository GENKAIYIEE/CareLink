import { RegistrationForm } from "./RegistrationForm";

export const metadata = {
  title: "Register Senior Citizen | CareLink",
};

export default function RegisterSeniorPage() {
  return (
    <div className="min-h-full p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Registration Module</h1>
        <p className="text-gray-500 mt-1">Encode new senior citizen profiles and generate their physical ID.</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <RegistrationForm />
      </div>
    </div>
  );
}
