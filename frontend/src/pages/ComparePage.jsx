import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import ProductInput from '../components/ProductInput.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import { compareProducts, getProductSuggestions } from '../services/productService.js';
import { isUrl } from '../utils/product.js';

const defaultFilters = {
  minPrice: '',
  maxPrice: '',
  minRam: '',
  minBattery: '',
  displayTypes: [],
};

const defaultWeights = {
  price: 'medium',
  battery: 'medium',
  camera: 'medium',
  processor: 'medium',
  display: 'medium',
  storage: 'medium',
};

const ComparePage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('search');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [weights, setWeights] = useState(defaultWeights);
  const [editingShortlist, setEditingShortlist] = useState(false);

  // Handle product suggestions
  const handleQueryChange = (value) => {
    setQuery(value);
    
    if (value.trim().length < 2 || isUrl(value)) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const data = await getProductSuggestions(value.trim());
        setSuggestions(data.suggestions || []);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  };

  // Add product to shortlist
  const handleAddProduct = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      toast.error('Enter a product name or GSMArena URL');
      return;
    }

    const nextProduct = mode === 'url' || isUrl(trimmed) 
      ? { url: trimmed } 
      : { query: trimmed };
    const key = nextProduct.url || nextProduct.query;

    if (selectedProducts.some((item) => (item.url || item.query) === key)) {
      toast('Product already in shortlist');
      return;
    }

    setSelectedProducts((current) => [...current, nextProduct]);
    setQuery('');
    setSuggestions([]);
    toast.success('Product added');
  };

  // Select suggestion
  const handleSelectSuggestion = (suggestion) => {
    if (selectedProducts.some((item) => item.url === suggestion.url)) {
      toast('Model already in shortlist');
      return;
    }

    setSelectedProducts((current) => [
      ...current,
      { url: suggestion.url, query: suggestion.name, label: suggestion.name }
    ]);
    setQuery('');
    setSuggestions([]);
    toast.success('Model added');
  };

  // Remove product from shortlist
  const handleRemoveProduct = (product) => {
    setSelectedProducts((current) => 
      current.filter((p) => (p.url || p.query) !== (product.url || product.query))
    );
    toast.success('Product removed');
  };

  // Clear shortlist
  const handleClearShortlist = () => {
    if (selectedProducts.length === 0) {
      toast.error('Shortlist is already empty');
      return;
    }
    setSelectedProducts([]);
    toast.success('Shortlist cleared');
  };

  // Compare products and navigate
  const handleCompare = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Add at least one phone to compare');
      return;
    }

    try {
      setLoadingCompare(true);
      const result = await compareProducts({
        products: selectedProducts,
        filters,
        weights
      });
      
      // Store comparison data in session
      sessionStorage.setItem('comparisonData', JSON.stringify({
        products: result.products,
        recommendedProduct: result.recommendedProduct,
        bestForTags: result.bestForTags,
        bestDeal: result.bestDeal,
        filters,
        weights
      }));
      
      toast.success('Comparison ready');
      navigate('/comparison');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Comparison failed');
    } finally {
      setLoadingCompare(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Compare Mobile Phones</h1>
          <p className="mt-2 text-slate-400">Select phones, set your preferences, and find the best match</p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Input & Selection */}
        <div className="space-y-6 lg:col-span-2">
          {/* Product Input */}
          <ProductInput
            mode={mode}
            query={query}
            onModeChange={setMode}
            onQueryChange={handleQueryChange}
            suggestions={suggestions}
            loadingSuggestions={loadingSuggestions}
            onAddProduct={handleAddProduct}
            onSelectSuggestion={handleSelectSuggestion}
            selectedCount={selectedProducts.length}
          />

          {/* Shortlist Controls */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setEditingShortlist(!editingShortlist)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              {editingShortlist ? '✓ Done' : '📝 Edit'}
            </button>
            <button
              type="button"
              onClick={handleClearShortlist}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
            <button
              type="button"
              onClick={handleCompare}
              disabled={selectedProducts.length === 0 || loadingCompare}
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingCompare ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Compare
            </button>
          </div>

          {/* Selected Products */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">
              Selected ({selectedProducts.length})
            </h3>
            {selectedProducts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map((product, index) => (
                  <div
                    key={`${product.url || product.query}-${index}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white"
                  >
                    <span>{product.label || product.query || product.url.split('/').pop()}</span>
                    {editingShortlist && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product)}
                        className="ml-1 rounded hover:bg-white/20"
                      >
                        <Plus className="h-4 w-4 rotate-45" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Add phones to get started</p>
            )}
          </div>
        </div>

        {/* Right Column: Filters & Weights */}
        <div className="space-y-6">
          <FilterPanel
            filters={filters}
            weights={weights}
            onFilterChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
            onWeightChange={(key, value) => setWeights((current) => ({ ...current, [key]: value }))}
          />
        </div>
      </div>
    </div>
  );
};

export default ComparePage;