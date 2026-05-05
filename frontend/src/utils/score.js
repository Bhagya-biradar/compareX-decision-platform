export const calculateTotals = (comparison) => {
  if (!comparison) {
    return [];
  }

  return comparison.options.map((option) => {
    const total = comparison.criteria.reduce((sum, criterion) => {
      const score = Number(comparison.scores?.[option]?.[criterion.name] || 0);
      return sum + score * Number(criterion.weight || 0);
    }, 0);

    return { option, total };
  });
};

export const createChartData = (comparison) => {
  const totals = calculateTotals(comparison);
  const colors = ['rgba(14, 165, 233, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(99, 102, 241, 0.8)', 'rgba(244, 114, 182, 0.8)'];

  return {
    labels: totals.map((entry) => entry.option),
    datasets: [
      {
        label: 'Weighted Score',
        data: totals.map((entry) => entry.total),
        backgroundColor: totals.map((_, index) => colors[index % colors.length]),
        borderRadius: 16,
      },
    ],
  };
};

export const formatDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
