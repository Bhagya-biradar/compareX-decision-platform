import { resolveGsmarenaProduct, searchGsmarenaProducts } from '../services/gsmarenaScraper.js';
import { scrapeStorePrices } from '../services/priceScraper.js';
import { buildComparisonResponse, passesFilters } from '../services/recommendationService.js';
import { buildSpecGroups, normalizeProductName } from '../services/normalizationService.js';

const buildInputList = (body) => {
  if (Array.isArray(body.products) && body.products.length) {
    return body.products;
  }

  if (body.url || body.query) {
    return [body];
  }

  return [];
};

const enrichProduct = async (input) => {
  const resolved = await resolveGsmarenaProduct(input);
  const priceSearchQuery = resolved.specs?.storageGb ? `${resolved.name} ${resolved.specs.storageGb}GB` : resolved.name;
  const priceSummary = await scrapeStorePrices(priceSearchQuery, [resolved.name, resolved.normalizedName, normalizeProductName(resolved.name)]);
  const specGroups = buildSpecGroups(resolved.specs);
  const offers = (priceSummary.stores || [])
    .flatMap((store) =>
      (store.offers || []).map((offer) => ({
        ...offer,
        store: store.store,
      }))
    )
    .slice(0, 12);

  return {
    ...resolved,
    specs: resolved.specs,
    specGroups,
    priceSummary,
    basePrice: priceSummary.priceRange?.lowestPrice,
    prices: (priceSummary.stores || []).map((store) => ({
      store: store.store,
      price: store.price,
      link: store.link,
      availability: store.availability || 'Available',
    })),
    offers,
    priceOffers: priceSummary.stores,
  };
};

const getSuggestions = async (req, res, next) => {
  try {
    const query = String(req.query.query || req.query.q || '').trim();

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const suggestions = await searchGsmarenaProducts(query);
    return res.json({ query, suggestions });
  } catch (error) {
    return next(error);
  }
};

const compareProducts = async (req, res, next) => {
  try {
    const inputs = buildInputList(req.body);

    if (!inputs.length) {
      return res.status(400).json({ message: 'At least one product input is required' });
    }

    const enriched = [];
    for (const input of inputs) {
      const product = await enrichProduct(input);
      enriched.push(product);
    }

    const filtered = enriched.filter((product) => passesFilters(product, req.body.filters || {}));

    if (!filtered.length) {
      return res.status(404).json({ message: 'No products matched the requested filters' });
    }

    const comparison = buildComparisonResponse({
      products: filtered,
      weights: req.body.weights || req.body.preferences || {},
    });

    return res.json({
      inputCount: inputs.length,
      resultCount: filtered.length,
      ...comparison,
    });
  } catch (error) {
    return next(error);
  }
};

const getPrices = async (req, res, next) => {
  try {
    const query = String(req.query.query || req.query.q || '').trim();
    const url = String(req.query.url || '').trim();

    if (!query && !url) {
      return res.status(400).json({ message: 'Query or URL is required' });
    }

    const product = await resolveGsmarenaProduct({ query, url });
    const priceSearchQuery = product.specs?.storageGb ? `${product.name} ${product.specs.storageGb}GB` : product.name;
    const prices = await scrapeStorePrices(priceSearchQuery, [product.name, product.normalizedName]);

    return res.json({
      product: {
        name: product.name,
        normalizedName: product.normalizedName,
        sourceUrl: product.sourceUrl,
        specs: product.specs,
        specGroups: buildSpecGroups(product.specs),
      },
      prices,
    });
  } catch (error) {
    return next(error);
  }
};

export { compareProducts, getPrices, getSuggestions };