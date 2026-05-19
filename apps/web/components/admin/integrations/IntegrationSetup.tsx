'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  CircleAlert,
  Clipboard,
  CreditCard,
  FlaskConical,
  KeyRound,
  MessageCircle,
  PackageCheck,
  Save,
  Send,
  Settings2,
  Trash2,
  Truck,
} from 'lucide-react';
import type {
  IntegrationMode,
  IntegrationProvider,
  IntegrationSecretKey,
  IntegrationSecretStatus,
  IntegrationWebhookStatus,
} from '@/lib/integration-secrets';
import {
  deleteIntegrationSecret,
  saveIntegrationSettings,
  testIntegration,
  type IntegrationActionState,
} from '@/app/admin/integrations/actions';

interface IntegrationSetupProps {
  appUrl: string;
  statuses: IntegrationSecretStatus[];
  webhookStatuses: IntegrationWebhookStatus[];
  xenditMode: IntegrationMode;
  biteshipMode: IntegrationMode;
}

type TabId = 'overview' | 'xendit' | 'biteship' | 'fonnte' | 'webhooks';
type ProviderDetailTab = Exclude<TabId, 'overview' | 'webhooks'>;

const inputClass =
  'h-11 w-full rounded-lg border border-black/[0.08] bg-white px-3.5 text-[14px] font-medium text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20';
const labelClass = 'text-[12px] font-medium text-[#86868B]';
const panelClass = 'rounded-xl border border-black/[0.06] bg-white';
const initialIntegrationActionState: IntegrationActionState = {
  status: 'idle',
  message: '',
};

const secretLabels: Record<IntegrationSecretKey, string> = {
  secret_key: 'Live Secret Key',
  test_secret_key: 'Test Secret Key',
  callback_token: 'Live Callback Token',
  test_callback_token: 'Test Callback Token',
  api_key: 'Live API Key',
  test_api_key: 'Test API Key',
  webhook_token: 'Webhook Token',
  mode: 'Mode aktif',
  origin_area_id: 'Origin Area ID',
  api_token: 'API Token',
};

function statusFor(
  statuses: IntegrationSecretStatus[],
  provider: IntegrationProvider,
  secretKey: IntegrationSecretKey,
) {
  return statuses.find((status) => status.provider === provider && status.secret_key === secretKey);
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function SubmitButton({
  children,
  variant = 'primary',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const { pending } = useFormStatus();
  const classes = {
    primary: 'bg-[#1D1D1F] text-white hover:bg-black',
    secondary: 'border border-black/[0.08] bg-white text-[#1D1D1F] hover:bg-black/[0.04]',
    danger: 'border border-red-500/20 bg-red-50 text-red-700 hover:bg-red-100',
  };

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors disabled:opacity-60 ${classes[variant]}`}
    >
      {children}
    </button>
  );
}

function useRefreshAfterAction(state: IntegrationActionState) {
  const router = useRouter();

  useEffect(() => {
    if (state.status !== 'idle') router.refresh();
  }, [router, state.status]);
}

function SaveActionForm({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(
    saveIntegrationSettings,
    initialIntegrationActionState,
  );
  useRefreshAfterAction(state);

  return (
    <form action={formAction} className={className}>
      {children}
      {state.message ? <ActionMessage state={state} /> : null}
    </form>
  );
}

function TestActionForm({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(testIntegration, initialIntegrationActionState);
  useRefreshAfterAction(state);

  return (
    <form action={formAction} className={className}>
      {children}
      {state.message ? <ActionMessage state={state} /> : null}
    </form>
  );
}

function DeleteActionForm({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(
    deleteIntegrationSecret,
    initialIntegrationActionState,
  );
  useRefreshAfterAction(state);

  return (
    <form action={formAction} className={className}>
      {children}
      {state.message ? <ActionMessage state={state} /> : null}
    </form>
  );
}

function ActionMessage({ state }: { state: IntegrationActionState }) {
  return (
    <div
      className={`rounded-lg px-3 py-2 text-[12px] leading-relaxed ${
        state.status === 'success'
          ? 'bg-emerald-500/10 text-emerald-800'
          : 'bg-red-500/10 text-red-700'
      }`}
    >
      {state.message}
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard.writeText(value)}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3 text-[12px] font-semibold text-[#1D1D1F] hover:bg-black/[0.04]"
    >
      <Clipboard className="h-3.5 w-3.5" />
      Copy
    </button>
  );
}

function SecretInput({
  name,
  label,
  placeholder,
  status,
}: {
  name: IntegrationSecretKey;
  label: string;
  placeholder: string;
  status?: IntegrationSecretStatus;
}) {
  const saved = status?.is_configured;

  return (
    <label className="block space-y-1.5">
      <span className={labelClass}>{label}</span>
      <input
        name={name}
        type="password"
        autoComplete="off"
        className={inputClass}
        placeholder={saved ? 'Sudah tersimpan. Isi hanya kalau ingin mengganti.' : placeholder}
      />
      <span className="block text-[11px] text-[#86868B]">
        {saved
          ? `Tersimpan ${formatDate(status.updated_at)}. Nilai secret tidak ditampilkan ulang.`
          : 'Belum tersimpan.'}
      </span>
    </label>
  );
}

function ModeSwitch({
  provider,
  mode,
  title,
}: {
  provider: 'xendit' | 'biteship';
  mode: IntegrationMode;
  title: string;
}) {
  const isTest = mode === 'test';
  const nextMode = isTest ? 'production' : 'test';

  return (
    <div className="rounded-xl border border-black/[0.06] bg-[#FAFAFA] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-[#1D1D1F]">{title}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#666]">
            {isTest
              ? 'Testing aktif. Website akan memakai credential test untuk provider ini.'
              : 'Production aktif. Website akan memakai credential live untuk transaksi asli.'}
          </p>
        </div>
        <SaveActionForm>
          <input type="hidden" name="provider" value={provider} />
          <input type="hidden" name="mode" value={nextMode} />
          <SubmitButton variant="secondary">
            {isTest ? <FlaskConical className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {isTest ? 'Mode Testing' : 'Mode Production'}
          </SubmitButton>
        </SaveActionForm>
      </div>
    </div>
  );
}

function CredentialStatusList({
  provider,
  keys,
  statuses,
}: {
  provider: IntegrationProvider;
  keys: IntegrationSecretKey[];
  statuses: IntegrationSecretStatus[];
}) {
  return (
    <div className="space-y-2">
      {keys.map((key) => {
        const status = statusFor(statuses, provider, key);
        const saved = status?.is_configured;

        return (
          <div
            key={`${provider}-${key}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/[0.06] bg-white px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#1D1D1F]">{secretLabels[key]}</p>
              <p className="text-[11px] text-[#86868B]">
                {saved ? `Tersimpan ${formatDate(status.updated_at)}` : 'Belum tersimpan'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  saved ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
                }`}
              >
                {saved ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <CircleAlert className="h-3.5 w-3.5" />
                )}
                {saved ? 'Ready' : 'Kosong'}
              </span>
              {saved && key !== 'mode' ? (
                <DeleteActionForm>
                  <input type="hidden" name="provider" value={provider} />
                  <input type="hidden" name="secret_key" value={key} />
                  <SubmitButton variant="danger">
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus
                  </SubmitButton>
                </DeleteActionForm>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LastTest({
  provider,
  statuses,
}: {
  provider: IntegrationProvider;
  statuses: IntegrationSecretStatus[];
}) {
  const latest = statuses
    .filter((status) => status.provider === provider && status.last_tested_at)
    .sort((a, b) => String(b.last_tested_at).localeCompare(String(a.last_tested_at)))[0];

  if (!latest) {
    return (
      <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-[12px] text-amber-800">
        Belum ada test berhasil/gagal yang tercatat.
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg px-3 py-2 text-[12px] leading-relaxed ${
        latest.last_test_status === 'success'
          ? 'bg-emerald-500/10 text-emerald-800'
          : 'bg-red-500/10 text-red-700'
      }`}
    >
      <span className="font-semibold">
        {latest.last_test_status === 'success' ? 'Test terakhir berhasil' : 'Test terakhir gagal'}
      </span>
      {` pada ${formatDate(latest.last_tested_at)}. ${latest.last_test_message ?? ''}`}
    </div>
  );
}

function WebhookBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-[#1D1D1F]">{label}</p>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white p-2">
        <code className="min-w-0 flex-1 truncate text-[12px] text-[#1D1D1F]">{value}</code>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

function StepList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2 text-[12px] leading-relaxed text-[#555]">
      {items.map((item, index) => (
        <li key={item}>
          <span className="mr-1 font-semibold text-[#1D1D1F]">{index + 1}.</span>
          {item}
        </li>
      ))}
    </ol>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center gap-2 border-b-2 px-2 text-[13px] font-semibold transition-colors ${
        active
          ? 'border-[#5B2BBF] text-[#5B2BBF]'
          : 'border-transparent text-[#86868B] hover:text-[#1D1D1F]'
      }`}
    >
      {children}
    </button>
  );
}

type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

function StatusPill({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  const classes: Record<StatusTone, string> = {
    success: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/15',
    warning: 'bg-amber-500/12 text-amber-800 ring-amber-500/20',
    danger: 'bg-red-500/10 text-red-700 ring-red-500/15',
    neutral: 'bg-black/[0.04] text-[#666] ring-black/[0.06]',
    info: 'bg-[#5B2BBF]/10 text-[#5B2BBF] ring-[#5B2BBF]/15',
  };

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ${classes[tone]}`}
    >
      {children}
    </span>
  );
}

function MaskedKey({ saved }: { saved: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <KeyRound className="h-4 w-4 text-[#86868B]" />
      <span className="text-[18px] leading-none tracking-[2px] text-[#86868B]">
        {saved ? '••••••••••••••••' : 'Belum ada'}
      </span>
    </div>
  );
}

function latestTestFor(statuses: IntegrationSecretStatus[], provider: IntegrationProvider) {
  return statuses
    .filter((status) => status.provider === provider && status.last_tested_at)
    .sort((a, b) => String(b.last_tested_at).localeCompare(String(a.last_tested_at)))[0];
}

function latestWebhookFor(
  webhookStatuses: IntegrationWebhookStatus[],
  provider: Extract<IntegrationProvider, 'xendit' | 'biteship'>,
) {
  return webhookStatuses.find((status) => status.provider === provider);
}

function CredentialChips({
  credentials,
  statuses,
  provider,
}: {
  credentials: Array<{ key: IntegrationSecretKey; label: string }>;
  statuses: IntegrationSecretStatus[];
  provider: IntegrationProvider;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {credentials.map((credential) => {
        const saved = Boolean(statusFor(statuses, provider, credential.key)?.is_configured);
        return (
          <StatusPill key={credential.key} tone={saved ? 'success' : 'danger'}>
            {saved ? `${credential.label} tersimpan` : `${credential.label} kosong`}
          </StatusPill>
        );
      })}
    </div>
  );
}

function TestSignal({
  provider,
  statuses,
}: {
  provider: IntegrationProvider;
  statuses: IntegrationSecretStatus[];
}) {
  const latest = latestTestFor(statuses, provider);

  if (!latest) {
    return (
      <div className="max-w-[240px] space-y-1">
        <StatusPill tone="warning">Belum dites</StatusPill>
        <p className="text-[11px] leading-relaxed text-[#86868B]">
          Jalankan tombol test di detail provider.
        </p>
      </div>
    );
  }

  const success = latest.last_test_status === 'success';

  return (
    <div className="max-w-[260px] space-y-1">
      <StatusPill tone={success ? 'success' : 'danger'}>
        {success ? 'Test berhasil' : 'Test gagal'}
      </StatusPill>
      <p className="text-[11px] leading-relaxed text-[#666]">
        {formatDate(latest.last_tested_at)}
        {latest.last_test_message ? ` - ${latest.last_test_message}` : ''}
      </p>
    </div>
  );
}

function WebhookSignal({
  provider,
  webhookStatuses,
}: {
  provider?: Extract<IntegrationProvider, 'xendit' | 'biteship'>;
  webhookStatuses: IntegrationWebhookStatus[];
}) {
  if (!provider) {
    return (
      <div className="max-w-[240px] space-y-1">
        <StatusPill tone="neutral">Tidak perlu webhook</StatusPill>
        <p className="text-[11px] leading-relaxed text-[#86868B]">
          Fonnte dipantau lewat test device dan pesan.
        </p>
      </div>
    );
  }

  const latest = latestWebhookFor(webhookStatuses, provider);

  if (!latest) {
    return (
      <div className="max-w-[260px] space-y-1">
        <StatusPill tone="warning">Belum ada event masuk</StatusPill>
        <p className="text-[11px] leading-relaxed text-[#86868B]">
          Pasang URL webhook di dashboard vendor, lalu lakukan test transaksi.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[280px] space-y-1">
      <StatusPill tone="success">Event diterima</StatusPill>
      <p className="text-[11px] leading-relaxed text-[#666]">
        {formatDate(latest.processed_at ?? latest.created_at)}
        {latest.event_type ? ` - ${latest.event_type}` : ''}
        {latest.reference_id ? ` (${latest.reference_id})` : ''}
      </p>
    </div>
  );
}

function TokenApiTable({
  statuses,
  webhookStatuses,
  xenditMode,
  biteshipMode,
  onOpenDetail,
}: {
  statuses: IntegrationSecretStatus[];
  webhookStatuses: IntegrationWebhookStatus[];
  xenditMode: IntegrationMode;
  biteshipMode: IntegrationMode;
  onOpenDetail: (tab: ProviderDetailTab) => void;
}) {
  const rows: Array<{
    id: string;
    name: string;
    provider: IntegrationProvider;
    detailTab: ProviderDetailTab;
    secretKey: IntegrationSecretKey;
    dateKey: IntegrationSecretKey;
    mode: string;
    modeTone: StatusTone;
    isActiveMode: boolean;
    credentials: Array<{ key: IntegrationSecretKey; label: string }>;
    webhookProvider?: Extract<IntegrationProvider, 'xendit' | 'biteship'>;
  }> = [
    {
      id: 'biteship-test',
      name: 'Biteship Testing',
      provider: 'biteship',
      detailTab: 'biteship',
      secretKey: 'test_api_key',
      dateKey: 'test_api_key',
      mode: biteshipMode === 'test' ? 'Dipakai website' : 'Siap testing',
      modeTone: biteshipMode === 'test' ? 'info' : 'neutral',
      isActiveMode: biteshipMode === 'test',
      credentials: [{ key: 'test_api_key', label: 'Test API Key' }],
      webhookProvider: 'biteship',
    },
    {
      id: 'biteship-live',
      name: 'Biteship Production',
      provider: 'biteship',
      detailTab: 'biteship',
      secretKey: 'api_key',
      dateKey: 'api_key',
      mode: biteshipMode === 'production' ? 'Dipakai website' : 'Disimpan untuk live',
      modeTone: biteshipMode === 'production' ? 'info' : 'neutral',
      isActiveMode: biteshipMode === 'production',
      credentials: [
        { key: 'api_key', label: 'Live API Key' },
        { key: 'webhook_token', label: 'Webhook Token' },
      ],
      webhookProvider: 'biteship',
    },
    {
      id: 'xendit-test',
      name: 'Xendit Testing',
      provider: 'xendit',
      detailTab: 'xendit',
      secretKey: 'test_secret_key',
      dateKey: 'test_secret_key',
      mode: xenditMode === 'test' ? 'Dipakai website' : 'Siap testing',
      modeTone: xenditMode === 'test' ? 'info' : 'neutral',
      isActiveMode: xenditMode === 'test',
      credentials: [
        { key: 'test_secret_key', label: 'Test Secret' },
        { key: 'test_callback_token', label: 'Callback Token' },
      ],
      webhookProvider: 'xendit',
    },
    {
      id: 'xendit-live',
      name: 'Xendit Production',
      provider: 'xendit',
      detailTab: 'xendit',
      secretKey: 'secret_key',
      dateKey: 'secret_key',
      mode: xenditMode === 'production' ? 'Dipakai website' : 'Disimpan untuk live',
      modeTone: xenditMode === 'production' ? 'info' : 'neutral',
      isActiveMode: xenditMode === 'production',
      credentials: [
        { key: 'secret_key', label: 'Live Secret' },
        { key: 'callback_token', label: 'Callback Token' },
      ],
      webhookProvider: 'xendit',
    },
    {
      id: 'fonnte',
      name: 'Fonnte Device',
      provider: 'fonnte',
      detailTab: 'fonnte',
      secretKey: 'api_token',
      dateKey: 'api_token',
      mode: 'WhatsApp aktif',
      modeTone: 'neutral',
      isActiveMode: true,
      credentials: [{ key: 'api_token', label: 'API Token' }],
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-black/[0.06] bg-[#FAFAFA] text-[12px] font-semibold text-[#5B2BBF]">
              <th className="px-5 py-4">Integrasi</th>
              <th className="px-5 py-4">Credential</th>
              <th className="px-5 py-4">Mode</th>
              <th className="px-5 py-4">Test terakhir</th>
              <th className="px-5 py-4">Webhook / event</th>
              <th className="px-5 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const status = statusFor(statuses, row.provider, row.secretKey);
              const saved = Boolean(status?.is_configured);

              return (
                <tr key={row.id} className="border-b border-black/[0.06] last:border-b-0">
                  <td className="px-5 py-4 align-middle">
                    <p className="text-[13px] font-semibold text-[#1D1D1F]">{row.name}</p>
                    <p className="mt-1 text-[12px] text-[#86868B]">
                      {row.provider === 'fonnte'
                        ? 'Notifikasi WhatsApp'
                        : row.id.endsWith('test')
                          ? 'Sandbox / testing'
                          : 'Live / production'}
                    </p>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <div className="space-y-2">
                      <MaskedKey saved={saved} />
                      <CredentialChips
                        credentials={row.credentials}
                        provider={row.provider}
                        statuses={statuses}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <div className="space-y-1">
                      <StatusPill tone={row.modeTone}>{row.mode}</StatusPill>
                      <p className="text-[11px] leading-relaxed text-[#86868B]">
                        Disimpan:{' '}
                        {formatDate(
                          statusFor(statuses, row.provider, row.dateKey)?.updated_at ?? null,
                        )}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <TestSignal provider={row.provider} statuses={statuses} />
                  </td>
                  <td className="px-5 py-4 align-middle">
                    {row.webhookProvider && !row.isActiveMode ? (
                      <div className="max-w-[260px] space-y-1">
                        <StatusPill tone="neutral">Dilacak di mode aktif</StatusPill>
                        <p className="text-[11px] leading-relaxed text-[#86868B]">
                          Event provider ditampilkan di baris yang sedang dipakai website.
                        </p>
                      </div>
                    ) : (
                      <WebhookSignal
                        provider={row.webhookProvider}
                        webhookStatuses={webhookStatuses}
                      />
                    )}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <div className="flex flex-col items-start gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(row.detailTab)}
                        className="text-[12px] font-semibold text-[#5B2BBF] underline underline-offset-2"
                      >
                        Lihat Detail
                      </button>
                      {saved ? (
                        <DeleteActionForm>
                          <input type="hidden" name="provider" value={row.provider} />
                          <input type="hidden" name="secret_key" value={row.secretKey} />
                          <button
                            type="submit"
                            className="text-[12px] font-semibold text-red-700 underline underline-offset-2"
                          >
                            Buang Kunci
                          </button>
                        </DeleteActionForm>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function IntegrationSetup({
  appUrl,
  statuses,
  webhookStatuses,
  xenditMode,
  biteshipMode,
}: IntegrationSetupProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const xenditWebhookUrl = `${appUrl}/api/payment/webhook`;
  const biteshipWebhookUrl = `${appUrl}/api/shipping/webhook`;
  const tabs = useMemo(
    () =>
      [
        ['overview', 'API Keys', Settings2],
        ['xendit', 'Xendit', CreditCard],
        ['biteship', 'Biteship', Truck],
        ['fonnte', 'Fonnte', MessageCircle],
        ['webhooks', 'Webhook & Testing', PackageCheck],
      ] as const,
    [],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-2">
        {tabs.map(([id, label, Icon]) => (
          <TabButton key={id} active={activeTab === id} onClick={() => setActiveTab(id)}>
            <Icon className="h-4 w-4" />
            {label}
          </TabButton>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <section className={panelClass}>
          <div className="border-b border-black/[0.06] px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-semibold tracking-tight text-[#1D1D1F]">
                  Token API
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-[#666]">
                  Daftar credential yang sudah tersimpan. Nilai asli disembunyikan, tapi status dan
                  tanggal simpan tetap terlihat supaya client tahu setup sebelumnya sudah ada.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('biteship')}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#5B2BBF] px-4 text-[13px] font-semibold text-white hover:bg-[#4A229E]"
              >
                Tambah Kunci API
              </button>
            </div>
          </div>
          <div className="space-y-5 p-6">
            <TokenApiTable
              statuses={statuses}
              webhookStatuses={webhookStatuses}
              xenditMode={xenditMode}
              biteshipMode={biteshipMode}
              onOpenDetail={setActiveTab}
            />
            <div className="rounded-xl border border-[#5B2BBF]/15 bg-[#F7F3FF] p-4">
              <p className="text-[13px] font-semibold text-[#1D1D1F]">
                Cara membaca status integrasi
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-[#555]">
                Credential tersimpan hanya berarti secret sudah aman di Supabase Vault. Webhook
                dianggap sehat hanya kalau kolom Webhook / event menampilkan event yang benar-benar
                pernah masuk ke endpoint website. Input detail tetap kosong karena secret tidak
                boleh dibuka ulang ke browser.
              </p>
            </div>
          </div>
          <div className="grid gap-4 px-6 pb-6 md:grid-cols-3">
            <LastTest provider="xendit" statuses={statuses} />
            <LastTest provider="biteship" statuses={statuses} />
            <LastTest provider="fonnte" statuses={statuses} />
          </div>
        </section>
      ) : null}

      {activeTab === 'xendit' ? (
        <section className={panelClass}>
          <div className="border-b border-black/[0.06] px-6 py-5">
            <h2 className="text-[18px] font-semibold tracking-tight text-[#1D1D1F]">
              Xendit Payment
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#666]">
              Xendit tidak punya form aktivasi seperti Biteship. Testing dilakukan dengan test key
              dan production dengan live key.
            </p>
          </div>
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_420px]">
            <div className="space-y-4">
              <ModeSwitch
                provider="xendit"
                mode={xenditMode}
                title="Mode Xendit yang Dipakai Website"
              />
              <SaveActionForm className="space-y-4">
                <input type="hidden" name="provider" value="xendit" />
                <SecretInput
                  name="test_secret_key"
                  label="Test Secret Key"
                  placeholder="xnd_development_..."
                  status={statusFor(statuses, 'xendit', 'test_secret_key')}
                />
                <SecretInput
                  name="test_callback_token"
                  label="Test Callback Token"
                  placeholder="Webhook verification token dari dashboard test"
                  status={statusFor(statuses, 'xendit', 'test_callback_token')}
                />
                <SecretInput
                  name="secret_key"
                  label="Live Secret Key"
                  placeholder="xnd_production_..."
                  status={statusFor(statuses, 'xendit', 'secret_key')}
                />
                <SecretInput
                  name="callback_token"
                  label="Live Callback Token"
                  placeholder="Webhook verification token dari dashboard live"
                  status={statusFor(statuses, 'xendit', 'callback_token')}
                />
                <SubmitButton>
                  <Save className="h-4 w-4" />
                  Simpan Xendit
                </SubmitButton>
              </SaveActionForm>
            </div>
            <div className="space-y-4 rounded-xl border border-black/[0.06] bg-[#FAFAFA] p-4">
              <WebhookBox label="Webhook URL Xendit" value={xenditWebhookUrl} />
              <StepList
                items={[
                  'Buka Xendit Dashboard > Settings > Developers > API Keys.',
                  'Copy test key ke Test Secret Key dan live key ke Live Secret Key.',
                  'Buka Settings > Webhooks, copy verification token untuk masing-masing environment.',
                  'Tambahkan webhook URL di atas untuk invoice/payment link events.',
                  'Aktifkan event invoice paid/settled dan expired.',
                  'Set Mode Testing, klik Test Xendit. Kalau berhasil, coba checkout kecil di mode test.',
                  'Status webhook di overview baru hijau setelah Xendit benar-benar mengirim event ke endpoint website.',
                  'Set Mode Production hanya setelah payment channel live sudah aktif di dashboard Xendit.',
                ]}
              />
              <TestActionForm className="space-y-3">
                <input type="hidden" name="provider" value="xendit" />
                <input type="hidden" name="test_type" value="balance" />
                <SubmitButton>
                  <KeyRound className="h-4 w-4" />
                  Test Xendit Sesuai Mode Aktif
                </SubmitButton>
              </TestActionForm>
              <CredentialStatusList
                provider="xendit"
                keys={['test_secret_key', 'test_callback_token', 'secret_key', 'callback_token']}
                statuses={statuses}
              />
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'biteship' ? (
        <section className={panelClass}>
          <div className="border-b border-black/[0.06] px-6 py-5">
            <h2 className="text-[18px] font-semibold tracking-tight text-[#1D1D1F]">
              Biteship Shipping
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#666]">
              Rates API bisa aktif lebih dulu. Order API wajib aktif supaya website bisa membuat
              pengiriman otomatis setelah payment paid.
            </p>
          </div>
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_420px]">
            <div className="space-y-4">
              <ModeSwitch
                provider="biteship"
                mode={biteshipMode}
                title="Mode Biteship yang Dipakai Website"
              />
              <SaveActionForm className="space-y-4">
                <input type="hidden" name="provider" value="biteship" />
                <SecretInput
                  name="test_api_key"
                  label="Test API Key"
                  placeholder="biteship_test..."
                  status={statusFor(statuses, 'biteship', 'test_api_key')}
                />
                <SecretInput
                  name="api_key"
                  label="Live API Key"
                  placeholder="biteship_live..."
                  status={statusFor(statuses, 'biteship', 'api_key')}
                />
                <SecretInput
                  name="webhook_token"
                  label="Webhook Token"
                  placeholder="Buat token rahasia, lalu pakai sebagai Authorization di webhook Biteship"
                  status={statusFor(statuses, 'biteship', 'webhook_token')}
                />
                <SubmitButton>
                  <Save className="h-4 w-4" />
                  Simpan Biteship
                </SubmitButton>
              </SaveActionForm>
            </div>
            <div className="space-y-4 rounded-xl border border-black/[0.06] bg-[#FAFAFA] p-4">
              <WebhookBox label="Webhook URL Biteship" value={biteshipWebhookUrl} />
              <StepList
                items={[
                  'Isi Test API Key, lalu klik Test Sandbox Key.',
                  'Buka Admin > Settings, pastikan alamat toko, koordinat, Biteship Area ID, dan kode pos sudah terisi.',
                  'Klik Test Ongkir dan Test Kurir. Ini memastikan Rates API dan Courier API jalan.',
                  'Isi Webhook Token di halaman ini. Di Biteship webhook auth, pakai header Authorization dengan value Bearer <token yang sama>.',
                  'Untuk aktivasi Order API, buka Biteship Dashboard > Integrasi > Aktivasi Order API.',
                  'Di form Biteship, pilih courier yang dipakai website. Jangan centang COD, asuransi, atau resi sendiri kalau fitur itu belum dipakai.',
                  'Masuk Mode Testing Biteship, buat 1 order test delivered dan 1 order test cancelled, lalu paste ID-nya ke form aktivasi.',
                  'Status webhook di overview baru hijau setelah Biteship mengirim event order.status/order.price/order.waybill_id ke website.',
                  'Setelah Order API berubah Aktif, isi Live API Key dan pindahkan Mode Biteship ke Production.',
                ]}
              />
              <div className="grid gap-2">
                <TestActionForm className="space-y-3">
                  <input type="hidden" name="provider" value="biteship" />
                  <input type="hidden" name="test_type" value="sandbox" />
                  <SubmitButton>
                    <KeyRound className="h-4 w-4" />
                    Test Sandbox Key
                  </SubmitButton>
                </TestActionForm>
                <TestActionForm className="space-y-3">
                  <input type="hidden" name="provider" value="biteship" />
                  <input type="hidden" name="test_type" value="rates" />
                  <label className="block space-y-1.5">
                    <span className={labelClass}>Tujuan test ongkir</span>
                    <input
                      name="destination"
                      className={inputClass}
                      placeholder="Jakarta Selatan 12250"
                    />
                  </label>
                  <SubmitButton>
                    <Truck className="h-4 w-4" />
                    Test Ongkir
                  </SubmitButton>
                </TestActionForm>
                <TestActionForm className="space-y-3">
                  <input type="hidden" name="provider" value="biteship" />
                  <input type="hidden" name="test_type" value="couriers" />
                  <SubmitButton>
                    <Truck className="h-4 w-4" />
                    Test Kurir
                  </SubmitButton>
                </TestActionForm>
                <TestActionForm className="space-y-3">
                  <input type="hidden" name="provider" value="biteship" />
                  <input type="hidden" name="test_type" value="order" />
                  <SubmitButton>
                    <PackageCheck className="h-4 w-4" />
                    Test Kesiapan Pesanan
                  </SubmitButton>
                </TestActionForm>
              </div>
              <CredentialStatusList
                provider="biteship"
                keys={['test_api_key', 'api_key', 'webhook_token']}
                statuses={statuses}
              />
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'fonnte' ? (
        <section className={panelClass}>
          <div className="border-b border-black/[0.06] px-6 py-5">
            <h2 className="text-[18px] font-semibold tracking-tight text-[#1D1D1F]">
              Fonnte WhatsApp
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#666]">
              Fonnte tidak punya mode sandbox terpisah. Test memakai token device yang disimpan.
            </p>
          </div>
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_420px]">
            <SaveActionForm className="space-y-4">
              <input type="hidden" name="provider" value="fonnte" />
              <SecretInput
                name="api_token"
                label="API Token"
                placeholder="Token dari Fonnte Device"
                status={statusFor(statuses, 'fonnte', 'api_token')}
              />
              <SubmitButton>
                <Save className="h-4 w-4" />
                Simpan Fonnte
              </SubmitButton>
            </SaveActionForm>
            <div className="space-y-4 rounded-xl border border-black/[0.06] bg-[#FAFAFA] p-4">
              <StepList
                items={[
                  'Buka Fonnte Dashboard > Device.',
                  'Pastikan device WhatsApp status connected.',
                  'Copy token device dan simpan di field API Token.',
                  'Klik Test Device. Kalau gagal, cek ulang koneksi WhatsApp di Fonnte.',
                  'Isi nomor WhatsApp admin, lalu klik Kirim Pesan Test.',
                ]}
              />
              <TestActionForm className="space-y-3">
                <input type="hidden" name="provider" value="fonnte" />
                <input type="hidden" name="test_type" value="device" />
                <SubmitButton>
                  <MessageCircle className="h-4 w-4" />
                  Test Device
                </SubmitButton>
              </TestActionForm>
              <TestActionForm className="space-y-3">
                <input type="hidden" name="provider" value="fonnte" />
                <input type="hidden" name="test_type" value="message" />
                <label className="block space-y-1.5">
                  <span className={labelClass}>Nomor test WhatsApp</span>
                  <input name="target" className={inputClass} placeholder="08123456789" />
                </label>
                <SubmitButton>
                  <Send className="h-4 w-4" />
                  Kirim Pesan Test
                </SubmitButton>
              </TestActionForm>
              <CredentialStatusList provider="fonnte" keys={['api_token']} statuses={statuses} />
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'webhooks' ? (
        <section className={panelClass}>
          <div className="border-b border-black/[0.06] px-6 py-5">
            <h2 className="text-[18px] font-semibold tracking-tight text-[#1D1D1F]">
              Webhook & Checklist Production
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#666]">
              Webhook harus memakai domain online. Jangan pakai localhost untuk production.
            </p>
          </div>
          <div className="space-y-6 p-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-black/[0.06] bg-[#FAFAFA] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868B]">
                  Sinyal Xendit
                </p>
                <div className="mt-3">
                  <WebhookSignal provider="xendit" webhookStatuses={webhookStatuses} />
                </div>
              </div>
              <div className="rounded-xl border border-black/[0.06] bg-[#FAFAFA] p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#86868B]">
                  Sinyal Biteship
                </p>
                <div className="mt-3">
                  <WebhookSignal provider="biteship" webhookStatuses={webhookStatuses} />
                </div>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-xl border border-black/[0.06] bg-[#FAFAFA] p-4">
                <WebhookBox label="Xendit Webhook" value={xenditWebhookUrl} />
                <StepList
                  items={[
                    'Pasang URL ini di Xendit Dashboard > Settings > Webhooks.',
                    'Pastikan token yang disimpan di halaman ini sama dengan Callback Verification Token Xendit.',
                    'Endpoint kita membaca header x-callback-token dan menolak webhook yang tokennya salah.',
                    'Test checkout di Mode Testing, bayar invoice test, lalu cek status order berubah paid.',
                    'Kalau test berhasil, halaman overview akan menampilkan event Xendit terakhir yang diterima.',
                  ]}
                />
              </div>
              <div className="space-y-4 rounded-xl border border-black/[0.06] bg-[#FAFAFA] p-4">
                <WebhookBox label="Biteship Webhook" value={biteshipWebhookUrl} />
                <StepList
                  items={[
                    'Pasang URL ini di Biteship Dashboard > Integrasi/Webhook.',
                    'Aktifkan event order.status, order.price, dan order.waybill_id jika tersedia.',
                    'Aktifkan webhook auth dan kirim header Authorization: Bearer <Webhook Token> sesuai token yang disimpan di tab Biteship.',
                    'Endpoint kita menolak event Biteship jika Webhook Token belum disimpan atau header auth salah.',
                    'Webhook ini dipakai untuk update status pengiriman dan data resi di order.',
                    'Setelah Order API aktif, lakukan 1 pesanan internal kecil untuk memastikan resi masuk.',
                    'Kalau event diterima, halaman overview akan menampilkan event Biteship terakhir yang diterima.',
                  ]}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
