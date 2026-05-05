const weightOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

const displayTypeOptions = ['AMOLED', 'OLED', 'LTPO AMOLED', 'Super AMOLED', 'IPS LCD', 'LCD'];

const featureWeights = [
  { key: 'price', label: 'Price' },
  { key: 'battery', label: 'Battery' },
  { key: 'camera', label: 'Camera' },
  { key: 'processor', label: 'Processor' },
  { key: 'display', label: 'Display' },
  { key: 'storage', label: 'Storage' },
];

const FilterPanel = ({ filters, weights, onFilterChange, onWeightChange }) => {
  const toggleDisplayType = (value) => {
    const current = filters.displayTypes || [];
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    onFilterChange('displayTypes', next);
  };

  return (
    <aside className="comparex-card p-5 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Refine comparison</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Optional filters and priorities</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">Leave everything blank to compare the shortlist as-is. Use filters only when you want to narrow the results.</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <div>
          <label className="comparex-label" htmlFor="minPrice">Min price</label>
          <input id="minPrice" type="number" min="0" value={filters.minPrice} onChange={(event) => onFilterChange('minPrice', event.target.value)} placeholder="0" className="comparex-input mt-2" />
        </div>
        <div>
          <label className="comparex-label" htmlFor="maxPrice">Max price</label>
          <input id="maxPrice" type="number" min="0" value={filters.maxPrice} onChange={(event) => onFilterChange('maxPrice', event.target.value)} placeholder="100000" className="comparex-input mt-2" />
        </div>
        <div>
          <label className="comparex-label" htmlFor="minRam">Min RAM (GB)</label>
          <input id="minRam" type="number" min="0" value={filters.minRam} onChange={(event) => onFilterChange('minRam', event.target.value)} placeholder="8" className="comparex-input mt-2" />
        </div>
        <div>
          <label className="comparex-label" htmlFor="minBattery">Min battery (mAh)</label>
          <input id="minBattery" type="number" min="0" value={filters.minBattery} onChange={(event) => onFilterChange('minBattery', event.target.value)} placeholder="5000" className="comparex-input mt-2" />
        </div>
      </div>

      <div className="mt-6">
        <p className="comparex-label">Display types</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {displayTypeOptions.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleDisplayType(type)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filters.displayTypes?.includes(type) ? 'border-white bg-white text-slate-950' : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <p className="comparex-label">Choose priority</p>
        {featureWeights.map((feature) => (
          <div key={feature.key} className="grid grid-cols-[1fr_120px] items-center gap-3">
            <span className="text-sm text-slate-300">{feature.label}</span>
            <select value={weights[feature.key] ?? ''} onChange={(event) => onWeightChange(feature.key, event.target.value)} className="comparex-input py-2 text-sm">
              <option value="">Auto</option>
              {weightOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default FilterPanel;