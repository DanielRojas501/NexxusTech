import { useState } from 'react';
import { MessageCircle, Star, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/api/apiClient';

export default function FeedbackFAB() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [screen, setScreen] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!rating) {
      setError('Elige una calificación de 1 a 5 estrellas.');
      return;
    }
    if (comment.trim().length < 5) {
      setError('Cuéntanos un poco más (mínimo 5 caracteres).');
      return;
    }
    setSending(true);
    setError('');
    try {
      await api.functions.invoke('submitGuestFeedback', {
        rating,
        comment: comment.trim(),
        screen_name: (screen.trim() || window.location.pathname).slice(0, 120),
      });
      toast({
        title: '¡Gracias por probar el prototipo!',
        description: 'Tus comentarios quedaron registrados y nos ayudan a mejorar.',
      });
      setOpen(false);
      setRating(0);
      setComment('');
      setScreen('');
    } catch (e) {
      setError('No pudimos enviar tu comentario. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full bg-verde-600 text-white font-semibold text-xs sm:text-sm px-4 py-3 shadow-lg shadow-verde-500/30 hover:brightness-110 active:scale-95 transition"
            title="Enviar comentarios de prueba"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar comentarios</span>
          </button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border/70">
          <DialogHeader>
            <DialogTitle>Comentarios del prototipo</DialogTitle>
            <DialogDescription>
              Reporta un error o sugiere una mejora. Toma menos de un minuto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className="p-1 rounded-lg hover:bg-secondary transition"
                  aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                >
                  <Star className={`w-7 h-7 ${n <= rating ? 'text-amber-300 fill-amber-300' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="¿Qué probaste? ¿Qué falló o qué mejorarías?"
                rows={4}
                maxLength={1000}
              />
              <Input
                value={screen}
                onChange={(e) => setScreen(e.target.value)}
                placeholder={`Pantalla o sección (ej. ${window.location.pathname})`}
                maxLength={120}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={submit} disabled={sending} className="w-full">
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
                </>
              ) : (
                'Enviar comentarios de prueba'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}