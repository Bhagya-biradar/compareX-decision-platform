const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizeComparisonInput = (body) => {
  const title = (body.title || '').trim();
  const options = Array.isArray(body.options)
    ? body.options.map((option) => String(option || '').trim()).filter(Boolean)
    : [];

  const criteria = Array.isArray(body.criteria)
    ? body.criteria
        .map((criterion) => ({
          name: String(criterion?.name || '').trim(),
          weight: toNumber(criterion?.weight),
        }))
        .filter((criterion) => criterion.name)
    : [];

  const rawScores = body.scores && typeof body.scores === 'object' ? body.scores : {};
  const scores = {};

  options.forEach((option) => {
    scores[option] = {};
    criteria.forEach((criterion) => {
      const optionScores = rawScores[option] || {};
      scores[option][criterion.name] = toNumber(optionScores[criterion.name]);
    });
  });

  return { title, options, criteria, scores };
};

const calculateWinner = (options, criteria, scores) => {
  const totals = options.map((option) => {
    const total = criteria.reduce((sum, criterion) => {
      const optionScore = Number(scores?.[option]?.[criterion.name] || 0);
      return sum + optionScore * Number(criterion.weight || 0);
    }, 0);

    return { option, total };
  });

  totals.sort((first, second) => second.total - first.total);
  return {
    winner: totals[0]?.option || '',
    totals,
  };
};

export { normalizeComparisonInput, calculateWinner };
