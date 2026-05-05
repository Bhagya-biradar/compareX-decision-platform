import { ExternalLink, Gauge, Layers3 } from 'lucide-react';
import { compactNumber, formatInr, formatPriceDisplay, getLowestRealisticPrice } from '../utils/product.js';

const ProductCard = ({ product, recommended = false }) => {
  const bestDeal = product.priceSummary?.bestDeal;

  return (
    <article className={`comparex-card flex h-full flex-col p-5 ${recommended ? 'ring-1 ring-emerald-400/40' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{recommended ? 'Recommended pick' : 'Candidate phone'}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{product.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{product.displayLabel || 'Mobile phone'}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100">{product.scoreBreakdown?.total ?? '-'}</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InfoPill label="Price" value={formatPriceDisplay(getLowestRealisticPrice(product))} />
        <InfoPill label="Best store" value={bestDeal?.store || '-'} />
        <InfoPill label="Battery" value={compactNumber(product.specs?.batteryMah, ' mAh')} />
        <InfoPill label="Processor" value={compactNumber(product.specs?.processorScore)} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300">
        <span className="comparex-chip">
          <Gauge className="h-4 w-4" />
          {compactNumber(product.specs?.cameraMp, ' MP camera')}
        </span>
        <span className="comparex-chip">
          <Layers3 className="h-4 w-4" />
          {compactNumber(product.specs?.storageGb, ' GB storage')}
        </span>
      </div>

      <details className="mt-5 rounded-3xl border border-white/10 bg-black/40 p-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-white">Expand detailed specs</summary>
        <div className="mt-4 grid gap-4">
          <Section title="Performance" items={product.specGroups?.performance} />
          <Section title="Display" items={product.specGroups?.display} />
          <Section title="Battery" items={product.specGroups?.battery} />
          <Section title="Camera" items={product.specGroups?.camera} />
        </div>
      </details>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm text-slate-400">
        <span>{product.priceSummary?.bestDeal?.savings ? `${formatInr(product.priceSummary.bestDeal.savings)} savings` : 'Latest pricing'}</span>
        {product.sourceUrl ? (
          <a href={product.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-white transition hover:text-slate-200">
            GSMArena
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </article>
  );
};

const InfoPill = ({ label, value }) => (
  <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
    <p className="mt-2 text-sm font-semibold text-white">{value || '-'}</p>
  </div>
);

const Section = ({ title, items }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{title}</p>
    <dl className="mt-3 space-y-2 text-sm">
      {Object.entries(items || {}).map(([key, value]) => (
        <div key={key} className="flex items-start justify-between gap-4">
          <dt className="text-slate-400">{key}</dt>
          <dd className="text-right font-medium text-white">{String(value ?? '-')}</dd>
        </div>
      ))}
    </dl>
  </div>
);

export default ProductCard;
