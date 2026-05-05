export const formatInr = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatPriceDisplay = (value) => {
  if (value === null || value === undefined || value === '' || Number(value) <= 0) {
    return '-';
  }

  return formatInr(value);
};

export const formatNumber = (value, suffix = '') => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return `${numericValue.toLocaleString('en-IN')}${suffix}`;
};

export const weightLabel = (value) => {
  if (typeof value === 'number') {
    return value.toString();
  }

  const normalized = String(value || 'medium').toLowerCase();
  if (normalized === 'high') return 'High';
  if (normalized === 'low') return 'Low';
  return 'Medium';
};

export const isUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

export const isRealisticPhonePrice = (value, productName = '') => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return false;
  }

  const normalizedName = String(productName || '').toLowerCase();
  const minimumPrice = /\biphone\b|\bapple\b/.test(normalizedName) ? 20000 : 10000;
  return numericValue >= minimumPrice && numericValue <= 200000;
};

export const getLowestRealisticPrice = (product = {}) => {
  const productName = product.name || product.normalizedName || '';
  const candidates = [
    product.priceSummary?.priceRange?.lowestPrice,
    product.priceSummary?.lowestPrice,
    product.priceSummary?.bestDeal?.price,
    product.basePrice,
  ];

  const validPrices = candidates
    .map((value) => Number(value))
    .filter((value) => isRealisticPhonePrice(value, productName));

  return validPrices.length ? Math.min(...validPrices) : 0;
};

export const compactNumber = (value, suffix = '') => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return '-';
  }

  return `${numericValue.toLocaleString('en-IN')}${suffix}`;
};
