// Domain types synced with PRD §15 schema
// Last synced: 2026-05-02

import type { UserRole, LoyaltyTier } from '../enums.js';

export interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  tier: LoyaltyTier;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  recipientName: string | null;
  phone: string | null;
  fullAddress: string;
  city: string;
  district: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: Date;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  type: string;
  breed: string | null;
  weightKg: number | null;
  birthDate: Date | null;
  avatarUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
