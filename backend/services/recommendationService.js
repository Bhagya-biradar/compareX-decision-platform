import {
  buildDisplayLabel,
  getDisplayQualityScore,
  normalizeProductName,
  normalizeWhitespace,
} from './normalizationService.js';

const weightMap = {
  low: 1,
  medium: 2,
  high: 3,
};

const parseWeight = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value || '').trim().toLowerCase();

  if (!normalized) {
    return 1;
  }

  if (normalized in weightMap) {
    return weightMap[normalized];
  }

  const numericValue = Number(normalized);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 1;
};

const normalizeWeights = (weights = {}) => ({
  price: parseWeight(weights.price ?? 1),
  battery: parseWeight(weights.battery ?? 1),
  camera: parseWeight(weights.camera ?? 1),
  processor: parseWeight(weights.processor ?? 1),
  display: parseWeight(weights.display ?? 1),
  storage: parseWeight(weights.storage ?? 1),
});

const collectRange = (values) => {
  const filtered = values.filter((value) => Number.isFinite(value) && value > 0);
  if (!filtered.length) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...filtered),
    max: Math.max(...filtered),
  };
};

const normalizeToScore = (value, range, reverse = false) => {
  if (!range.min && !range.max) {
    return 0;
  }

  if (range.min === range.max) {
    return 100;
  }

  const clamped = Math.min(range.max, Math.max(range.min, value));
  const normalized = ((clamped - range.min) / (range.max - range.min)) * 100;
  return reverse ? 100 - normalized : normalized;
};

const getLowestPrice = (product) =>
  [
    product.priceSummary?.priceRange?.lowestPrice,
    product.priceSummary?.lowestPrice,
    product.priceSummary?.bestDeal?.price,
    product.basePrice,
    product.specs?.price,
  ]
    .map((value) => Number(value))
    .filter((value) => {
      const normalizedName = normalizeProductName(product.name || product.normalizedName || '');
      const minimumPrice = /\biphone\b|\bapple\b/.test(normalizedName) ? 20000 : 10000;
      return Number.isFinite(value) && value >= minimumPrice && value <= 200000;
    })
    .sort((first, second) => first - second)[0] || 0;

const getDisplayScore = (product) => {
  const sizeScore = product.specs.display.sizeInches ? normalizeToScore(product.specs.display.sizeInches, { min: 5.5, max: 7.2 }) : 0;
  const qualityScore = getDisplayQualityScore(product.specs.display.type);
  return Math.round(sizeScore * 0.35 + qualityScore * 0.65);
};

const scoreProduct = (product, ranges, weights) => {
  const scores = {
    price: normalizeToScore(getLowestPrice(product), ranges.price, true),
    battery: normalizeToScore(product.specs.batteryMah || 0, ranges.battery),
    camera: normalizeToScore(product.specs.cameraMp || 0, ranges.camera),
    processor: normalizeToScore(product.specs.processorScore || 0, ranges.processor),
    display: getDisplayScore(product),
    storage: normalizeToScore(product.specs.storageGb || 0, ranges.storage),
  };

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0) || 1;
  const weightedScore = Object.entries(scores).reduce((sum, [key, score]) => sum + score * (weights[key] || 0), 0) / totalWeight;

  return {
    ...scores,
    total: Number(weightedScore.toFixed(2)),
  };
};

const explainRecommendation = (product) => {
  const reasons = [];

  if (product.scoreBreakdown.processor >= 80) {
    reasons.push('highest processor score');
  }

  if (product.scoreBreakdown.battery >= 70) {
    reasons.push('strong battery performance');
  }

  if (product.scoreBreakdown.price >= 70) {
    reasons.push('good price-to-value ratio');
  }

  if (!reasons.length) {
    reasons.push('balanced overall spec profile');
  }

  return `Best overall due to ${reasons.slice(0, 2).join(' and ')}`;
};

const assignBestForTags = (products) => {
  const tags = [];
  const sortedByProcessor = [...products].sort((first, second) => second.specs.processorScore - first.specs.processorScore);
  const sortedByCamera = [...products].sort((first, second) => second.specs.cameraMp - first.specs.cameraMp);
  const sortedByBattery = [...products].sort((first, second) => second.specs.batteryMah - first.specs.batteryMah);
  const sortedByPrice = [...products].sort((first, second) => (getLowestPrice(first) || Infinity) - (getLowestPrice(second) || Infinity));

  if (sortedByProcessor[0] && sortedByProcessor[0].specs.processorScore > 0) {
    tags.push('Best Gaming');
  }

  if (sortedByCamera[0] && sortedByCamera[0].specs.cameraMp > 0) {
    tags.push('Best Camera');
  }

  if (sortedByBattery[0] && sortedByBattery[0].specs.batteryMah > 0) {
    tags.push('Best Battery');
  }

  if (sortedByPrice[0]) {
    tags.push('Best Budget');
  }

  return tags;
};

const buildComparisonResponse = ({ products, weights = {} }) => {
  const normalizedWeights = normalizeWeights(weights);
  const ranges = {
    price: collectRange(products.map((product) => getLowestPrice(product))),
    battery: collectRange(products.map((product) => product.specs.batteryMah || 0)),
    camera: collectRange(products.map((product) => product.specs.cameraMp || 0)),
    processor: collectRange(products.map((product) => product.specs.processorScore || 0)),
    storage: collectRange(products.map((product) => product.specs.storageGb || 0)),
  };

  const scoredProducts = products.map((product, index) => {
    const id = product.id || `${normalizeProductName(product.name || '')}-${index}`;
    const specLabel = buildDisplayLabel(product.specs.display.type, product.specs.display.sizeInches);
    const scoreBreakdown = scoreProduct(product, ranges, normalizedWeights);

    return {
      ...product,
      id,
      displayLabel: specLabel,
      scoreBreakdown,
    };
  });

  const recommendedProduct = [...scoredProducts].sort((first, second) => second.scoreBreakdown.total - first.scoreBreakdown.total)[0] || null;
  const bestDeal = [...scoredProducts]
    .filter((product) => getLowestPrice(product))
    .sort((first, second) => (getLowestPrice(first) || Infinity) - (getLowestPrice(second) || Infinity))[0] || null;

  return {
    products: scoredProducts,
    recommendedProduct: recommendedProduct
      ? {
          ...recommendedProduct,
          explanation: explainRecommendation(recommendedProduct),
        }
      : null,
    bestDeal: bestDeal
      ? {
          id: bestDeal.id,
          name: bestDeal.name,
          price: getLowestPrice(bestDeal),
          store: bestDeal.priceSummary.bestDeal?.store || '',
          savings: bestDeal.priceSummary.bestDeal?.savings || 0,
        }
      : null,
    bestForTags: assignBestForTags(scoredProducts),
    weights: normalizedWeights,
  };
};

const passesFilters = (product, filters = {}) => {
  const price = getLowestPrice(product);
  const ram = product.specs.ramGb || 0;
  const battery = product.specs.batteryMah || 0;
  const displayType = normalizeWhitespace(product.specs.display.type || '').toLowerCase();

  if (filters.minPrice && price < Number(filters.minPrice)) {
    return false;
  }

  if (filters.maxPrice && price > Number(filters.maxPrice)) {
    return false;
  }

  if (filters.minRam && ram < Number(filters.minRam)) {
    return false;
  }

  if (filters.minBattery && battery < Number(filters.minBattery)) {
    return false;
  }

  if (filters.displayTypes?.length && !filters.displayTypes.some((type) => displayType.includes(String(type).toLowerCase()))) {
    return false;
  }

  return true;
};

export { assignBestForTags, buildComparisonResponse, normalizeWeights, passesFilters, scoreProduct };
