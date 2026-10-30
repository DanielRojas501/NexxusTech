import { useMemo, useState } from 'react';
import { CalendarPlus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Pills from '@/components/sims/Pills';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { commissionOf, openStripeCheckout, todayKey } from '@/lib/monetization';

const HOURS = [
  { id: '1', label: '1 hora' },
  { id: '1.5', label: '1.5 horas' },
  { id: '2', label: '2 horas' },
];

export default function BookingDialog({ tutor, open, onClose }) {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('1');
  const [subject, setSubject] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const subjects = (tutor?.subjects_offered || []).map((s) => ({ id: s, label: s }));
  const total = useMemo(() => {
    const h = Number(hours) || 1;
    return Math.round((tutor?.hourly_rate || 0) * h * 100) / 100;
  }, [tutor, hours]);
  const commission = commissionOf(total);

  const confirm = async () => {
    if (!date) {
      setError('Elige la fecha de la sesión.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const booking = await api.entities.Booking.create({
        tutor_id: tutor.id,
        tutor_name: tutor.full_name,
        subject: subject || subjects[0]?.id || '',
        date,
        hours: Number(hours),
        total_amount: total,
        platform_commission: commission,
        status: 'pending',
      });
      await openStripeCheckout({
        kind: 'booking',
        booking_id: booking.id,
        amount: total,
        tutor_name: tutor.full_name,
      });
    } catch (e) {
      setError(e?.message || 'No se pudo iniciar la pasarela de pago.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle>Agendar asesoría</DialogTitle>
          <DialogDescription>
            Sesión con <strong>{tutor?.full_name}</strong> · ${tutor?.hourly_rate}/hora
          </DialogDescription>
        </DialogHeader>

        {!user || user.is_guest ? (
          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-center space-y-2">
            <p className="text-muted-foreground">Inicia sesión para agendar y pagar tu asesoría.</p>
            <a href="/login"><Button size="sm">Iniciar sesión</Button></a>
          </div>
        ) : (
          <>
            {subjects.length > 0 && (
              <div className="space-y-1.5">
                <Label>Materia</Label>
                <Pills options={subjects} value={subject || subjects[0]?.id} onChange={setSubject} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input type="date" min={todayKey()} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Duración</Label>
              <Pills options={HOURS} value={hours} onChange={setHours} />
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Tarifa del asesor</span><span className="font-mono">${(total - commission).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Comisión plataforma (15%)</span><span className="font-mono">${commission.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold border-t border-border pt-1"><span>Total a pagar</span><span className="font-mono text-dorado-300">${total.toFixed(2)} MXN</span></div>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button onClick={confirm} disabled={busy} className="w-full">
              {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CalendarPlus className="w-4 h-4 mr-1.5" />}
              Pagar y confirmar sesión
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">Pago seguro con Stripe · El asesor recibe el 85%</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}