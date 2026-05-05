import { ArrowUpRight, BadgeCheck, Flame, ShieldCheck, ShoppingCart, Star } from 'lucide-react';
import { compactNumber, formatPriceDisplay, getLowestRealisticPrice } from '../utils/product.js';

const RecommendationCard = ({ product, bestForTags = [] }) => {
  if (!product) {
    return (
      <section className="comparex-card p-6">
        <p className="text-sm text-slate-400">Run a comparison to see the best recommendation.</p>
      </section>
    );
  }

  const productTags = bestForTags
    .map((tag) => (typeof tag === 'string' ? { tag, productId: product.id } : tag))
    .filter((tag) => tag?.productId === product.id || !tag?.productId);
  const bestStore = product.priceSummary?.bestDeal;

  return (
    <section className="comparex-card overflow-hidden border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-black/65 to-black/90 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <span className="comparex-badge border-emerald-400/20 bg-emerald-400/10 text-emerald-100">
            <Star className="h-4 w-4" />
            Recommended product
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-200/80">Best overall choice</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">{product.name}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{product.explanation}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[340px]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Score</p>
            <p className="mt-2 text-3xl font-semibold text-white">{product.scoreBreakdown.total}</p>
            <p className="mt-1 text-xs text-slate-400">Weighted recommendation index</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Best deal</p>
            <p className="mt-2 text-2xl font-semibold text-white">{formatPriceDisplay(bestStore?.price ?? getLowestRealisticPrice(product))}</p>
            <p className="mt-1 text-xs text-slate-400">{bestStore?.store || 'Store pricing unavailable'}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {productTags.map((tag) => (
          <span key={tag.tag} className="comparex-chip border-emerald-400/20 bg-emerald-400/10 text-emerald-100">
            <BadgeCheck className="h-4 w-4" />
            {tag.tag}
          </span>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric label="Processor" value={compactNumber(product.specs.processorScore)} hint={product.specs.chipset || 'Unknown chipset'} icon={Flame} />
        <Metric label="Battery" value={compactNumber(product.specs.batteryMah, ' mAh')} hint="Battery capacity" icon={ShieldCheck} />
        <Metric label="Camera" value={compactNumber(product.specs.cameraMp, ' MP')} hint="Rear camera output" icon={ShoppingCart} />
        <Metric label="Storage" value={compactNumber(product.specs.storageGb, ' GB')} hint={product.displayLabel || 'Display not parsed'} icon={ArrowUpRight} />
      </div>

      <details className="mt-6 rounded-3xl border border-white/10 bg-black/40 p-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-white">View all specifications</summary>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <SpecGroup title="Performance" items={product.specGroups?.performance} />
          <SpecGroup title="Display" items={product.specGroups?.display} />
          <SpecGroup title="Battery" items={product.specGroups?.battery} />
          <SpecGroup title="Camera" items={product.specGroups?.camera} />
        </div>
      </details>
    </section>
  );
};

const Metric = ({ label, value, hint, icon: Icon }) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <Icon className="h-4 w-4 text-slate-300" />
    </div>
    <p className="mt-3 text-xl font-semibold text-white">{value}</p>
    <p className="mt-1 text-xs text-slate-400">{hint}</p>
  </div>
);

const SpecGroup = ({ title, items }) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{title}</p>
    <dl className="mt-4 space-y-3 text-sm">
      {Object.entries(items || {}).map(([key, value]) => (
        <div key={key} className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0">
          <dt className="text-slate-400">{key}</dt>
          <dd className="text-right font-medium text-white">{String(value ?? '—')}</dd>
        </div>
      ))}
    </dl>
  </div>
);

export default RecommendationCard;
