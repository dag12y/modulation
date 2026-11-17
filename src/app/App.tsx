import { AppShell } from '@/components/layout/AppShell';
import { Router, Link, usePath } from './router';
import { Dashboard } from '@/pages/Dashboard';
import { Experiment } from '@/pages/Experiment';
import { Comparison } from '@/pages/Comparison';
import { Demodulation } from '@/pages/Demodulation';
import { Theory } from '@/pages/Theory';
import { Calculations } from '@/pages/Calculations';
import { Export } from '@/pages/Export';
import { getExperiment } from '@/data/experiments';
function Pages() {
  const path = usePath();
  const e = getExperiment(path.split('/')[2]);
  let page;
  if (path === '/' || path === '/experiments') page = <Dashboard />;
  else if (path.startsWith('/experiments/') && e)
    page = <Experiment key={e.id} experiment={e} />;
  else if (path === '/comparison') page = <Comparison />;
  else if (path === '/demodulation') page = <Demodulation />;
  else if (path === '/theory') page = <Theory />;
  else if (path === '/calculations') page = <Calculations />;
  else if (path === '/export') page = <Export />;
  else
    page = (
      <section className="card not-found">
        <span className="eyebrow">SIGNAL NOT FOUND · 404</span>
        <h1>Let's get back on frequency.</h1>
        <p>This page doesn't exist. Your laboratory is right here.</p>
        <Link className="button button-primary" to="/">
          Return to dashboard
        </Link>
      </section>
    );
  return <AppShell>{page}</AppShell>;
}
export default function App() {
  return (
    <Router>
      <Pages />
    </Router>
  );
}
