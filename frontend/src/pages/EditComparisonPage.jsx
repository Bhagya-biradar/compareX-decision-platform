import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ComparisonForm from '../components/ComparisonForm.jsx';
import { getComparisonById, updateComparison } from '../services/comparisonService.js';

const EditComparisonPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async (payload) => {
    try {
      setSaving(true);
      const updated = await updateComparison(id, payload);
      toast.success('Comparison updated successfully');
      navigate(`/comparisons/${updated._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update comparison');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-500">Edit comparison</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">Update your decision model</h1>
      </div>
      <ComparisonForm initialData={comparison} submitLabel="Update Comparison" loading={saving} onSubmit={handleSubmit} />
    </div>
  );
};

export default EditComparisonPage;
