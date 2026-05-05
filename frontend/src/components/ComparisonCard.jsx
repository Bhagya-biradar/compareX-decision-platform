import { Link } from 'react-router-dom';
import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/score.js';

const ComparisonCard = ({ comparison, onDelete }) => (
  <article className="comparex-card flex h-full flex-col justify-between p-5">
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-500">Decision Result</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{comparison.title}</h3>
        </div>
        <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-300">
          Winner: {comparison.result}
        </span>
      </div>

      <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800/80">
          <span className="block text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Options</span>
          <span className="mt-1 block font-semibold text-slate-900 dark:text-white">{comparison.options.length}</span>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800/80">
          <span className="block text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Criteria</span>
          <span className="mt-1 block font-semibold text-slate-900 dark:text-white">{comparison.criteria.length}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <CalendarDays className="h-4 w-4" />
        {formatDate(comparison.createdAt)}
      </div>
    </div>

    <div className="mt-5 flex flex-wrap gap-3">
      <Link to={`/comparisons/${comparison._id}`} className="comparex-button-secondary flex-1">
        View
      </Link>
      <Link to={`/comparisons/${comparison._id}/edit`} className="comparex-button-secondary flex-1">
        <Pencil className="h-4 w-4" />
        Edit
      </Link>
      <button type="button" onClick={() => onDelete(comparison)} className="comparex-button flex-1 bg-rose-500 text-white hover:bg-rose-600">
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  </article>
);

export default ComparisonCard;
