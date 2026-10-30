import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const renderTex = (tex, displayMode) =>
  katex.renderToString(tex, { throwOnError: false, displayMode });

/**
 * Renderiza texto con matemáticas embebidas:
 * "$...$" para fórmula en línea y "$$...$$" para bloque centrado.
 */
export default function MathText({ children, className }) {
  const parts = useMemo(() => {
    if (typeof children !== 'string' || !children.includes('$')) return null;
    return children.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g).filter(Boolean);
  }, [children]);

  if (!parts) return <span className={className}>{children}</span>;

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
          return (
            <span
              key={i}
              className="block my-2 overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: renderTex(part.slice(2, -2), true) }}
            />
          );
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          return <span key={i} dangerouslySetInnerHTML={{ __html: renderTex(part.slice(1, -1), false) }} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}