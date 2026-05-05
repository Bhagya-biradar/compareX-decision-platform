import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { deleteComparison, getComparisons } from '../services/comparisonService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ComparisonCard from '../components/ComparisonCard.jsx';
import DeleteModal from '../components/DeleteModal.jsx';
import SearchBar from '../components/SearchBar.jsx';
import StatCard from '../components/StatCard.jsx';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const loadComparisons = async () => {
      try {
        const data = await getComparisons();
        setComparisons(data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load comparisons');
      } finally {
        setLoading(false);
      }
    };

    loadComparisons();
  }, []);

  const filteredComparisons = useMemo(
    () =>
      comparisons.filter((comparison) => comparison.title.toLowerCase().includes(search.toLowerCase()) || comparison.result.toLowerCase().includes(search.toLowerCase())),
    [comparisons, search]
  );

  const recentComparisons = filteredComparisons.slice(0, 3);

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleteLoading(true);
      await deleteComparison(deleteTarget._id);
      setComparisons((current) => current.filter((comparison) => comparison._id !== deleteTarget._id));
      toast.success('Comparison deleted');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete comparison');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="comparex-card overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-600 dark:text-sky-300">
              <Sparkles className="h-4 w-4" />
              Decision dashboard
            </p>
            <h1 className="mt-5 text-3xl font-bold text-slate-950 dark:text-white sm:text-4xl">Welcome back, {user?.name || 'User'}</h1>
            <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
              Review your saved comparisons, find recent decisions, and create new weighted analyses from one place.
            </p>
          </div>
          <Link to="/comparisons/new" className="comparex-button-primary w-full lg:w-auto">
            <Plus className="h-4 w-4" />
            Create new comparison
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <StatCard label="Total Comparisons" value={loading ? '...' : comparisons.length} hint="Saved decision records" />
        <StatCard label="Recent Items" value={loading ? '...' : recentComparisons.length} hint="Latest comparisons shown below" />
        <StatCard label="Search Status" value={search ? 'Filtered' : 'All'} hint="Use search to narrow results" />
      </section>

      <section className="comparex-card p-6">
        <SearchBar value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Search by title or winner" />
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Recent Comparisons</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">Latest 3 items</span>
        </div>
        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <LoadingSpinner className="h-10 w-10" />
          </div>
        ) : recentComparisons.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {recentComparisons.map((comparison) => (
              <ComparisonCard key={comparison._id} comparison={comparison} onDelete={setDeleteTarget} />
            ))}
          </div>
        ) : (
          <div className="comparex-card p-8 text-center text-slate-600 dark:text-slate-300">No comparisons found yet.</div>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">All Comparisons</h2>
          <button type="button" onClick={() => navigate('/comparisons/new')} className="text-sm font-semibold text-sky-600 hover:underline dark:text-sky-300">
            Start a new decision
          </button>
        </div>
        {filteredComparisons.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredComparisons.map((comparison) => (
              <ComparisonCard key={comparison._id} comparison={comparison} onDelete={setDeleteTarget} />
            ))}
          </div>
        ) : (
          <div className="comparex-card p-8 text-center text-slate-600 dark:text-slate-300">
            {search ? 'No comparisons match your search.' : 'Your comparison library is empty.'}
          </div>
        )}
      </section>

      <DeleteModal
        open={Boolean(deleteTarget)}
        title="Delete comparison"
        description={`Delete ${deleteTarget?.title || 'this comparison'} permanently? This action cannot be undone.`}
        loading={deleteLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default DashboardPage;
