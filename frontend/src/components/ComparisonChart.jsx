import { Bar } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { createChartData } from '../utils/score.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ComparisonChart = ({ comparison }) => {
  const data = createChartData(comparison);

  return (
    <div className="comparex-card p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-500">Weighted result</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">Score comparison</h3>
        </div>
      </div>
      <Bar
        data={data}
        options={{
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              ticks: { color: '#64748b' },
              grid: { color: 'rgba(148, 163, 184, 0.15)' },
            },
            y: {
              ticks: { color: '#64748b' },
              grid: { color: 'rgba(148, 163, 184, 0.15)' },
            },
          },
        }}
      />
    </div>
  );
};

export default ComparisonChart;
