import { InlineMath } from 'react-katex';

// Renders text that may contain $...$ LaTeX math mixed with normal words.
// Example: "The value of $\frac{3}{4}$ is:" → renders the fraction properly.
export default function MathText({ children }) {
  if (children == null) return null;
  const parts = String(children).split(/(\$[^$]*\$)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const math = part.slice(1, -1);
          try {
            return (
              <InlineMath
                key={i}
                math={math}
                settings={{ strict: false, throwOnError: false }}
              />
            );
          } catch {
            return <span key={i}>{part}</span>;
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}