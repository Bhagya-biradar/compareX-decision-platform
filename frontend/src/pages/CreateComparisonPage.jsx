import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ComparisonForm from '../components/ComparisonForm.jsx';
import { createComparison } from '../services/comparisonService.js';

const CreateComparisonPage = () => {
  const navigate = useNavigate();

  const handleSubmit = async (payload) => {
    try {
      const comparison = await createComparison(payload);
      toast.success('Comparison created successfully');
      navigate(`/comparisons/${comparison._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create comparison');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-500">New comparison</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">Create a weighted decision</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          Add your options, define criteria, and assign scores to see which choice wins.
        </p>
      </div>

      <ComparisonForm submitLabel="Create Comparison" onSubmit={handleSubmit} />
    </div>
  );
};

export default CreateComparisonPage;
