import { Check, Link2, Plus, Search, Smartphone, X } from 'lucide-react';
import { isUrl } from '../utils/product.js';

const ProductInput = ({ mode, query, onModeChange, onQueryChange, suggestions, loadingSuggestions, onAddProduct, onSelectSuggestion, selectedCount }) => {
  const showSuggestions = mode === 'search' && query.trim().length > 1;

  const handleSubmit = (event) => {
    event.preventDefault();
    onAddProduct();
  };

  return (
    <section className="comparex-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Input system</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Add phones by model name or GSMArena URL</h2>
        </div>
        <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => onModeChange('search')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${mode === 'search' ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'}`}
          >
            <Search className="h-4 w-4" />
            Product name
          </button>
          <button
            type="button"
            onClick={() => onModeChange('url')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${mode === 'url' ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'}`}
          >
            <Link2 className="h-4 w-4" />
            GSMArena URL
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={mode === 'search' ? 'Search exact models like iPhone 15 Pro Max 256GB' : 'Paste a GSMArena product URL'}
            className="comparex-input pr-32"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
            <Plus className="h-4 w-4" />
            Add phone
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <span className="comparex-badge">
            <Smartphone className="h-4 w-4" />
            {selectedCount} selected
          </span>
          {isUrl(query) && mode === 'search' ? <span className="comparex-chip">URL detected</span> : null}
        </div>
      </form>

      {showSuggestions ? (
        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-black/40">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm text-slate-400">
            <span>{loadingSuggestions ? 'Loading suggestions...' : 'Autocomplete suggestions'}</span>
            <span>{suggestions.length ? `${suggestions.length} found` : 'Exact-model match'}</span>
          </div>
          {suggestions.length ? (
            <div className="divide-y divide-white/8">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.url}
                  type="button"
                  onClick={() => onSelectSuggestion(suggestion)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-white/5"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Check className="h-4 w-4 text-emerald-400" />
                      {suggestion.name}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{suggestion.url.replace('https://www.gsmarena.com/', '')}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">Use</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-5 text-sm text-slate-400">No direct matches yet. Keep typing or paste a GSMArena URL.</div>
          )}
        </div>
      ) : null}
    </section>
  );
};

export default ProductInput;