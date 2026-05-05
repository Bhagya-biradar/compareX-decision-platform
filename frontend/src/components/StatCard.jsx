const StatCard = ({ label, value, hint }) => (
  <div className="comparex-card p-5">
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    <h3 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{value}</h3>
    {hint ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{hint}</p> : null}
  </div>
);

export default StatCard;
