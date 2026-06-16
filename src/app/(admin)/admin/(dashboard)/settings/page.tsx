import { prisma } from '@/lib/prisma';
import SettingsForms from './SettingsForms';

export const metadata = {
  title: 'Settings - CareLink Admin',
};

export default async function SettingsPage() {
  const systemNameSetting = await prisma.systemSetting.findUnique({
    where: { key: 'SYSTEM_NAME' }
  });

  const defaultSystemName = systemNameSetting?.value || 'CareLink Admin';

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm font-medium text-slate-600 mt-1">Manage system preferences and your account security.</p>
      </div>
      
      <SettingsForms defaultSystemName={defaultSystemName} />
    </>
  );
}
