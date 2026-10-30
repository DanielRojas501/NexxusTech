import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Plus, FileText, Lightbulb, Send, Lock } from 'lucide-react';
import { api } from '@/api/apiClient';
import { SUBJECTS } from '@/data/subjects';
import { isGuestSession } from '@/lib/guestStore';
import Pills from '@/components/sims/Pills';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const KINDS = [
  { id: 'tip', label: 'Tips del profe', icon: Lightbulb, empty: 'Aún no hay tips para esta materia. Sé el primero: comparte cómo evalúa tu profesor.' },
  { id: 'plantilla', label: 'Plantillas · exámenes pasados', icon: FileText, empty: 'Aún no hay plantillas para esta materia. Sube la estructura de un examen pasado o de una guía de estudio.' },
];

export default function Catedra() {
  const guest = isGuestSession();
  const [subject, setSubject] = useState(SUBJECTS[0].id);
  const [kind, setKind] = useState('tip');
  const [items, setItems] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [professor, setProfessor] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setItems(null);
    api.entities.ProfInsight.filter({ subject_id: subject, kind }, '-created_date', 50)
      .then(setItems)
      .catch(() => setItems([]));
  };
  useEffect(load, [subject, kind]);

  const submit = async () => {
    if (!title.trim() || !body.trim() || saving) return;
    setSaving(true);
    try {
      await api.entities.ProfInsight.create({
        subject_id: subject,
        kind,
        title: title.trim(),
        body: body.trim(),
        professor: professor.trim(),
      });
      setTitle('');
      setProfessor('');
      setBody('');
      setFormOpen(false);
      load();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const meta = KINDS.find((k) => k.id === kind);

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" /> Cátedra
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold mt-2">Tips de profesores</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Referencias colaborativas por materia: cómo evalúa cada profesor, qué capítulos enfoca y estructuras de exámenes pasados para practicar directamente en los simuladores.
        </p>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Pills options={SUBJECTS.map((s) => ({ id: s.id, label: s.name }))} value={subject} onChange={setSubject} />
      </div>
      <Pills options={KINDS.map((k) => ({ id: k.id, label: k.label }))} value={kind} onChange={setKind} />

      {guest && (
        <div className="panel p-4 flex items-center gap-3 border-amber-400/30 bg-amber-400/5 text-sm text-amber-200">
          <Lock className="w-4 h-4 shrink-0" />
          Como invitado no puedes consultar ni publicar referencias. <Link to="/register" className="underline font-medium">Crea una cuenta</Link> para participar en la Cátedra.
        </div>
      )}

      {!guest && (
        <div>
          {formOpen ? (
            <div className="panel p-5 space-y-3">
              <div className="font-semibold text-sm">Nueva referencia para esta materia</div>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (ej. 'Aplica exámenes sorpresa')" />
              <Input value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="Nombre o alias del profesor (opcional)" />
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={kind === 'tip' ? 'Describe la metodología: qué capítulos enfoca, si sorprende con quizzes, formato de sus exámenes…' : 'Estructura del examen o guía: número de preguntas, tipos de ejercicio, tiempo, temas…'}
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={submit} disabled={saving || !title.trim() || !body.trim()}>
                  <Send className="w-4 h-4 mr-1.5" /> {saving ? 'Publicando…' : 'Publicar'}
                </Button>
                <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setFormOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Añadir referencia
            </Button>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {items === null && (
          <div className="panel py-12 text-center text-sm text-muted-foreground md:col-span-2">Cargando referencias…</div>
        )}
        {items?.length === 0 && (
          <div className="panel py-12 text-center text-sm text-muted-foreground md:col-span-2">{meta.empty}</div>
        )}
        {items?.map((it) => (
          <div key={it.id} className="panel p-5 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold leading-snug">{it.title}</h3>
              {it.professor ? <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-mono uppercase tracking-wide text-muted-foreground">{it.professor}</span> : null}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{it.body}</p>
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-muted-foreground font-mono">{(it.created_by || '').split('@')[0]}</span>
              {it.kind === 'plantilla' && (
                <Link to="/examen" className="text-xs font-medium text-primary hover:underline">Practicar en el simulador →</Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}