import type { Metadata } from 'next';
import { getIntegrationMode, listIntegrationSecretStatuses } from '@/lib/integration-secrets';
import { IntegrationSetup } from '@/components/admin/integrations/IntegrationSetup';

export const metadata: Metadata = {
  title: 'Integrasi',
};

export const dynamic = 'force-dynamic';

export default async function AdminIntegrationsPage() {
  const statuses = await listIntegrationSecretStatuses();
  const [xenditMode, biteshipMode] = await Promise.all([
    getIntegrationMode('xendit'),
    getIntegrationMode('biteship'),
  ]);
  const configuredAppUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const appUrl =
    configuredAppUrl && !configuredAppUrl.includes('localhost')
      ? configuredAppUrl
      : 'https://bananasbindery.com';

  return (
    <div className="mx-auto max-w-[1240px] space-y-8">
      <header>
        <p className="text-[13px] font-medium text-[#86868B]">Setup vendor</p>
        <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-tight text-[#1D1D1F]">
          Integrasi
        </h1>
        <p className="mt-1 max-w-3xl text-[14px] leading-relaxed text-[#86868B]">
          Simpan token vendor, copy URL webhook, dan jalankan test koneksi dari satu halaman. Secret
          disimpan encrypted di Supabase Vault dan tidak ditampilkan ulang ke browser.
        </p>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[#1D1D1F]">
          Webhook harus memakai domain production aktif. Untuk Bananasbindery gunakan domain{' '}
          <span className="font-semibold">https://bananasbindery.com</span>, bukan localhost.
        </p>
      </header>

      <IntegrationSetup
        appUrl={appUrl}
        statuses={statuses}
        xenditMode={xenditMode}
        biteshipMode={biteshipMode}
      />
    </div>
  );
}
