/**
 * Badge de compatibilidade — gráfico circular animado mostrando %
 * calculada pelo motor de recomendação.
 */
import { useEffect, useState } from "react";

interface Props {
  /** 0..100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function CompatibilityBadge({
  value,
  size = 96,
  strokeWidth = 8,
  label = "match",
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, value));

  // Animação do valor (de 0 até `safe`)
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setProgress(safe));
    return () => cancelAnimationFrame(id);
  }, [safe]);

  const dashOffset = circumference - (progress / 100) * circumference;

  // cor baseada no valor
  const stopA = safe >= 75 ? "var(--accent)" : "var(--primary)";
  const stopB = safe >= 75 ? "var(--secondary)" : "var(--secondary)";
  const gradId = `compat-grad-${size}`;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={stopA} />
            <stop offset="100%" stopColor={stopB} />
          </linearGradient>
        </defs>
        {/* trilho */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.4}
        />
        {/* progresso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums text-foreground">
          {Math.round(progress)}%
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
