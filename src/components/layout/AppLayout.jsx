import { useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { LayoutGrid, FlaskConical, Timer, LogOut, Sparkles, Flame, Zap, GraduationCap, Palette, Users } from 'lucide-react';
import { useState } from 'react';
import GlobalSearch from '@/components/search/GlobalSearch';
import { useAuth } from '@/lib/AuthContext';
import { touchStreak } from '@/lib/progress';
import { exitGuestSession } from '@/lib/guestStore';
import FeedbackFAB from '@/components/feedback/FeedbackFAB';
import StylePanel from '@/components/settings/StylePanel';
import CheckoutSuccess from '@/components/monetization/CheckoutSuccess';

const LINKS = [
  { to: '/', label: 'Materias', icon: LayoutGrid, end: true },
  { to: '/laboratorio', label: 'Laboratorio', icon: FlaskConical },
  { to: '/examen', label: 'Examen', icon: Timer },
  { to: '/catedra', label: 'Cátedra', icon: GraduationCap },
  { to: '/asesores', label: 'Asesores', icon: Users },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [styleOpen, setStyleOpen] = useState(false);
  const handleExit = () => {
    if (user?.is_guest) {
      exitGuestSession();
      window.location.href = '/login';
    } else {
      logout();
    }
  };
  useEffect(() => {
    if (user?.id) touchStreak().catch(() => {});
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background grid-bg">
      <header className="sticky top-0 z-40 bg-guindo-600 text-guindo-50 border-b-2 border-dorado-500 dark:bg-background/85 dark:text-foreground dark:border-dorado-700/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-guindo-800 to-dorado-500 grid place-items-center shadow-lg shadow-dorado-500/25 transition-transform group-hover:rotate-12">
              <Sparkles className="w-4 h-4 text-dorado-200" />
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">Apoyandote</span>
          </Link>
          <div className="flex-1 min-w-0 sm:mx-2 max-w-md">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <nav className="flex items-center gap-1">
              {LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/15 text-dorado-200 dark:bg-dorado-500/15 dark:text-dorado-300'
                        : 'text-guindo-100/85 hover:text-white hover:bg-white/10 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-secondary'
                    }`
                  }
                >
                  <l.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{l.label}</span>
                </NavLink>
              ))}
            </nav>
            {user && (
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="hidden sm:inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 dark:bg-secondary">LV {user.level || 1}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-dorado-200 dark:bg-secondary dark:text-dorado-300"><Zap className="w-3 h-3" />{user.xp_points || 0}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-dorado-200 dark:bg-secondary dark:text-dorado-300"><Flame className="w-3 h-3" />{user.streak_days || 0}</span>
              </div>
            )}
            <button
              onClick={() => setStyleOpen(true)}
              className="p-2 rounded-lg text-guindo-100/85 hover:text-white hover:bg-white/10 transition-colors dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-secondary"
              title="MI ESTILO ITS · Personalización de interfaz"
            >
              <Palette className="w-4 h-4" />
            </button>
            <button
              onClick={handleExit}
              className="p-2 rounded-lg text-guindo-100/85 hover:text-white hover:bg-white/10 transition-colors dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-secondary"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
      <StylePanel open={styleOpen} onClose={() => setStyleOpen(false)} />
      <CheckoutSuccess />
      {user?.is_guest && (
        <div className="border-b border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-center text-xs sm:text-sm text-emerald-200">
          Estás probando la versión prototipo como <strong>Invitado</strong>.{" "}
          <Link to="/register" className="font-medium underline hover:text-emerald-100">
            Crear cuenta para guardar progreso
          </Link>
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Outlet />
      </main>
      <FeedbackFAB />
    </div>
  );
}