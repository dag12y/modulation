import {
  Download,
  FileCode2,
  FileSpreadsheet,
  Image,
  Info,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
export function Export() {
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div className="eyebrow">
          <Upload size={14} /> TAKE YOUR WORK FURTHER
        </div>
        <h1>From the lab to your notebook.</h1>
        <p>
          Your future home for clean datasets and publication-ready signal
          plots.
        </p>
      </div>
      <section className="card export-overview">
        <div className="export-icon">
          <Download size={28} />
        </div>
        <div>
          <span className="badge">COMING IN THE SIMULATION PHASE</span>
          <h2>Good insights deserve to be shared.</h2>
          <p>
            Export tools will be available when real signal data is connected.
            No files are generated in this preview.
          </p>
        </div>
      </section>
      <div className="export-grid">
        {[
          {
            title: 'Signal data',
            format: 'CSV',
            icon: FileSpreadsheet,
            description:
              'Time samples, signal amplitudes, and frequency components for your own analysis.',
            meta: 'Structured data · Spreadsheet ready',
          },
          {
            title: 'Chart image',
            format: 'PNG',
            icon: Image,
            description:
              'Crisp waveform and spectrum images for lab reports, notes, and presentations.',
            meta: 'High resolution · Transparent options',
          },
          {
            title: 'Vector graphic',
            format: 'SVG',
            icon: FileCode2,
            description:
              'Scalable signal visualizations that stay sharp at any size, for print and publications.',
            meta: 'Resolution independent · Editable',
          },
        ].map((f) => (
          <article className="card export-card" key={f.format}>
            <div className="export-card-top">
              <f.icon size={25} />
              <span className="format-badge">.{f.format.toLowerCase()}</span>
            </div>
            <h2>{f.title}</h2>
            <p>{f.description}</p>
            <small>{f.meta}</small>
            <Button variant="outline" disabled>
              <Download size={14} /> Export {f.format}
              <span className="coming-inline">Soon</span>
            </Button>
          </article>
        ))}
      </div>
      <div className="educational-note">
        <Info size={17} />
        <span>
          Simulation sessions, saving, and real data export are planned for a
          later phase.
        </span>
      </div>
    </div>
  );
}
