import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ExternalLink, Zap, Tag, Percent, AlertTriangle } from 'lucide-react';
import { getProductPrices } from '../services/productService.js';
import { getLowestRealisticPrice, isRealisticPhonePrice } from '../utils/product.js';

const formatDisplayValue = (specs = {}, product = {}) => {
  if (typeof specs.display === 'string' && specs.display.trim()) {
    return specs.display;
  }

  if (typeof product.displayLabel === 'string' && product.displayLabel.trim()) {
    return product.displayLabel;
  }

  const type = specs.display?.type || '';
  const size = specs.display?.sizeInches;
  if (type || size) {
    return `${type || ''}${size ? ` ${size}"` : ''}`.trim();
  }

  return '—';
};

const formatSpecNumber = (value, suffix = '') => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return String(value);
  }

  return `${numericValue.toLocaleString('en-IN')}${suffix}`;
};

const getStorePrices = (livePrices = {}, fallbackPrices = []) => {
  if (Array.isArray(livePrices.stores) && livePrices.stores.length) {
    return livePrices.stores;
  }

  if (Array.isArray(livePrices.prices) && livePrices.prices.length) {
    return livePrices.prices;
  }

  return Array.isArray(fallbackPrices) ? fallbackPrices : [];
};

const getStoreOffers = (livePrices = {}, selectedProduct = {}) => {
  const liveOffers = Array.isArray(livePrices?.stores)
    ? livePrices.stores.flatMap((store) =>
        (store.offers || []).map((offer) => ({
          ...offer,
          store: store.store,
        }))
      )
    : [];

  return [...liveOffers, ...(selectedProduct.offers || [])].slice(0, 12);
};

const getSpecGroup = (liveProduct = {}, selectedProduct = {}) => liveProduct.specGroups || selectedProduct.specGroups || {};

const ShopPage = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem('selectedProduct');
    if (!data) {
      toast.error('No product selected');
      navigate('/comparison');
      return;
    }

    try {
      const product = JSON.parse(data);
      setSelectedProduct(product);
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/comparison');
      return;
    }

    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    const fetchPrices = async () => {
      try {
        setLoadingPrices(true);
        const data = await getProductPrices({
          url: selectedProduct.sourceUrl,
          query: selectedProduct.name,
        });

        setPriceData(data);
      } catch (error) {
        setPriceData(null);
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPrices();
  }, [selectedProduct]);

  if (loading || !selectedProduct) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  const liveProduct = priceData?.product || selectedProduct;
  const livePrices = priceData?.prices;
  const productName = liveProduct.name || selectedProduct.name || '';
  const storePrices = getStorePrices(livePrices, selectedProduct.prices).filter((store) => !store.price || isRealisticPhonePrice(store.price, productName));
  const offers = getStoreOffers(livePrices, selectedProduct);
  const sortedStorePrices = [...storePrices].sort((a, b) => (a.price || Infinity) - (b.price || Infinity));
  const bestDeal = livePrices?.bestDeal || selectedProduct.priceSummary?.bestDeal || null;
  const startingPrice = getLowestRealisticPrice({
    ...selectedProduct,
    ...liveProduct,
    name: productName,
    priceSummary: livePrices?.priceRange || livePrices?.bestDeal
      ? {
          priceRange: livePrices.priceRange,
          bestDeal: livePrices.bestDeal,
        }
      : selectedProduct.priceSummary,
  });
  const specGroups = getSpecGroup(liveProduct, selectedProduct);
  const performanceSpecs = specGroups.performance || {};
  const displaySpecs = specGroups.display || {};
  const batterySpecs = specGroups.battery || {};
  const cameraSpecs = specGroups.camera || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            🛒 Shop {selectedProduct.name}
          </h1>
          <p className="mt-2 text-slate-400">Compare prices across stores</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/comparison')}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* Product Summary */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Product Info */}
          <div>
            <h2 className="text-2xl font-bold text-white">{liveProduct.name || selectedProduct.name}</h2>
            <p className="mt-3 text-slate-400">
              {liveProduct.brand || selectedProduct.brand || 'Mobile Phone'}
            </p>

                {liveProduct.specs && (
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold text-white">Key Specs</h3>
                <div className="grid gap-3 text-sm">
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-slate-400">Processor</span>
                        <span className="text-white">
                          {performanceSpecs.chipset || liveProduct.specs.chipset || '—'}
                          {performanceSpecs.processorScore ? ` (${performanceSpecs.processorScore})` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-slate-400">RAM</span>
                        <span className="text-white">{formatSpecNumber(performanceSpecs.ramGb || liveProduct.specs.ramGb, ' GB')}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-slate-400">Storage</span>
                        <span className="text-white">{formatSpecNumber(performanceSpecs.storageGb || liveProduct.specs.storageGb, ' GB')}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-slate-400">Battery</span>
                        <span className="text-white">{formatSpecNumber(batterySpecs.batteryMah || liveProduct.specs.batteryMah, ' mAh')}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-slate-400">Display</span>
                        <span className="text-white">
                          {formatDisplayValue(
                            displaySpecs.raw
                              ? { display: displaySpecs.raw }
                              : liveProduct.specs,
                            liveProduct
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Camera</span>
                        <span className="text-white">{formatSpecNumber(cameraSpecs.cameraMp || liveProduct.specs.cameraMp, ' MP')}</span>
                      </div>
                </div>
              </div>
            )}
          </div>

          {/* Price Highlight */}
          <div className="flex items-center justify-center">
            <div className="rounded-xl border-2 border-blue-500/50 bg-blue-500/10 p-8 text-center">
              <p className="text-sm font-semibold text-slate-400">Starting Price</p>
              <p className="mt-2 text-4xl font-bold text-blue-400">
                {startingPrice ? `₹${startingPrice.toLocaleString()}` : '-'}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {loadingPrices ? 'Updating live store prices...' : 'Find the best deal below'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Price Comparison */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">💰 Best Prices Across Stores</h2>
          <p className="mt-1 text-sm text-slate-400">Live prices from major retailers</p>
        </div>

        {sortedStorePrices.length > 0 ? (
          <div className="grid gap-4">
            {sortedStorePrices.map((priceData, index) => (
                <a
                  key={`${priceData.store}-${index}`}
                  href={priceData.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10 hover:border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-white">{priceData.store}</p>
                        {bestDeal?.store === priceData.store || index === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-600/30 px-2 py-1 text-xs font-semibold text-green-300">
                            <Zap className="h-3 w-3" />
                            Best Deal
                          </span>
                        ) : null}
                      </div>
                      {priceData.availability && (
                        <p className="mt-1 text-xs text-slate-400">{priceData.availability}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {priceData.price ? `₹${priceData.price.toLocaleString()}` : 'Check store'}
                      </p>
                      <ExternalLink className="mt-1 h-4 w-4 text-slate-400 group-hover:text-white" />
                    </div>
                  </div>
                </a>
              ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-slate-500" />
            <p className="mt-2 text-slate-400">Live price data could not be confirmed, so the saved comparison snapshot is shown instead.</p>
          </div>
        )}
      </section>

      {/* Offers Section */}
        {offers.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white">🎁 Available Offers</h2>
            <p className="mt-1 text-sm text-slate-400">Bank discounts, cashback & EMI options</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer, index) => (
              <div
                key={index}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start gap-3">
                  {offer.type === 'discount' && (
                    <Tag className="h-5 w-5 text-red-400 flex-shrink-0" />
                  )}
                  {offer.type === 'cashback' && (
                    <Percent className="h-5 w-5 text-green-400 flex-shrink-0" />
                  )}
                  {offer.type === 'emi' && (
                    <Zap className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-white">{offer.title || offer.description || 'Offer'}</p>
                    <p className="mt-1 text-sm text-slate-400">{offer.description}</p>
                    {offer.terms && (
                      <p className="mt-2 text-xs text-slate-500">{offer.terms}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-white">Ready to make a purchase?</p>
          <p className="mt-1 text-sm text-slate-400">
            Click the store link to proceed to checkout
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/comparison')}
            className="rounded-lg border border-white/10 px-6 py-2 font-medium text-white transition hover:bg-white/10"
          >
            Compare Again
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700"
          >
            Start New Comparison
          </button>
        </div>
      </section>
    </div>
  );
};

export default ShopPage;
