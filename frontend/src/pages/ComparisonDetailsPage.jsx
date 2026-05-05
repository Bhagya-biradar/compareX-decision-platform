import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BarChart3, Pencil, Trash2, Trophy } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import DeleteModal from '../components/DeleteModal.jsx';
import ComparisonChart from '../components/ComparisonChart.jsx';
import { deleteComparison, getComparisonById } from '../services/comparisonService.js';
import { calculateTotals, formatDate } from '../utils/score.js';

const ComparisonDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const loadComparison = async () => {
      try {
        const data = await getComparisonById(id);
        setComparison(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load comparison');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadComparison();
  }, [id, navigate]);

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      await deleteComparison(id);
      toast.success('Comparison deleted');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete comparison');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner className="h-10 w-10" />
      </div>
    );
  }

  if (!comparison) {
    return null;
  }

  const totals = calculateTotals(comparison).sort((first, second) => second.total - first.total);
  const winningOption = comparison.result;

  return (
    <div className="space-y-8">
      <section className="comparex-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-500">Comparison details</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{comparison.title}</h1>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Created on {formatDate(comparison.createdAt)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={`/comparisons/${comparison._id}/edit`} className="comparex-button-secondary">
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
            <button type="button" onClick={() => setDeleteOpen(true)} className="comparex-button bg-rose-500 text-white hover:bg-rose-600">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-slate-100 p-5 dark:bg-slate-800/80">
            <p className="text-sm text-slate-500 dark:text-slate-400">Winner</p>
            <div className="mt-3 flex items-center gap-3 text-2xl font-semibold text-slate-950 dark:text-white">
              <Trophy className="h-6 w-6 text-amber-500" />
              {winningOption}
            </div>
          </div>
          <div className="rounded-3xl bg-slate-100 p-5 dark:bg-slate-800/80">
            <p className="text-sm text-slate-500 dark:text-slate-400">Options</p>
            <div className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{comparison.options.length}</div>
          </div>
          <div className="rounded-3xl bg-slate-100 p-5 dark:bg-slate-800/80">
            <p className="text-sm text-slate-500 dark:text-slate-400">Criteria</p>
            <div className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">{comparison.criteria.length}</div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ComparisonChart comparison={comparison} />
        <section className="comparex-card p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-sky-500" />
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Score Table</h2>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="pb-3 pr-4">Option</th>
                  <th className="pb-3 pr-4">Total Score</th>
                </tr>
              </thead>
              <tbody>
                {totals.map((item) => (
                  <tr key={item.option} className="border-b border-slate-100 dark:border-slate-800/80">
                    <td className="py-4 pr-4 font-medium text-slate-950 dark:text-white">{item.option}</td>
                    <td className="py-4 pr-4 text-slate-600 dark:text-slate-300">{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="comparex-card p-6">
        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Criteria Breakdown</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="pb-3 pr-4">Criterion</th>
                <th className="pb-3 pr-4">Weight</th>
                {comparison.options.map((option) => (
                  <th key={option} className="pb-3 pr-4">
                    {option}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.criteria.map((criterion) => (
                <tr key={criterion.name} className="border-b border-slate-100 dark:border-slate-800/80">
                  <td className="py-4 pr-4 font-medium text-slate-950 dark:text-white">{criterion.name}</td>
                  <td className="py-4 pr-4 text-slate-600 dark:text-slate-300">{criterion.weight}</td>
                  {comparison.options.map((option) => (
                    <td key={`${option}-${criterion.name}`} className="py-4 pr-4 text-slate-600 dark:text-slate-300">
                      {comparison.scores?.[option]?.[criterion.name] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DeleteModal
        open={deleteOpen}
        title="Delete comparison"
        description={`Delete ${comparison.title}? This cannot be undone.`}
        loading={deleteLoading}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ComparisonDetailsPage;
