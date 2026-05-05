import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import ComparisonTable from '../components/ComparisonTable.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { formatPriceDisplay, getLowestRealisticPrice } from '../utils/product.js';

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

const normalizeBestForTags = (bestForTags = []) =>
  (Array.isArray(bestForTags) ? bestForTags : [])
    .map((tag) => {
      if (typeof tag === 'string') {
        return tag;
      }

      if (tag && typeof tag === 'object' && typeof tag.tag === 'string') {
        return tag.tag;
      }

      return null;
    })
    .filter(Boolean);

const ComparisonPage = () => {
  const navigate = useNavigate();
  const [comparisonData, setComparisonData] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);

  useEffect(() => {
    const data = sessionStorage.getItem('comparisonData');
    if (!data) {
      toast.error('No comparison data found');
      navigate('/');
      return;
    }

    try {
      const parsed = JSON.parse(data);
      setComparisonData(parsed);
      setSelectedProduct(parsed.recommendedProduct?.id);
    } catch (error) {
      toast.error('Failed to load comparison');
      navigate('/');
    }
  }, [navigate]);

  const handleSelectProduct = (productId) => {
    setSelectedProduct(productId);
  };

  const handleGoToShop = () => {
    if (!selectedProduct) {
      toast.error('Select a product first');
      return;
    }

    const selected = comparisonData.products.find((p) => p.id === selectedProduct);
    if (!selected) {
      toast.error('Product not found');
      return;
    }

    // Store selected product in session
    sessionStorage.setItem('selectedProduct', JSON.stringify(selected));
    navigate('/shop');
  };

  if (!comparisonData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">Loading comparison...</p>
        </div>
      </div>
    );
  }

  const { products, recommendedProduct, bestForTags } = comparisonData;
  const tagLabels = normalizeBestForTags(bestForTags);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="space-y-2">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Comparison Results</h1>
        <p className="text-slate-400">Based on your preferences and filters</p>
      </section>

      {/* Step 1: Comparison Table */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">📊 Step 1: Side-by-Side Comparison</h2>
          <p className="mt-1 text-sm text-slate-400">Compare key specs across all phones</p>
        </div>
        <ComparisonTable
          products={products}
          recommendedId={recommendedProduct?.id}
        />
      </section>

      {/* Step 2: Recommendation */}
      {recommendedProduct && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white">🏆 Step 2: Our Recommendation</h2>
            <p className="mt-1 text-sm text-slate-400">Based on your preferences</p>
          </div>

          <div className="rounded-2xl border-2 border-green-500/50 bg-green-500/10 p-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-green-400">
                  {recommendedProduct.name}
                </h3>
                <p className="mt-2 text-slate-300">
                  {formatPriceDisplay(getLowestRealisticPrice(recommendedProduct))}
                </p>

                {recommendedProduct.explanation && (
                  <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-slate-300">
                    {recommendedProduct.explanation}
                  </p>
                )}

                {recommendedProduct.scoreBreakdown && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Overall Score</p>
                      <p className="text-lg font-bold text-white">
                        {recommendedProduct.scoreBreakdown.total?.toFixed(1) || '—'} / 100
                      </p>
                    </div>
                    {recommendedProduct.scoreBreakdown.processor && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Processor</p>
                        <p className="text-lg font-bold text-white">
                          {recommendedProduct.scoreBreakdown.processor?.toFixed(1) || '—'}
                        </p>
                      </div>
                    )}
                    {recommendedProduct.scoreBreakdown.battery && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Battery</p>
                        <p className="text-lg font-bold text-white">
                          {recommendedProduct.scoreBreakdown.battery?.toFixed(1) || '—'}
                        </p>
                      </div>
                    )}
                    {recommendedProduct.scoreBreakdown.price && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400">Value for Money</p>
                        <p className="text-lg font-bold text-white">
                          {recommendedProduct.scoreBreakdown.price?.toFixed(1) || '-'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {tagLabels.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold text-slate-400">Best For</p>
                    <div className="flex flex-wrap gap-2">
                      {tagLabels.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-green-600/30 px-3 py-1 text-xs font-medium text-green-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Step 3: Selection */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">🎯 Step 3: Make Your Selection</h2>
          <p className="mt-1 text-sm text-slate-400">Choose the phone you want to purchase</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelectProduct(product.id)}
              className={`overflow-hidden rounded-2xl border-2 transition ${
                selectedProduct === product.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="text-left">
                    <h3 className="font-semibold text-white">{product.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatPriceDisplay(getLowestRealisticPrice(product))}
                    </p>
                  </div>
                  {selectedProduct === product.id && (
                    <div className="h-6 w-6 rounded-full border-2 border-blue-500 bg-blue-500" />
                  )}
                </div>

                {product.specs && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                    {product.specs.chipset && (
                      <div>
                        <p className="font-medium">Processor</p>
                        <p className="text-slate-400 line-clamp-1">{product.specs.chipset}</p>
                      </div>
                    )}
                    {product.specs.ramGb > 0 && (
                      <div>
                        <p className="font-medium">RAM</p>
                        <p className="text-slate-400">{product.specs.ramGb} GB</p>
                      </div>
                    )}
                    {product.specs.batteryMah > 0 && (
                      <div>
                        <p className="font-medium">Battery</p>
                        <p className="text-slate-400">{product.specs.batteryMah} mAh</p>
                      </div>
                    )}
                    {product.specs.display && (
                      <div>
                        <p className="font-medium">Display</p>
                        <p className="text-slate-400 line-clamp-1">{formatDisplayValue(product.specs, product)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Step 4: Call to Action */}
      <section className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-lg border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition hover:bg-white/10"
        >
          ← Back to Compare
        </button>
        <button
          type="button"
          onClick={handleGoToShop}
          disabled={!selectedProduct}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          <ShoppingBag className="h-4 w-4" />
          View Prices & Offers
        </button>
      </section>

      {/* Detailed Specs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">📱 Detailed Specifications</h2>
        <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              recommended={product.id === recommendedProduct?.id}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ComparisonPage;
