// Identidad de Proyecta: escuadra de dibujo y arco de compás, en violeta sobre tinta.
// Colores propios para no depender de ui.jsx (que importa este archivo).
const TINTA = '#17132A';
const VIOLETA = '#7B6CF6';
const LILA = '#B7AEFF';
const AMBAR = '#F7B955';

export function Logo({ size = 40, radio = 14, sombra = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Proyecta" className="shrink-0"
      style={sombra ? { filter: 'drop-shadow(0 8px 18px rgba(123,108,246,0.4))' } : undefined}>
      <rect width="64" height="64" rx={radio} fill={TINTA} />
      <path d="M14 50 L14 16 L48 50 Z" fill="none" stroke={VIOLETA} strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M21 43 L21 33 L31 43 Z" fill={LILA} opacity="0.55" />
      <path d="M26 14 A 24 24 0 0 1 50 38" fill="none" stroke={AMBAR} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="0.1 7" />
      <circle cx="50" cy="38" r="3.4" fill={AMBAR} />
    </svg>
  );
}

export function NombreMarca({ tamano = 22, claro = true }) {
  return (
    <span className="font-bold leading-none tracking-tight" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: tamano }}>
      <span style={{ color: claro ? '#fff' : TINTA }}>Proyect</span><span style={{ color: VIOLETA }}>a</span>
    </span>
  );
}
