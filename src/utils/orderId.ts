const PRODUCT_PREFIX: Record<string, string> = {
  hotel: 'BMH',
  flight: 'BMF',
  train: 'BMK',
  tour: 'BMT',
};

const randomToken = (length = 4): string => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => (byte % 36).toString(36).toUpperCase()).join('');
  }
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
};

export function createOrderId(product = 'hotel', date = new Date()): string {
  const prefix = PRODUCT_PREFIX[product] || 'BM';
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const time = date.getTime().toString(36).slice(-5).toUpperCase();
  return `${prefix}-${yy}${mm}${dd}-${time}${randomToken(3)}`;
}
