import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, fmt = 'MMM dd, yyyy'): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!d || isNaN(d.getTime())) return 'N/A';
    return format(d, fmt);
  } catch (e) {
    return 'N/A';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!d || isNaN(d.getTime())) return 'N/A';
    return format(d, 'MMM dd, yyyy HH:mm');
  } catch (e) {
    return 'N/A';
  }
}

export function formatTimeAgo(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!d || isNaN(d.getTime())) return 'N/A';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch (e) {
    return 'N/A';
  }
}

export function formatCurrency(amount: number | string | null | undefined, currency = 'USD', locale = 'en-US'): string {
  if (amount === null || amount === undefined) return 'N/A';
  const val = Number(amount);
  if (isNaN(val)) return 'N/A';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(val);
}

export function formatAge(dateOfBirth: string | Date): string {
  const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  const now = new Date();
  const years = now.getFullYear() - dob.getFullYear();
  const months = now.getMonth() - dob.getMonth();
  if (years === 0) return `${months}mo`;
  return `${years}y`;
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    DOCTOR: 'bg-green-100 text-green-800',
    PHARMACIST: 'bg-orange-100 text-orange-800',
    LAB_TECH: 'bg-yellow-100 text-yellow-800',
    NURSE: 'bg-pink-100 text-pink-800',
    RECEPTIONIST: 'bg-gray-100 text-gray-800',
    PATIENT: 'bg-cyan-100 text-cyan-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    LOW_STOCK: 'bg-orange-100 text-orange-800',
    OUT_OF_STOCK: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-red-100 text-red-800',
    DISPENSED: 'bg-green-100 text-green-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    URGENT: 'bg-red-100 text-red-800',
    STAT: 'bg-red-200 text-red-900 font-bold',
    ROUTINE: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.substring(0, length)}...`;
}

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function generateMRN(): string {
  const prefix = 'MRN';
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `${prefix}-${year}-${rand}`;
}
