import { Link } from 'react-router-dom';
import { Crown, Lock, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function PaywallModal({ open, onClose, onUpgrade }) {
  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="max-w-md text-center space-y-4">
        <DialogHeader className="items-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl grid place-items-center bg-dorado-500/15 ring-1 ring-dorado-500/40">
            <Lock className="w-5 h-5 text-dorado-300" />
          </div>
          <DialogTitle className="text-lg">Límite diario alcanzado</DialogTitle>
          <DialogDescription>
            Has alcanzado el límite diario Free. Pásate a Premium para acceso ilimitado.
          </DialogDescription>
        </DialogHeader>
        <ul className="text-sm text-muted-foreground space-y-1.5 text-left mx-auto max-w-xs">
          <li className="flex items-center gap-2"><Crown className="w-4 h-4 text-dorado-300 shrink-0" /> Laboratorios 3D ilimitados</li>
          <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-dorado-300 shrink-0" /> Sin anuncios en toda la app</li>
        </ul>
        {onUpgrade ? (
          <Button onClick={onUpgrade} className="w-full">
            <Crown className="w-4 h-4 mr-1.5" /> Pásate a Premium · $99 MXN/mes
          </Button>
        ) : (
          <Link to="/register" className="block">
            <Button className="w-full">Crear cuenta para desbloquear</Button>
          </Link>
        )}
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Seguir en Free
        </Button>
      </DialogContent>
    </Dialog>
  );
}