import { getProcessorScore } from './processorScores.js';

const numberPattern = /(-?\d+(?:\.\d+)?)/;

const normalizeWhitespace = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const normalizeProductName = (value) =>
  normalizeWhitespace(value)
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/\b(5g|4g|lte|dual sim|single sim|unlocked|global|variant|new|plus|pro|max|mini|ultra)\b/g, ' ')
    .replace(/\b(\d+\s?(gb|tb))\b/g, ' ')
    .replace(/\b(colour|color|black|blue|green|silver|gold|graphite|midnight|starlight|white|pink|purple)\b/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value) => normalizeProductName(value).split(' ').filter(Boolean);

const similarityScore = (left, right) => {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));

  if (!leftTokens.size || !rightTokens.size) {
    return 0;
  }

  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  const overlap = intersection / union;
  const sharedPrefix = normalizeProductName(left).startsWith(normalizeProductName(right)) || normalizeProductName(right).startsWith(normalizeProductName(left));

  return Math.min(1, overlap + (sharedPrefix ? 0.2 : 0));
};

const toNumber = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const match = String(value || '').replace(/,/g, '').match(numberPattern);
  if (!match) {
    return 0;
  }

  return Number(match[1] || 0);
};

const parseBatteryMah = (value) => {
  const match = String(value || '').replace(/,/g, '').match(/(\d{3,5})\s*m?a?h?/i);
  return match ? Number(match[1]) : toNumber(value);
};

const parseRamGb = (value) => {
  const cleaned = String(value || '').toLowerCase();
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*gb/);
  return match ? Number(match[1]) : toNumber(value);
};

const parseStorageGb = (value) => {
  const cleaned = String(value || '').toLowerCase();
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(tb|gb)/);
  if (!match) {
    return toNumber(value);
  }

  const amount = Number(match[1]);
  return match[2] === 'tb' ? amount * 1024 : amount;
};

const parseCameraMp = (value) => {
  const cleaned = String(value || '').toLowerCase();
  const matches = [...cleaned.matchAll(/(\d+(?:\.\d+)?)\s*mp/g)].map((item) => Number(item[1]));
  if (matches.length) {
    return Math.max(...matches);
  }

  return toNumber(value);
};

const parseDisplaySizeInches = (value) => {
  const match = String(value || '').toLowerCase().match(/(\d+(?:\.\d+)?)\s*(?:in|inch|inches)/);
  return match ? Number(match[1]) : 0;
};

const parseDisplayType = (value) => {
  const normalized = normalizeWhitespace(value).toUpperCase();
  const candidates = ['LTPO AMOLED', 'AMOLED', 'POLED', 'OLED', 'SUPER AMOLED', 'PLS LCD', 'IPS LCD', 'LCD'];
  return candidates.find((candidate) => normalized.includes(candidate)) || normalized;
};

const parseReleaseDate = (value) => normalizeWhitespace(value);

const parsePrice = (value) => toNumber(value);

const normalizeSpecs = (rawSpecs = {}) => {
  const displayRaw = normalizeWhitespace(rawSpecs.display || rawSpecs.displayRaw || '');
  const cameraRaw = normalizeWhitespace(rawSpecs.camera || rawSpecs.cameraRaw || '');

  return {
    name: normalizeWhitespace(rawSpecs.name || ''),
    sourceUrl: rawSpecs.sourceUrl || '',
    chipset: normalizeWhitespace(rawSpecs.chipset || ''),
    processorScore: getProcessorScore(rawSpecs.chipset || ''),
    ramGb: parseRamGb(rawSpecs.ram || rawSpecs.memory || ''),
    storageGb: parseStorageGb(rawSpecs.storage || rawSpecs.internalStorage || ''),
    batteryMah: parseBatteryMah(rawSpecs.battery || rawSpecs.batteryCapacity || ''),
    display: {
      raw: displayRaw,
      sizeInches: parseDisplaySizeInches(displayRaw),
      type: parseDisplayType(displayRaw),
    },
    cameraMp: parseCameraMp(cameraRaw || rawSpecs.camera || ''),
    releaseDate: parseReleaseDate(rawSpecs.releaseDate || rawSpecs.launch || ''),
    price: parsePrice(rawSpecs.price || 0),
  };
};

const getDisplayQualityScore = (displayType = '') => {
  const normalized = String(displayType || '').toUpperCase();

  if (normalized.includes('LTPO AMOLED')) return 100;
  if (normalized.includes('AMOLED')) return 95;
  if (normalized.includes('OLED')) return 90;
  if (normalized.includes('POLED')) return 88;
  if (normalized.includes('SUPER AMOLED')) return 92;
  if (normalized.includes('IPS LCD')) return 58;
  if (normalized.includes('PLS LCD')) return 55;
  if (normalized.includes('LCD')) return 48;

  return 60;
};

const buildSpecGroups = (normalizedSpecs) => ({
  performance: {
    chipset: normalizedSpecs.chipset,
    processorScore: normalizedSpecs.processorScore,
    ramGb: normalizedSpecs.ramGb,
    storageGb: normalizedSpecs.storageGb,
  },
  display: {
    raw: normalizedSpecs.display.raw,
    sizeInches: normalizedSpecs.display.sizeInches,
    type: normalizedSpecs.display.type,
    qualityScore: getDisplayQualityScore(normalizedSpecs.display.type),
  },
  battery: {
    batteryMah: normalizedSpecs.batteryMah,
  },
  camera: {
    cameraMp: normalizedSpecs.cameraMp,
  },
  release: {
    releaseDate: normalizedSpecs.releaseDate,
  },
});

const buildDisplayLabel = (type, sizeInches) => {
  const parts = [];
  if (sizeInches) {
    parts.push(`${sizeInches} inch`);
  }
  if (type) {
    parts.push(type);
  }
  return parts.join(' - ');
};

export {
  buildDisplayLabel,
  buildSpecGroups,
  getDisplayQualityScore,
  normalizeProductName,
  normalizeSpecs,
  normalizeWhitespace,
  parseBatteryMah,
  parseCameraMp,
  parseDisplaySizeInches,
  parseDisplayType,
  parsePrice,
  parseReleaseDate,
  parseRamGb,
  parseStorageGb,
  similarityScore,
  toNumber,
};
