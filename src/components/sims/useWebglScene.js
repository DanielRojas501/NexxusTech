import { useEffect, useRef, useState } from 'react';

// Inicializa sobre un canvas ya renderizado; un fallo nunca desmonta el canvas.
export default function useWebglScene({ create, mountRef, onTelemetry, onHover }) {
  const sceneRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const failedRef = useRef(false);
  const [revision, setRevision] = useState(0);
  const cbsRef = useRef({ create, onTelemetry, onHover });
  useEffect(() => {
    cbsRef.current = { create, onTelemetry, onHover };
  });

  useEffect(() => {
    if (!mountRef.current) return undefined;
    failedRef.current = false;
    setFailed(false);
    try {
      const { create: mk, onTelemetry: tele, onHover: hover } = cbsRef.current;
      const api = mk(mountRef.current, tele, hover);
      sceneRef.current = api;
      return () => {
        sceneRef.current = null;
        api.dispose();
      };
    } catch (error) {
      sceneRef.current = null;
      failedRef.current = true;
      setFailed(true);
      console.error('No se pudo inicializar la escena 3D:', error);
    }
  }, [revision, mountRef]);

  useEffect(() => {
    const recover = () => {
      if (failedRef.current && document.visibilityState !== 'hidden') {
        setRevision((r) => r + 1);
      }
    };
    document.addEventListener('visibilitychange', recover);
    window.addEventListener('focus', recover);
    return () => {
      document.removeEventListener('visibilitychange', recover);
      window.removeEventListener('focus', recover);
    };
  }, []);

  return { sceneRef, failed, revision, retryScene: () => setRevision((r) => r + 1) };
}