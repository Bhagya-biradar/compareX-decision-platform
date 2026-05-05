import { formatPriceDisplay, getLowestRealisticPrice } from '../utils/product.js';

const getBestValues = (products) => ({
  price: Math.min(...products.map(getLowestRealisticPrice).filter(Boolean)),
  processor: Math.max(...products.map((product) => product.specs?.processorScore || 0)),
  battery: Math.max(...products.map((product) => product.specs?.batteryMah || 0)),
  camera: Math.max(...products.map((product) => product.specs?.cameraMp || 0)),
  storage: Math.max(...products.map((product) => product.specs?.storageGb || 0)),
});

const isBest = (value, bestValue) => Boolean(value && bestValue && value === bestValue);

const BestValue = ({ active, children }) => (
  <span className={active ? 'rounded-full bg-emerald-400/15 px-2 py-1 font-semibold text-emerald-200' : ''}>
    {children}
  </span>
);

const ComparisonTable = ({ products = [], recommendedId }) => {
  if (!products.length) {
    return null;
  }

  const bestValues = getBestValues(products);

  return (
    <section className="comparex-card overflow-hidden">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Comparison table</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Side-by-side score and spec view</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="text-xs uppercase tracking-[0.22em] text-slate-400">
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Processor</th>
              <th className="px-6 py-4">Battery</th>
              <th className="px-6 py-4">Camera</th>
              <th className="px-6 py-4">Display</th>
              <th className="px-6 py-4">Storage</th>
              <th className="px-6 py-4">Best store</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const isRecommended = product.id === recommendedId;
              const lowestPrice = getLowestRealisticPrice(product);
              return (
                <tr key={product.id} className={`border-t border-white/10 ${isRecommended ? 'bg-emerald-400/10' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-white">{product.name}</span>
                      <span className="text-xs text-slate-400">{isRecommended ? 'Recommended' : product.displayLabel || 'Mobile phone'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">{product.scoreBreakdown?.total ?? '-'}</td>
                  <td className="px-6 py-4 text-white">
                    <BestValue active={isBest(lowestPrice, bestValues.price)}>{formatPriceDisplay(lowestPrice)}</BestValue>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    <BestValue active={isBest(product.specs?.processorScore, bestValues.processor)}>{product.specs?.processorScore || '-'}</BestValue>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    <BestValue active={isBest(product.specs?.batteryMah, bestValues.battery)}>
                      {product.specs?.batteryMah ? `${product.specs.batteryMah} mAh` : '-'}
                    </BestValue>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    <BestValue active={isBest(product.specs?.cameraMp, bestValues.camera)}>
                      {product.specs?.cameraMp ? `${product.specs.cameraMp} MP` : '-'}
                    </BestValue>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{product.displayLabel || product.specs?.display?.raw || '-'}</td>
                  <td className="px-6 py-4 text-slate-300">
                    <BestValue active={isBest(product.specs?.storageGb, bestValues.storage)}>
                      {product.specs?.storageGb ? `${product.specs.storageGb} GB` : '-'}
                    </BestValue>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{product.priceSummary?.bestDeal?.store || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ComparisonTable;
