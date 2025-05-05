import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// Default timezone untuk aplikasi
const DEFAULT_TIMEZONE = 'Asia/Jakarta';

// Fungsi untuk format tanggal dengan timezone
export function formatDateWithTimezone(date: string | Date, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const zonedDate = toZonedTime(dateObj, DEFAULT_TIMEZONE);
  return format(zonedDate, formatStr);
}

// Fungsi untuk mendapatkan tanggal sekarang dengan timezone
export function getCurrentDateWithTimezone(): Date {
  return toZonedTime(new Date(), DEFAULT_TIMEZONE);
}

// Fungsi untuk konversi ke UTC
export function toUTC(date: Date): Date {
  return new Date(date.toISOString());
}

// Fungsi untuk konversi dari UTC ke timezone lokal
export function fromUTC(date: string | Date): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, DEFAULT_TIMEZONE);
} 