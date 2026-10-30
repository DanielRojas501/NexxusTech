import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/api/apiClient';

/**
 * Se monta en el layout: al volver de Stripe (?checkout=success&session_id=…)
 * verifica el pago con el backend y activa Premium o confirma la asesoría.
 */
export default function CheckoutSuccess() {
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success') return undefined;
    const sessionId = params.get('session_id');
    if (!sessionId) return undefined;

    let cancelled = false;
    (async () => {
      let ok = false;
      let kind = '';
      try {
        const res = await api.functions.invoke('verifyStripeSession', { session_id: sessionId });
        ok = !!res?.ok;
        kind = res?.kind || '';
      } catch {
        ok = false;
      }
      if (cancelled) return;
      toast({
        title: ok ? (kind === 'premium' ? '¡Premium activado!' : '¡Asesoría confirmada!') : 'Pago en revisión',
        description: ok
          ? kind === 'premium'
            ? 'Ya tienes acceso ilimitado y sin anuncios.'
            : 'El asesor recibió tu reserva. Revisa "Mis asesorías".'
          : 'La verificación del pago puede tardar unos minutos.',
      });
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      url.searchParams.delete('session_id');
      const clean = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '');
      setTimeout(() => {
        if (!cancelled) window.location.replace(clean);
      }, 1800);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}