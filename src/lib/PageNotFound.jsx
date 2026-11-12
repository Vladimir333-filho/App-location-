import { Link, useLocation } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-bold text-slate-300">404</h1>
          <div className="h-0.5 w-16 bg-slate-200 mx-auto"></div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-slate-800">
            Página não encontrada
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm">
            A página <span className="font-semibold text-slate-700">"{pageName}"</span> não existe ou foi movida.
          </p>
        </div>

        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}