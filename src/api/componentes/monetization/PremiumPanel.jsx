import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLANS, isPremium, openStripeCheckout } from '@/lib/monetization';

const BENEFITS = [
  'Laboratorios 3D ilimitados (Free: 3 consultas al día)',
  'Sin anuncios en toda la interfaz',
  'Simuladores de examen sin restricciones',
  'Exportación de reportes PDF ilimitada',
];

export default function PremiumPanel({ user }) {
  const premium = isPremium(user);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const upgrade = async (planId) => {
    if (premium) return;
    setBusy(planId);
    setError('');
    try {
      await openStripeCheckout({ kind: 'premium', interval: planId });
    } catch (e) {
      setError(e?.message || 'No se pudo iniciar la pasarela de pago.');
    } finally {
      setBusy('');
    }
  };

  return (
    <section id="premium" className="panel p-6 sm:p-8 border-dorado-500/30 bg-gradient-to-br from-guindo-800/10 via-card/60 to-dorado-500/10">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-dorado-500/15 text-dorado-300 px-3 py-1 text-xs font-medium">
            <Crown className="w-3.5 h-3.5" /> VÉRTICE 3D Premium
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">Acceso total, sin anuncios</h2>
          <ul className="space-y-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-verde-400 mt-0.5 shrink-0" /> {b}
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full lg:w-80 space-y-3">
          {premium ? (
            <div className="rounded-xl border border-verde-500/40 bg-verde-500/10 p-4 text-center text-sm text-verde-300 font-medium">
              <Crown className="w-5 h-5 mx-auto mb-1" /> Premium activo · Gracias por apoyar la plataforma
            </div>
          ) : user && !user.is_guest ? (
            <>
              {PLANS.map((plan) => (
                <Button
                  key={plan.id}
                  onClick={() => upgrade(plan.id)}
                  disabled={!!busy}
                  variant={plan.id === 'annual' ? 'default' : 'outline'}
                  className="w-full justify-between h-auto py-3"
                >
                  <span>
                    Premium {plan.label}
                    <span className="block text-xs opacity-75">{plan.price} {plan.unit}</span>
                  </span>
                  {busy === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                </Button>
              ))}
            </>
          ) : (
            <div className="rounded-xl border border-border bg-secondary/40 p-4 text-center text-sm space-y-2">
              <p className="text-muted-foreground">Inicia sesión o crea una cuenta para activar Premium.</p>
              <div className="flex gap-2 justify-center">
                <Link to="/login"><Button size="sm" variant="outline">Iniciar sesión</Button></Link>
                <Link to="/register"><Button size="sm">Crear cuenta</Button></Link>
              </div>
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <p className="text-[11px] text-muted-foreground text-center">Pago seguro con Stripe · Cancela cuando quieras</p>
        </div>
      </div>
    </section>
  );
}