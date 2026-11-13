export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN')}`;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
}
