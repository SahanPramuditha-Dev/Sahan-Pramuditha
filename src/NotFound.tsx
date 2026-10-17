import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bgMain text-textMain flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-3xl mb-6 shadow-sm">
        <i className="fas fa-compass"></i>
      </div>
      <h1 className="text-7xl font-black tracking-tight mb-2">404</h1>
      <h2 className="text-2xl font-bold mb-3">Page Not Found</h2>
      <p className="text-textMuted max-w-md text-sm mb-8 leading-relaxed">
        The destination you are looking for doesn't exist, was renamed, or has moved to another galaxy.
      </p>
      <Link 
        to="/" 
        className="px-6 py-3 rounded-full bg-textMain text-bgMain font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2"
      >
        <i className="fas fa-arrow-left"></i> Return Home
      </Link>
    </div>
  );
}
