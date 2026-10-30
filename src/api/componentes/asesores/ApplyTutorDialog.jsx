import { useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import Pills from '@/components/sims/Pills';
import { api } from '@/api/apiClient';
import { SUBJECT_OPTIONS } from '@/pages/Asesores';

export default function ApplyTutorDialog({ open, onClose, onCreated }) {
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [credential, setCredential] = useState('');
  const [rate, setRate] = useState('150');
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = async () => {
    if (!fullName.trim() || !picked.length || !Number(rate)) {
      setError('Nombre, especialidades y tarifa son obligatorios.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.entities.TutorProfile.create({
        full_name: fullName.trim(),
        bio: bio.trim(),
        credential: credential.trim() || 'Estudiante avanzado',
        subjects_offered: picked,
        hourly_rate: Number(rate),
        rating: 5,
        total_sessions: 0,
        verified: false,
        sponsored: false,
      });
      await api.auth.updateMe({ is_tutor: true });
      onCreated?.();
      onClose?.();
    } catch (e) {
      setError(e?.message || 'No se pudo enviar la postulación.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-md space-y-4 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-dorado-300" /> Postúlate como Asesor Oficial</DialogTitle>
          <DialogDescription>
            Ingenieros, egresados y estudiantes avanzados: tu perfil entrará al directorio con comisión del 85% para ti.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Nombre público</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ing. María López" />
        </div>
        <div className="space-y-1.5">
          <Label>Especialidades</Label>
          <div className="flex flex-wrap">
            <Pills options={SUBJECT_OPTIONS} value="" onChange={toggle} />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {picked.map((p) => (
              <span key={p} className="rounded-full bg-dorado-500/15 text-dorado-300 px-2.5 py-0.5 text-[11px]">{p}</span>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Cédula profesional o semestre</Label>
          <Input value={credential} onChange={(e) => setCredential(e.target.value)} placeholder="Cédula 1234567 · 8º semestre" />
        </div>
        <div className="space-y-1.5">
          <Label>Tarifa por hora (MXN)</Label>
          <Input type="number" min={50} step={10} value={rate} onChange={(e) => setRate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Descripción</Label>
          <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Experiencia, enfoque de enseñanza…" />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button onClick={submit} disabled={busy} className="w-full">
          {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <GraduationCap className="w-4 h-4 mr-1.5" />}
          Enviar postulación
        </Button>
      </DialogContent>
    </Dialog>
  );
}