const processorScores = {
  'Apple A18 Pro': 100,
  'Apple A17 Pro': 97,
  'Apple A16 Bionic': 93,
  'Apple A15 Bionic': 89,
  'Snapdragon 8 Elite': 99,
  'Snapdragon 8 Gen 3': 96,
  'Snapdragon 8 Gen 2': 92,
  'Snapdragon 8+ Gen 1': 88,
  'Snapdragon 8 Gen 1': 84,
  'Snapdragon 7+ Gen 3': 82,
  'Snapdragon 7 Gen 3': 78,
  'Dimensity 9400': 98,
  'Dimensity 9300': 95,
  'Dimensity 9200+': 90,
  'Dimensity 8300': 83,
  'Exynos 2400': 91,
  'Exynos 2200': 81,
  'Google Tensor G4': 90,
  'Google Tensor G3': 84,
  'Google Tensor G2': 78,
  'Kirin 9000S': 79,
  'Kirin 9000': 80,
  'Helio G99': 62,
  'Helio G96': 58,
  'Helio G88': 54,
  'Unisoc T820': 55,
  'Unisoc T760': 50,
};

const normalizeLabel = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9+\s.-]/g, ' ').replace(/\s+/g, ' ').trim();

const getProcessorScore = (chipset) => {
  const label = String(chipset || '').trim();

  if (!label) {
    return 0;
  }

  const normalized = normalizeLabel(label);
  const exactMatch = Object.entries(processorScores).find(([key]) => normalizeLabel(key) === normalized);

  if (exactMatch) {
    return exactMatch[1];
  }

  const partialMatch = Object.entries(processorScores)
    .map(([key, score]) => ({ key, score, normalizedKey: normalizeLabel(key) }))
    .filter(({ normalizedKey }) => normalized.includes(normalizedKey) || normalizedKey.includes(normalized))
    .sort((first, second) => second.normalizedKey.length - first.normalizedKey.length)[0];

  if (partialMatch) {
    return partialMatch.score;
  }

  const snapdragon = normalized.match(/snapdragon\s*(\d)(?:\s*(?:gen|g)\s*(\d))?/i);
  if (snapdragon) {
    const series = Number(snapdragon[1] || 0);
    const generation = Number(snapdragon[2] || 0);
    return Math.min(100, 35 + series * 6 + generation * 2);
  }

  const dimensity = normalized.match(/dimensity\s*(\d{3,4})/i);
  if (dimensity) {
    const family = Number(dimensity[1] || 0);
    return Math.min(100, 40 + Math.floor(family / 12));
  }

  const tensor = normalized.match(/tensor\s*g?(\d)/i);
  if (tensor) {
    return Math.min(100, 60 + Number(tensor[1]) * 8);
  }

  const apple = normalized.match(/a(\d{2})\s*bionic|a(\d{2})\s*pro/i);
  if (apple) {
    const generation = Number(apple[1] || apple[2] || 0);
    return Math.min(100, 50 + generation);
  }

  return 40;
};

export { getProcessorScore, processorScores };