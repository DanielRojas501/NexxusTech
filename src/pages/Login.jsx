import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, FlaskConical } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";
import { startGuestSession, exitGuestSession } from "@/lib/guestStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.login({ email, password });
      exitGuestSession();
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    startGuestSession();
    window.location.href = returnTo;
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Inicia sesión"
      subtitle="Tu racha y tu avance te esperan donde los dejaste."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            Crear una
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="nombre@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Iniciando sesión...</>
          ) : "Iniciar sesión"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
      </div>
      <Button
        variant="outline"
        className="w-full h-12 font-medium border-dorado-500/50 hover:bg-dorado-500/10 hover:text-foreground"
        onClick={handleGuest}
      >
        <FlaskConical className="w-5 h-5 mr-2 text-dorado-500" aria-hidden="true" />
        Explorar sin cuenta
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Tu avance se guarda solo en este navegador. Crea una cuenta cuando quieras conservarlo.
      </p>
    </AuthLayout>
  );
}
