import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="comparex-card p-6">
    <div className="inline-flex rounded-2xl bg-sky-500/10 p-3 text-sky-500 dark:text-sky-300">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">{title}</h3>
    <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{description}</p>
  </div>
);

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-hero-gradient px-6 py-16 text-white shadow-2xl shadow-slate-900/20 sm:px-10 lg:px-16">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium tracking-wide text-sky-100 backdrop-blur">
            Decision support platform
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Compare options with weighted scoring and keep the best decision on record.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            CompareX helps users score alternatives, compute objective winners, and store comparison history in a clean workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to={isAuthenticated ? '/dashboard' : '/register'} className="comparex-button-primary bg-white text-slate-950 hover:bg-slate-100 dark:bg-white dark:text-slate-950">
              {isAuthenticated ? 'Go to dashboard' : 'Get started'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="comparex-button border border-white/20 bg-white/10 text-white hover:bg-white/15">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <FeatureCard
          icon={SlidersHorizontal}
          title="Weighted scoring"
          description="Score each option against criteria, apply weights, and compute a result that is easy to audit."
        />
        <FeatureCard
          icon={BarChart3}
          title="Decision visibility"
          description="Review totals, inspect comparison details, and visualize winners with chart-based summaries."
        />
        <FeatureCard
          icon={ShieldCheck}
          title="Protected records"
          description="Your comparisons are private to your account and only you can edit or delete them."
        />
      </section>
    </div>
  );
};

export default HomePage;
