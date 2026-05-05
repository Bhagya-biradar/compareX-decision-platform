import { ArrowUpRight, BadgePercent, BadgeCheck } from 'lucide-react';
import { formatInr, formatPriceDisplay, getLowestRealisticPrice, isRealisticPhonePrice } from '../utils/product.js';

const PriceComparisonSection = ({ products = [], selectedProductId, onSelectProduct, bestDeal }) => {
  const selectedProduct = products.find((product) => product.id === selectedProductId) || products[0];

  if (!selectedProduct) {
    return null;
  }

  const offers = (selectedProduct.priceOffers || []).filter((offer) => !offer.price || isRealisticPhonePrice(offer.price, selectedProduct.name));

  return (
    <section className="comparex-card p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Price intelligence</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Store comparison for {selectedProduct.name}</h3>
        </div>
        {products.length > 1 ? (
          <select value={selectedProduct.id} onChange={(event) => onSelectProduct(event.target.value)} className="comparex-input max-w-[320px] py-2 text-sm">
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Lowest price" value={formatPriceDisplay(getLowestRealisticPrice(selectedProduct))} icon={BadgeCheck} />
        <SummaryCard label="Highest price" value={formatPriceDisplay(selectedProduct.priceSummary?.priceRange?.highestPrice)} icon={ArrowUpRight} />
        <SummaryCard label="Savings" value={formatPriceDisplay(selectedProduct.priceSummary?.bestDeal?.savings)} icon={BadgePercent} />
      </div>

      {bestDeal?.price ? (
        <div className="mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          Best deal badge: {bestDeal.store} at {formatInr(bestDeal.price)} with {formatInr(bestDeal.savings)} savings.
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.22em] text-slate-400">
            <tr>
              <th className="px-5 py-4">Store</th>
              <th className="px-5 py-4">Price</th>
              <th className="px-5 py-4">Availability</th>
              <th className="px-5 py-4">Offer</th>
              <th className="px-5 py-4">Link</th>
            </tr>
          </thead>
          <tbody>
            {offers.length ? (
              offers.map((offer) => {
                const isBest = selectedProduct.priceSummary?.bestDeal?.store === offer.store;
                return (
                  <tr key={`${selectedProduct.id}-${offer.store}`} className={`border-t border-white/10 ${isBest ? 'bg-emerald-400/10' : ''}`}>
                    <td className="px-5 py-4 font-semibold text-white">{offer.store}</td>
                    <td className="px-5 py-4 text-slate-200">{formatPriceDisplay(offer.price)}</td>
                    <td className="px-5 py-4 text-slate-300">{offer.availability || '—'}</td>
                    <td className="px-5 py-4 text-slate-300">{offer.offer || '—'}</td>
                    <td className="px-5 py-4">
                      <a href={offer.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10">
                        Buy
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="px-5 py-8 text-center text-sm text-slate-400">
                  No store prices were found for this device.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const SummaryCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <Icon className="h-4 w-4 text-slate-300" />
    </div>
    <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
  </div>
);

export default PriceComparisonSection;
