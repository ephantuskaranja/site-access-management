import { UserRole } from '../types';

export const SITE_OPTIONS = [
  'South Site',
  'Northsite',
  'Choice Meats',
  'Kasarani',
  'Uplands',
  'Kinangop',
  'Eldoret',
  'Main Gate',
  'Reception',
  'Others',
] as const;

export type SiteOption = (typeof SITE_OPTIONS)[number];

const ROLE_SITE_SCOPE: Partial<Record<UserRole, readonly SiteOption[]>> = {
  [UserRole.ADMIN]: SITE_OPTIONS,
  [UserRole.SECURITY_GUARD]: SITE_OPTIONS,
  [UserRole.RECEPTIONIST]: SITE_OPTIONS,
  [UserRole.LOGISTICS_MANAGER]: SITE_OPTIONS,
};

export const getAllowedSitesForRole = (role?: UserRole): SiteOption[] => {
  if (!role) return [...SITE_OPTIONS];
  return [...(ROLE_SITE_SCOPE[role] || SITE_OPTIONS)];
};

export const isValidSite = (value: unknown): value is SiteOption => {
  if (typeof value !== 'string') return false;
  return SITE_OPTIONS.includes(value as SiteOption);
};
