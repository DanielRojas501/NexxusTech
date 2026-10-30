import { useEffect, useState } from 'react';
import { GraduationCap, Inbox, Loader2 } from 'lucide-react';
import Pills from '@/components/sims/Pills';
import TutorCard from '@/components/asesores/TutorCard';
import ApplyTutorDialog from '@/components/asesores/ApplyTutorDialog';
import BookingDialog from '@/components/monetization/BookingDialog';
import AdBanner from '@/components/monetization/AdBanner';
import CheckoutSuccess from '@/components/monetization/CheckoutSuccess';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { isPremium } from '@/lib/monetization';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const SUBJECT_OPTIONS = [
  { id: 'Cálculo', label: 'Cálculo' },
  { id: 'Estática', label: 'Estática' },
  { id: 'Termodinámica', label: 'Termodinámica' },
  { id: 'Física', label: 'Física' },
  { id: 'Programación', label: 'Programación' },
  { id: 'Química', label: 'Química' },
  { id: 'Álgebra', label: 'Álgebra' },
];

const STATUS_LABEL = {
  pending: 'Por pagar',
  confirmed: 'Confirmada',
  completed: 'Completada',
};

export default function Asesores() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('todas');
  const [tutors, setTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [bookingTutor, setBookingTutor] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingTutors(true);
    api.entities.TutorProfile
      .filter(subject === 'todas' ? {} : { subjects_offered: subject }, { sort: '-total_sessions', limit: 50 })
      .then((page) => {
        if (!cancelled) setTutors(page || []);
      })
      .catch(() => {
        if (!cancelled) setTutors([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTutors(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subject]);

  useEffect(() => {
    let cancelled = false;
    api.entities.Booking
      .filter({}, { sort: '-created_date', limit: 50 })
      .then((page) => {
        if (!cancelled) {
          setBookings(page || []);
        }
      })
      .catch(() => {
        if (!cancelled) setBookings([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="space-y-10">
      <CheckoutSuccess />
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-dorado-300">Red de Asesores & Asesorías · ITS/UCA</span>
            <h1 className="text-3xl sm:text-4xl font-bold mt-2">Asesorías de ingeniería</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Agenda sesiones con ingenieros, egresados y estudiantes avanzados verificados. El pago se procesa con Stripe y la plataforma retiene el 15% de comisión.
            </p>
          </div>
          {user && !user.is_guest ? (
            user.is_tutor ? (
              <Badge className="bg-verde-500/15 text-verde-400 border-verde-500/40">Perfil de asesor activo</Badge>
            ) : (
              <Button variant="outline" onClick={() => setApplyOpen(true)}>
                <GraduationCap className="w-4 h-4 mr-1.5" /> Quiero ser asesor
              </Button>
            )
          ) : (
            <Button variant="outline" onClick={() => setApplyOpen(true)}>
              <GraduationCap className="w-4 h-4 mr-1.5" /> Quiero ser asesor
            </Button>
          )}
        </div>

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Pills
            options={[{ id: 'todas', label: 'Todas' }, ...SUBJECT_OPTIONS]}
            value={subject}
            onChange={setSubject}
          />
        </div>

        {loadingTutors ? (
          <div className="panel py-16 text-center text-muted-foreground"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></div>
        ) : tutors.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutors.map((t) => (
              <TutorCard key={t.id} tutor={t} onBook={setBookingTutor} />
            ))}
          </div>
        ) : (
          <div className="panel py-16 text-center">
            <Inbox className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Aún no hay asesores en esta materia.</p>
          </div>
        )}
      </section>

      {!isPremium(user) && <AdBanner variant="foot" />}

      {bookings.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Mis asesorías</h2>
          <div className="space-y-2">
            {bookings.map((b) => (
              <div key={b.id} className="panel p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-semibold">{b.tutor_name} · {b.subject}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {b.date} · {b.hours} h · ${Number(b.total_amount).toFixed(2)} MXN
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    b.status === 'confirmed'
                      ? 'border-verde-500/50 text-verde-400'
                      : b.status === 'completed'
                        ? 'border-border text-muted-foreground'
                        : 'border-dorado-500/50 text-dorado-300'
                  }
                >
                  {STATUS_LABEL[b.status] || b.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      <BookingDialog tutor={bookingTutor} open={!!bookingTutor} onClose={() => setBookingTutor(null)} />
      <ApplyTutorDialog open={applyOpen} onClose={() => setApplyOpen(false)} onCreated={() => setSubject('todas')} />
    </div>
  );
}