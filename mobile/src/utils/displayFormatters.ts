export function formatINR(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return '₹0';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

export function formatDateShort(iso?: string | null): string {
  if (!iso) return '-';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso.slice(0, 10);
  }
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentBillingMonthIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}
