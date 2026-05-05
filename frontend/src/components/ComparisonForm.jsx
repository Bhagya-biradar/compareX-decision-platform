import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const createEmptyState = () => ({
  title: '',
  options: ['', ''],
  criteria: [{ name: '', weight: 1 }],
  scores: {},
});

const normalizeData = (data) => {
  if (!data) {
    return createEmptyState();
  }

  return {
    title: data.title || '',
    options: data.options?.length ? [...data.options] : ['', ''],
    criteria: data.criteria?.length ? data.criteria.map((criterion) => ({ name: criterion.name || '', weight: criterion.weight ?? 1 })) : [{ name: '', weight: 1 }],
    scores: data.scores || {},
  };
};

const ComparisonForm = ({ initialData, submitLabel = 'Save Comparison', loading = false, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [criteria, setCriteria] = useState([{ name: '', weight: 1 }]);
  const [scores, setScores] = useState({});

  useEffect(() => {
    const normalized = normalizeData(initialData);
    setTitle(normalized.title);
    setOptions(normalized.options);
    setCriteria(normalized.criteria);
    setScores(normalized.scores);
  }, [initialData]);

  const addOption = () => {
    setOptions((current) => [...current, '']);
  };

  const removeOption = (index) => {
    setOptions((current) => {
      if (current.length <= 2) {
        toast.error('At least two options are required');
        return current;
      }

      const optionToRemove = current[index];
      const nextOptions = current.filter((_, optionIndex) => optionIndex !== index);

      setScores((currentScores) => {
        const nextScores = { ...currentScores };
        delete nextScores[optionToRemove];
        return nextScores;
      });

      return nextOptions;
    });
  };

  const updateOption = (index, value) => {
    setOptions((current) => {
      const nextOptions = [...current];
      const previousValue = nextOptions[index];
      nextOptions[index] = value;

      if (previousValue !== value) {
        setScores((currentScores) => {
          const nextScores = { ...currentScores };
          nextScores[value] = { ...(nextScores[previousValue] || {}) };
          if (previousValue && previousValue !== value) {
            delete nextScores[previousValue];
          }
          return nextScores;
        });
      }

      return nextOptions;
    });
  };

  const addCriterion = () => {
    setCriteria((current) => [...current, { name: '', weight: 1 }]);
  };

  const removeCriterion = (index) => {
    setCriteria((current) => {
      if (current.length <= 1) {
        toast.error('At least one criterion is required');
        return current;
      }

      const criterionToRemove = current[index];
      const nextCriteria = current.filter((_, criterionIndex) => criterionIndex !== index);

      setScores((currentScores) => {
        const nextScores = {};
        Object.entries(currentScores).forEach(([option, optionScores]) => {
          nextScores[option] = { ...optionScores };
          delete nextScores[option][criterionToRemove.name];
        });
        return nextScores;
      });

      return nextCriteria;
    });
  };

  const updateCriterion = (index, field, value) => {
    setCriteria((current) => {
      const nextCriteria = [...current];
      const previousCriterion = nextCriteria[index];
      const updatedCriterion = {
        ...previousCriterion,
        [field]: field === 'weight' ? value : value,
      };
      nextCriteria[index] = updatedCriterion;

      if (field === 'name' && previousCriterion.name !== value) {
        setScores((currentScores) => {
          const nextScores = {};
          Object.entries(currentScores).forEach(([option, optionScores]) => {
            nextScores[option] = { ...optionScores };
            nextScores[option][value] = nextScores[option][previousCriterion.name];
            if (previousCriterion.name && previousCriterion.name !== value) {
              delete nextScores[option][previousCriterion.name];
            }
          });
          return nextScores;
        });
      }

      return nextCriteria;
    });
  };

  const updateScore = (option, criterion, value) => {
    setScores((current) => ({
      ...current,
      [option]: {
        ...(current[option] || {}),
        [criterion]: value,
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const normalizedOptions = options.map((option) => option.trim()).filter(Boolean);
    const normalizedCriteria = criteria
      .map((criterion) => ({
        name: criterion.name.trim(),
        weight: Number(criterion.weight),
      }))
      .filter((criterion) => criterion.name);

    if (!normalizedTitle) {
      toast.error('Title is required');
      return;
    }

    if (normalizedOptions.length < 2) {
      toast.error('Add at least two options');
      return;
    }

    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      toast.error('Option names must be unique');
      return;
    }

    if (normalizedCriteria.length < 1) {
      toast.error('Add at least one criterion');
      return;
    }

    if (new Set(normalizedCriteria.map((criterion) => criterion.name)).size !== normalizedCriteria.length) {
      toast.error('Criterion names must be unique');
      return;
    }

    const normalizedScores = {};
    normalizedOptions.forEach((option) => {
      normalizedScores[option] = {};
      normalizedCriteria.forEach((criterion) => {
        normalizedScores[option][criterion.name] = Number(scores?.[option]?.[criterion.name] || 0);
      });
    });

    onSubmit({
      title: normalizedTitle,
      options: normalizedOptions,
      criteria: normalizedCriteria,
      scores: normalizedScores,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="comparex-card p-6">
        <label className="comparex-label" htmlFor="title">
          Comparison Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Goa vs Manali"
          className="comparex-input mt-2"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="comparex-card p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Options</h3>
            <button type="button" onClick={addOption} className="comparex-button-secondary text-sm">
              <Plus className="h-4 w-4" />
              Add Option
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {options.map((option, index) => (
              <div key={`option-${index}`} className="flex gap-3">
                <input
                  type="text"
                  value={option}
                  onChange={(event) => updateOption(index, event.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="comparex-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="rounded-2xl border border-slate-200 px-4 text-slate-500 transition hover:border-rose-300 hover:text-rose-500 dark:border-slate-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="comparex-card p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Criteria</h3>
            <button type="button" onClick={addCriterion} className="comparex-button-secondary text-sm">
              <Plus className="h-4 w-4" />
              Add Criterion
            </button>
          </div>
          <div className="mt-5 space-y-4">
            {criteria.map((criterion, index) => (
              <div key={`criterion-${index}`} className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                <input
                  type="text"
                  value={criterion.name}
                  onChange={(event) => updateCriterion(index, 'name', event.target.value)}
                  placeholder={`Criterion ${index + 1}`}
                  className="comparex-input"
                />
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={criterion.weight}
                  onChange={(event) => updateCriterion(index, 'weight', event.target.value)}
                  placeholder="Weight"
                  className="comparex-input"
                />
                <button
                  type="button"
                  onClick={() => removeCriterion(index)}
                  className="rounded-2xl border border-slate-200 px-4 text-slate-500 transition hover:border-rose-300 hover:text-rose-500 dark:border-slate-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="comparex-card p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Scores</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Enter a score for every option and criterion</p>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  Option / Criterion
                </th>
                {criteria.map((criterion, index) => (
                  <th key={`criterion-header-${index}`} className="px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {criterion.name || `Criterion ${index + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {options.map((option, optionIndex) => (
                <tr key={`score-row-${optionIndex}`} className="border-t border-slate-200/80 dark:border-slate-800">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-slate-900 dark:bg-slate-900 dark:text-white">
                    {option || `Option ${optionIndex + 1}`}
                  </td>
                  {criteria.map((criterion, criterionIndex) => (
                    <td key={`score-cell-${optionIndex}-${criterionIndex}`} className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={scores?.[option]?.[criterion.name] ?? ''}
                        onChange={(event) => updateScore(option, criterion.name, event.target.value)}
                        className="comparex-input min-w-[120px]"
                        placeholder="0"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="submit" disabled={loading} className="comparex-button-primary">
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ComparisonForm;
