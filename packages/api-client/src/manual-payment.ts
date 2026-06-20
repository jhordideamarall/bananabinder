import type { StoreSettings } from './types';

export type ManualPaymentDestinationType = 'qris' | 'bank_transfer';
export type PaymentProofStatus = 'submitted' | 'approved' | 'rejected';

export interface ManualPaymentAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ManualPaymentSettings {
  enabled: boolean;
  qrImageUrl: string | null;
  instructions: string | null;
  expiresHours: number;
  accounts: ManualPaymentAccount[];
  activeAccounts: ManualPaymentAccount[];
  destinations: ManualPaymentDestination[];
  hasActiveDestination: boolean;
}

export type ManualPaymentDestination =
  | {
      type: 'qris';
      id: 'qris';
      label: string;
      qrImageUrl: string;
    }
  | {
      type: 'bank_transfer';
      id: string;
      label: string;
      account: ManualPaymentAccount;
    };

const DEFAULT_EXPIRES_HOURS = 24;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function accountFromRecord(value: unknown, index: number): ManualPaymentAccount | null {
  if (!isRecord(value)) return null;

  const bankName = stringValue(value.bankName);
  const accountNumber = stringValue(value.accountNumber);
  const accountHolder = stringValue(value.accountHolder);

  if (!bankName || !accountNumber || !accountHolder) return null;

  const label = stringValue(value.label) || `${bankName} ${accountNumber}`;
  const id = stringValue(value.id) || `${bankName}-${accountNumber}`.toLowerCase();

  return {
    id,
    bankName,
    accountNumber,
    accountHolder,
    label,
    isActive: typeof value.isActive === 'boolean' ? value.isActive : true,
    sortOrder: numberValue(value.sortOrder, index),
  };
}

export function parseManualPaymentAccounts(value: unknown): ManualPaymentAccount[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => accountFromRecord(item, index))
    .filter((item): item is ManualPaymentAccount => item !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function serializeManualPaymentAccounts(accounts: ManualPaymentAccount[]): string {
  return JSON.stringify(
    accounts
      .map((account, index) => ({
        id: account.id,
        bankName: account.bankName.trim(),
        accountNumber: account.accountNumber.trim(),
        accountHolder: account.accountHolder.trim(),
        label: account.label.trim() || `${account.bankName.trim()} ${account.accountNumber.trim()}`,
        isActive: account.isActive,
        sortOrder: Number.isFinite(account.sortOrder) ? account.sortOrder : index,
      }))
      .filter((account) => account.bankName && account.accountNumber && account.accountHolder),
  );
}

export function parseManualPaymentSettings(
  settings: Partial<StoreSettings> | null | undefined,
): ManualPaymentSettings {
  const accounts = parseManualPaymentAccounts(settings?.manual_payment_accounts);
  const activeAccounts = accounts.filter((account) => account.isActive);
  const qrImageUrl = stringValue(settings?.manual_payment_qr_image_url) || null;
  const expiresHours = Math.max(
    1,
    Math.round(numberValue(settings?.manual_payment_expires_hours, DEFAULT_EXPIRES_HOURS)),
  );
  const destinations: ManualPaymentDestination[] = [
    ...(qrImageUrl
      ? [
          {
            type: 'qris' as const,
            id: 'qris' as const,
            label: 'QR / QRIS Bananasbindery',
            qrImageUrl,
          },
        ]
      : []),
    ...activeAccounts.map((account) => ({
      type: 'bank_transfer' as const,
      id: account.id,
      label: account.label || `${account.bankName} ${account.accountNumber}`,
      account,
    })),
  ];

  return {
    enabled: Boolean(settings?.manual_payment_enabled),
    qrImageUrl,
    instructions: stringValue(settings?.manual_payment_instructions) || null,
    expiresHours,
    accounts,
    activeAccounts,
    destinations,
    hasActiveDestination: destinations.length > 0,
  };
}

export function resolveManualPaymentDestination(
  settings: ManualPaymentSettings,
  destinationId: string | null,
): ManualPaymentDestination | null {
  return (
    settings.destinations.find((destination) => destination.id === destinationId) ??
    settings.destinations[0] ??
    null
  );
}
