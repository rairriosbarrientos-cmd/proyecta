// Proyecta: propuestas técnico-económicas para proyectos de ingeniería y arquitectura.
// Todo se guarda en el celular y se sincroniza con la empresa (ver src/nube).
import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Trash2, FileText, Send, Printer, CircleCheck, Ban, Undo2, Copy, ChevronRight, Building2, Search, BookOpen, Percent, PencilRuler,
} from 'lucide-react';
import {
  COLORS, FONT_SLAB, FONT_SANS, FONT_MONO, CARD_SHADOW, Sheet, Field, TextInput, Select, PrimaryButton,
  Header, EmptyState, FloatingAddButton, Note, EncabezadoReporte, FirmasReporte, KpiReporte, FRANJA, PLANO_BG,
} from './ui.jsx';
import { Logo, NombreMarca } from './Marca.jsx';
import { aplicarCambios } from './nube/fusion.js';
import {
  CATALOGO_ID, esCotizacion, normalizarCatalogo, calcularPropuesta, totalCotizacion, honorariosPorObra, siguienteFolio, vence, isoDe, aprenderServicios,
} from './cotizaciones/calculo.js';

const uid = () => Math.random().toString(36).slice(2, 10);
const hoy = () => isoDe(new Date());
const pesos = (v, d = 2) => `$${(parseFloat(v) || 0).toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const cant = (v, d = 2) => (parseFloat(v) || 0).toLocaleString('es-MX', { maximumFractionDigits: d });
const plural = (k, palabra) => `${k} ${palabra}${k === 1 ? '' : 's'}`;
const fechaLarga = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

// Función y no constante: COLORS viene de otro módulo y así no depende del orden de carga.
const estadoDe = (k) => ({
  borrador: { texto: 'Borrador', color: COLORS.inkFaint },
  enviada: { texto: 'Enviada', color: COLORS.blueprint },
  aceptada: { texto: 'Aceptada', color: COLORS.good },
  rechazada: { texto: 'Rechazada', color: COLORS.bad },
}[k] || { texto: 'Borrador', color: COLORS.inkFaint });

const UNIDADES = ['lote', 'ha', 'km', 'm²', 'm', 'plano', 'estudio', 'visita', 'mes', 'hr', 'pza'];
const SUGERIDOS = [
  ['Levantamiento topográfico', 'ha'], ['Estudio de mecánica de suelos', 'estudio'], ['Anteproyecto arquitectónico', 'm²'],
  ['Proyecto arquitectónico ejecutivo', 'm²'], ['Proyecto estructural y memoria de cálculo', 'm²'], ['Proyecto geométrico', 'km'],
  ['Proyecto hidrosanitario', 'lote'], ['Proyecto eléctrico', 'lote'], ['Planos ejecutivos', 'plano'], ['Renders', 'pza'],
  ['Catálogo de conceptos y presupuesto', 'lote'], ['Trámites y permisos', 'lote'], ['Supervisión de obra', 'visita'],
];
const ESQUEMAS_PAGO = [
  ['50 / 50', [['Anticipo', 50], ['Entrega final', 50]]],
  ['40 / 30 / 30', [['Anticipo', 40], ['Entrega de anteproyecto', 30], ['Entrega final', 30]]],
  ['30 / 40 / 30', [['Anticipo', 30], ['Avance de proyecto', 40], ['Entrega final', 30]]],
];
const TEXTAREA = 'w-full px-3.5 py-3 rounded-xl text-[15px] outline-none disabled:opacity-70';
const estiloTextarea = () => ({ background: COLORS.paperAlt, border: `1.5px solid ${COLORS.line}`, color: COLORS.ink });

function nuevaPropuesta(registros) {
  return {
    id: uid(), tipo: 'cotizacion', folio: siguienteFolio(registros), nombre: '', cliente: '', ubicacion: '', fecha: hoy(), vigenciaDias: 30,
    estado: 'borrador', servicios: [], descuentoPct: 0, ivaPct: 16, plazoSemanas: 6,
    pagos: [{ id: uid(), concepto: 'Anticipo', pct: 50 }, { id: uid(), concepto: 'Entrega final', pct: 50 }],
    alcance: '', entregables: '', exclusiones: '', notas: '',
  };
}

/* ============================= RAÍZ ============================= */

// nube: motor de sincronización de la empresa; la app trabaja sobre su copia local y él sube y baja cambios.
// cuenta: { empresa, email, solicitudes, aviso, onAbrir } para el chip de empresa y los PDFs.
export default function App({ nube, cuenta }) {
  const [registros, setRegistros] = useState([]);
  const [cargado, setCargado] = useState(false);
  const [sync, setSync] = useState(null);
  const [vista, setVista] = useState({ tipo: 'lista' });

  useEffect(() => {
    setRegistros(nube.lista());
    setSync(nube.estado);
    setCargado(true);
    return nube.suscribir((aviso) => {
      setSync(aviso.estado);
      if (aviso.actualizados.length || aviso.borrados.length) setRegistros((prev) => aplicarCambios(prev, aviso));
    });
  }, [nube]);
  useEffect(() => { if (cargado) nube.actualizar(registros); }, [registros, cargado, nube]);

  const guardado = registros.find((r) => r.id === CATALOGO_ID);
  const catalogo = useMemo(() => normalizarCatalogo(guardado), [guardado]);
  const propuestas = registros.filter(esCotizacion);
  const guardar = (r) => setRegistros((prev) => (prev.some((p) => p.id === r.id) ? prev.map((p) => (p.id === r.id ? r : p)) : [...prev, r]));
  const borrar = (id) => setRegistros((prev) => prev.filter((p) => p.id !== id));

  if (!cargado) return <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.night }}><div className="animate-pulse"><Logo size={64} radio={18} /></div></div>;

  let pantalla;
  const actual = propuestas.find((c) => c.id === vista.id);
  if (vista.tipo === 'catalogo') {
    pantalla = <CatalogoView catalogo={catalogo} onGuardar={guardar} onBack={() => setVista({ tipo: 'lista' })} />;
  } else if (vista.tipo === 'pdf' && actual) {
    pantalla = <PropuestaPDF c={actual} cuenta={cuenta} onBack={() => setVista({ tipo: 'editar', id: actual.id })} />;
  } else if (vista.tipo === 'editar' && actual) {
    pantalla = (
      <EditorPropuesta c={actual} catalogo={catalogo} onGuardar={guardar} onBack={() => setVista({ tipo: 'lista' })} onPDF={() => setVista({ tipo: 'pdf', id: actual.id })}
        onAprender={(p) => guardar(aprenderServicios(catalogo, p, uid))}
        onBorrar={() => { borrar(actual.id); setVista({ tipo: 'lista' }); }}
        onDuplicar={() => { const copia = { ...actual, id: uid(), folio: siguienteFolio(registros), estado: 'borrador', fecha: hoy() }; guardar(copia); setVista({ tipo: 'editar', id: copia.id }); }} />
    );
  } else {
    pantalla = (
      <Inicio propuestas={propuestas} catalogo={catalogo} cuenta={cuenta}
        onAbrir={(id) => setVista({ tipo: 'editar', id })} onCatalogo={() => setVista({ tipo: 'catalogo' })}
        onNueva={() => { const c = nuevaPropuesta(registros); guardar(c); setVista({ tipo: 'editar', id: c.id }); }} />
    );
  }
  return (
    <div className="min-h-screen app-raiz" style={{ background: COLORS.bg, fontFamily: FONT_SANS }}>
      <ChipCuenta cuenta={cuenta} sync={sync} />
      <div className="max-w-3xl mx-auto">{pantalla}</div>
    </div>
  );
}

function ChipCuenta({ cuenta, sync }) {
  if (!cuenta && !sync) return null;
  const color = cuenta?.aviso ? '#FF6B5E' : sync === 'sincronizado' ? '#8FE3B5' : sync === 'guardando' ? COLORS.hazard : COLORS.nightSoft;
  const texto = cuenta?.aviso || { sincronizado: 'Al día', guardando: 'Guardando...', 'solo lectura': 'Solo lectura' }[sync] || 'Sin conexión';
  return (
    <button onClick={cuenta?.onAbrir} className="fixed right-3 z-50 no-print pl-2.5 pr-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-2"
      style={{ top: 'calc(env(safe-area-inset-top) + 10px)', background: 'rgba(23,19,42,0.85)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: `1px solid ${COLORS.nightLine}`, color: COLORS.nightInk }}>
      <Building2 size={13} color={COLORS.hazard} /><span className="max-w-[110px] truncate">{cuenta?.empresa}</span>
      <span style={{ width: 1, height: 12, background: COLORS.nightLine }} />
      {cuenta?.solicitudes > 0 && (
        <span className="absolute -top-1.5 -left-1.5 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center" style={{ background: COLORS.bad, color: '#fff', boxShadow: `0 0 0 2px ${COLORS.night}` }} aria-label={`${cuenta.solicitudes} solicitudes de entrada`}>{cuenta.solicitudes}</span>
      )}
      <span style={{ width: 7, height: 7, borderRadius: 4, background: color, boxShadow: `0 0 8px ${color}` }} />
      <span style={{ color }}>{texto}</span>
    </button>
  );
}

/* ============================= INICIO ============================= */

const FILTROS = [['todas', 'Todas'], ['borrador', 'Borrador'], ['enviada', 'Enviadas'], ['aceptada', 'Aceptadas'], ['rechazada', 'Rechazadas']];

function Inicio({ propuestas, catalogo, cuenta, onAbrir, onCatalogo, onNueva }) {
  const [filtro, setFiltro] = useState('todas');
  const [busca, setBusca] = useState('');
  const suma = (estado) => propuestas.filter((c) => c.estado === estado).reduce((s, c) => s + totalCotizacion(c), 0);
  const decididas = propuestas.filter((c) => c.estado === 'aceptada' || c.estado === 'rechazada').length;
  const ganadas = propuestas.filter((c) => c.estado === 'aceptada').length;
  const q = busca.trim().toLowerCase();
  const lista = propuestas
    .filter((c) => filtro === 'todas' || c.estado === filtro)
    .filter((c) => !q || `${c.folio} ${c.nombre} ${c.cliente}`.toLowerCase().includes(q))
    .sort((a, b) => (a.folio < b.folio ? 1 : -1));
  return (
    <div className="pb-28">
      <div className="relative mb-4" style={{ background: COLORS.night, backgroundImage: PLANO_BG, backgroundSize: '20px 20px' }}>
        <div className="px-5 pb-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 52px)' }}>
          <div className="flex items-center gap-2.5 mb-5"><Logo size={34} radio={10} /><NombreMarca tamano={21} /></div>
          <p className="text-[12px] font-semibold" style={{ color: COLORS.nightSoft }}>{cuenta?.empresa}</p>
          <h1 className="text-[29px] font-bold leading-tight tracking-tight" style={{ fontFamily: FONT_SLAB, color: '#fff' }}>Tus propuestas</h1>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[['En juego', pesos(suma('enviada'), 0)], ['Ganadas', pesos(suma('aceptada'), 0)], ['Cierre', decididas ? `${Math.round((ganadas / decididas) * 100)}%` : '—']].map(([k, v]) => (
              <div key={k} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.nightLine}` }}>
                <p className="text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: COLORS.nightSoft }}>{k}</p>
                <p className="text-[16px] font-bold nums truncate" style={{ fontFamily: FONT_SLAB, color: '#fff' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute left-0 right-0 bottom-0" style={{ height: 4, background: FRANJA }} />
      </div>

      <div className="px-4 space-y-3">
        <button onClick={onCatalogo} className="w-full rounded-2xl p-4 flex items-center gap-3 text-left" style={{ background: COLORS.paper, boxShadow: CARD_SHADOW }}>
          <div className="rounded-xl p-2.5" style={{ background: '#EFEDFE' }}><BookOpen size={20} color={COLORS.accent} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold" style={{ fontFamily: FONT_SLAB, color: COLORS.ink }}>Mis servicios y precios</p>
            <p className="text-[12px]" style={{ color: COLORS.inkSoft }}>{catalogo.servicios.length ? plural(catalogo.servicios.length, 'servicio') : 'Se llena solo con lo que cotizas'}</p>
          </div>
          <ChevronRight size={18} color={COLORS.inkFaint} />
        </button>

        {propuestas.length > 0 && (
          <>
            <div className="relative">
              <Search size={16} color={COLORS.inkFaint} className="absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por folio, proyecto o cliente"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl text-[14px] outline-none" style={{ background: COLORS.paper, border: `1.5px solid ${COLORS.line}`, color: COLORS.ink }} />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {FILTROS.map(([k, t]) => (
                <button key={k} onClick={() => setFiltro(k)} className="shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-bold"
                  style={{ background: filtro === k ? COLORS.night : COLORS.paper, color: filtro === k ? '#fff' : COLORS.inkSoft, border: `1px solid ${filtro === k ? COLORS.night : COLORS.line}` }}>{t}</button>
              ))}
            </div>
          </>
        )}

        {lista.map((c) => {
          const e = estadoDe(c.estado);
          return (
            <button key={c.id} onClick={() => onAbrir(c.id)} className="w-full rounded-2xl p-4 text-left" style={{ background: COLORS.paper, boxShadow: CARD_SHADOW }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold" style={{ fontFamily: FONT_MONO, color: COLORS.accent }}>{c.folio}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: e.color, color: '#fff' }}>{e.texto}</span>
              </div>
              <p className="text-[17px] font-bold leading-tight tracking-tight mt-1 truncate" style={{ fontFamily: FONT_SLAB, color: COLORS.ink }}>{c.nombre || 'Sin nombre'}</p>
              <div className="flex items-end justify-between gap-2 mt-1">
                <p className="text-[12px] truncate" style={{ color: COLORS.inkSoft }}>{c.cliente || 'Sin cliente'} · {fechaLarga(c.fecha)}</p>
                <p className="text-[15px] font-bold nums shrink-0" style={{ fontFamily: FONT_MONO, color: COLORS.ink }}>{pesos(totalCotizacion(c), 0)}</p>
              </div>
            </button>
          );
        })}
        {propuestas.length === 0 && <EmptyState icon={PencilRuler} text="Crea tu primera propuesta: servicios, entregables y forma de pago, lista para mandar en PDF." />}
        {propuestas.length > 0 && lista.length === 0 && <p className="text-sm text-center py-8" style={{ color: COLORS.inkFaint }}>Nada con ese filtro.</p>}
      </div>
      <FloatingAddButton onClick={onNueva} label="Nueva propuesta" />
    </div>
  );
}

/* ============================= PIEZAS ============================= */

function Tarjeta({ titulo, children, derecha }) {
  return (
    <div className="rounded-2xl p-4 mb-3" style={{ background: COLORS.paper, boxShadow: CARD_SHADOW }}>
      {titulo && (
        <div className="flex items-center justify-between mb-3 gap-2">
          <p className="text-[15px] font-bold tracking-tight" style={{ fontFamily: FONT_SLAB, color: COLORS.ink }}>{titulo}</p>
          {derecha}
        </div>
      )}
      {children}
    </div>
  );
}
function Fila({ label, valor, fuerte, color }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`text-[13px] ${fuerte ? 'font-bold' : ''}`} style={{ color: fuerte ? COLORS.ink : COLORS.inkSoft }}>{label}</span>
      <span className={`nums ${fuerte ? 'text-[17px] font-bold' : 'text-[13px] font-semibold'}`} style={{ fontFamily: FONT_MONO, color: color || COLORS.ink }}>{valor}</span>
    </div>
  );
}
function Num({ value, onChange, disabled, step = '0.01', ...rest }) {
  return <TextInput type="number" inputMode="decimal" step={step} value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} {...rest} />;
}
function BorrarConfirmado({ onBorrar, texto = 'Eliminar propuesta' }) {
  const [seguro, setSeguro] = useState(false);
  return seguro
    ? <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setSeguro(false)} className="py-2.5 rounded-xl text-[13px] font-bold" style={{ background: COLORS.paperAlt }}>Cancelar</button><button onClick={onBorrar} className="py-2.5 rounded-xl text-[13px] font-bold" style={{ background: COLORS.bad, color: '#fff' }}>Sí, eliminar</button></div>
    : <button onClick={() => setSeguro(true)} className="mt-3 w-full py-2 text-[12px] font-semibold flex items-center justify-center gap-1.5" style={{ color: COLORS.bad }}><Trash2 size={13} />{texto}</button>;
}

/* ============================= PROPUESTA ============================= */

function EditorPropuesta({ c, catalogo, onGuardar, onBack, onPDF, onBorrar, onDuplicar, onAprender }) {
  const [editando, setEditando] = useState(null);
  const bloqueada = c.estado !== 'borrador';
  const set = (cambios) => onGuardar({ ...c, ...cambios });
  const r = calcularPropuesta(c);
  const e = estadoDe(c.estado);
  const cambiarEstado = (estado) => {
    if (estado === 'enviada') onAprender(c); // el catálogo aprende los servicios y precios que mandaste
    set({ estado });
  };
  const guardarServicio = (s) => { set({ servicios: s.id && c.servicios.some((x) => x.id === s.id) ? c.servicios.map((x) => (x.id === s.id ? s : x)) : [...c.servicios, { ...s, id: uid() }] }); setEditando(null); };
  const setPago = (id, cambios) => set({ pagos: c.pagos.map((p) => (p.id === id ? { ...p, ...cambios } : p)) });
  const boton = (texto, Icon, onClick, fondo = COLORS.paperAlt, color = COLORS.ink) => (
    <button onClick={onClick} className="py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5" style={{ background: fondo, color }}><Icon size={15} />{texto}</button>
  );
  return (
    <div className="pb-28">
      <Header title={c.nombre || 'Propuesta sin nombre'} subtitle={c.folio} onBack={onBack} />
      <div className="px-4">
        <div className="rounded-2xl p-4 mb-3" style={{ background: COLORS.night, backgroundImage: PLANO_BG, backgroundSize: '16px 16px' }}>
          <p className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: COLORS.nightSoft }}>Total con IVA</p>
          <p className="text-[34px] font-bold leading-none mt-1 nums" style={{ fontFamily: FONT_SLAB, color: '#fff' }}>{pesos(r.total)}</p>
          <p className="text-[12px] mt-1.5" style={{ color: COLORS.nightSoft }}>{plural(c.servicios.length, 'servicio')} · {c.plazoSemanas || '—'} semanas · vigente hasta {fechaLarga(vence(c))}</p>
        </div>

        <Tarjeta titulo="Estado" derecha={<span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: e.color, color: '#fff' }}>{e.texto}</span>}>
          <div className="grid grid-cols-2 gap-2">
            {c.estado === 'borrador' && boton('Marcar enviada', Send, () => cambiarEstado('enviada'), COLORS.blueprint, '#fff')}
            {c.estado === 'enviada' && boton('Aceptada', CircleCheck, () => cambiarEstado('aceptada'), COLORS.good, '#fff')}
            {c.estado === 'enviada' && boton('Rechazada', Ban, () => cambiarEstado('rechazada'), '#FDECEA', COLORS.bad)}
            {c.estado !== 'borrador' && boton('Volver a borrador', Undo2, () => cambiarEstado('borrador'))}
            {boton('Ver PDF', Printer, onPDF, COLORS.accent, '#fff')}
            {boton('Duplicar', Copy, onDuplicar)}
          </div>
          {c.estado === 'borrador' && <BorrarConfirmado onBorrar={onBorrar} />}
        </Tarjeta>

        <Tarjeta titulo="Datos">
          <Field label="Proyecto"><TextInput value={c.nombre} disabled={bloqueada} onChange={(ev) => set({ nombre: ev.target.value })} placeholder="Ej. Casa habitación Las Palmas" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cliente"><TextInput value={c.cliente} disabled={bloqueada} onChange={(ev) => set({ cliente: ev.target.value })} /></Field>
            <Field label="Ubicación"><TextInput value={c.ubicacion} disabled={bloqueada} onChange={(ev) => set({ ubicacion: ev.target.value })} /></Field>
            <Field label="Fecha"><TextInput type="date" value={c.fecha} disabled={bloqueada} onChange={(ev) => set({ fecha: ev.target.value })} /></Field>
            <Field label="Vigencia (días)"><Num step="1" value={c.vigenciaDias} disabled={bloqueada} onChange={(v) => set({ vigenciaDias: v })} /></Field>
            <Field label="Plazo (semanas)"><Num step="1" value={c.plazoSemanas} disabled={bloqueada} onChange={(v) => set({ plazoSemanas: v })} /></Field>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Servicios" derecha={!bloqueada && <button onClick={() => setEditando({})} className="text-[13px] font-bold flex items-center gap-1" style={{ color: COLORS.accent }}><Plus size={15} />Agregar</button>}>
          {c.servicios.length === 0 && <p className="text-[13px]" style={{ color: COLORS.inkFaint }}>Agrega los servicios que vas a cobrar.</p>}
          {r.servicios.map((s) => (
            <button key={s.id} disabled={bloqueada} onClick={() => setEditando(s)} className="w-full text-left py-2.5 border-b last:border-0 flex items-start justify-between gap-3" style={{ borderColor: COLORS.line }}>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold" style={{ color: COLORS.ink }}>{s.descripcion}</p>
                <p className="text-[12px] nums" style={{ color: COLORS.inkSoft }}>{cant(s.cantidad)} {s.unidad} × {pesos(s.precio)}{s.base ? ` · ${cant(s.porcentaje)}% de ${pesos(s.base, 0)}` : ''}</p>
              </div>
              <span className="text-[14px] font-bold nums shrink-0" style={{ fontFamily: FONT_MONO }}>{pesos(s.importe)}</span>
            </button>
          ))}
        </Tarjeta>

        <Tarjeta titulo="Alcance y entregables">
          <Field label="Alcance"><textarea value={c.alcance} disabled={bloqueada} onChange={(ev) => set({ alcance: ev.target.value })} rows={3} placeholder="Qué incluye el trabajo, en palabras del cliente." className={TEXTAREA} style={estiloTextarea()} /></Field>
          <Field label="Entregables (uno por renglón)"><textarea value={c.entregables} disabled={bloqueada} onChange={(ev) => set({ entregables: ev.target.value })} rows={4} placeholder={'Planos en PDF y DWG\nMemoria de cálculo firmada\nRenders de fachada'} className={TEXTAREA} style={estiloTextarea()} /></Field>
          <Field label="No incluye (uno por renglón)"><textarea value={c.exclusiones} disabled={bloqueada} onChange={(ev) => set({ exclusiones: ev.target.value })} rows={3} placeholder={'Pago de derechos y licencias\nEstudios de laboratorio adicionales'} className={TEXTAREA} style={estiloTextarea()} /></Field>
        </Tarjeta>

        <Tarjeta titulo="Forma de pago" derecha={!r.pagosCuadran && <span className="text-[11px] font-bold" style={{ color: COLORS.bad }}>Suma {cant(r.sumaPagos, 1)}%</span>}>
          {!bloqueada && (
            <div className="flex gap-1.5 mb-3 overflow-x-auto">
              {ESQUEMAS_PAGO.map(([t, pagos]) => (
                <button key={t} onClick={() => set({ pagos: pagos.map(([concepto, pct]) => ({ id: uid(), concepto, pct })) })} className="shrink-0 px-3 py-1.5 rounded-full text-[12px] font-bold" style={{ background: COLORS.paperAlt, color: COLORS.inkSoft, border: `1px solid ${COLORS.line}` }}>{t}</button>
              ))}
            </div>
          )}
          {r.pagos.map((p) => (
            <div key={p.id} className="flex items-center gap-2 mb-2">
              <div className="flex-1 min-w-0"><TextInput value={p.concepto} disabled={bloqueada} onChange={(ev) => setPago(p.id, { concepto: ev.target.value })} aria-label="Concepto del pago" /></div>
              <div className="w-[70px] shrink-0"><Num step="1" value={c.pagos.find((x) => x.id === p.id)?.pct} disabled={bloqueada} onChange={(v) => setPago(p.id, { pct: v })} aria-label="Porcentaje" /></div>
              <span className="w-[84px] shrink-0 text-right text-[12.5px] font-bold nums" style={{ fontFamily: FONT_MONO }}>{pesos(p.monto, 0)}</span>
              {!bloqueada && <button onClick={() => set({ pagos: c.pagos.filter((x) => x.id !== p.id) })} className="p-1" aria-label="Quitar pago"><Trash2 size={14} color={COLORS.bad} /></button>}
            </div>
          ))}
          {!bloqueada && <button onClick={() => set({ pagos: [...c.pagos, { id: uid(), concepto: 'Pago', pct: Math.max(0, Math.round(100 - r.sumaPagos)) }] })} className="text-[13px] font-bold flex items-center gap-1" style={{ color: COLORS.accent }}><Plus size={14} />Agregar pago</button>}
        </Tarjeta>

        <Tarjeta titulo="Total">
          <div className="grid grid-cols-2 gap-x-3">
            <Field label="Descuento %"><Num step="1" value={c.descuentoPct} disabled={bloqueada} onChange={(v) => set({ descuentoPct: v })} /></Field>
            <Field label="IVA %"><Num step="1" value={c.ivaPct} disabled={bloqueada} onChange={(v) => set({ ivaPct: v })} /></Field>
          </div>
          <Fila label="Servicios" valor={pesos(r.bruto)} />
          {r.descuento > 0 && <Fila label={`Descuento ${cant(c.descuentoPct)}%`} valor={`−${pesos(r.descuento)}`} color={COLORS.good} />}
          <Fila label="Subtotal" valor={pesos(r.subtotal)} fuerte />
          <Fila label={`IVA ${cant(c.ivaPct)}%`} valor={pesos(r.iva)} />
          <Fila label="Total" valor={pesos(r.total)} fuerte color={COLORS.accent} />
          <div className="mt-3"><Field label="Notas y condiciones"><textarea value={c.notas} disabled={bloqueada} onChange={(ev) => set({ notas: ev.target.value })} rows={2} placeholder="Ej. Cambios de alcance se cotizan aparte." className={TEXTAREA} style={estiloTextarea()} /></Field></div>
        </Tarjeta>
      </div>
      {editando && <ServicioSheet servicio={editando} catalogo={catalogo} onClose={() => setEditando(null)} onSave={guardarServicio}
        onBorrar={editando.id ? () => { set({ servicios: c.servicios.filter((x) => x.id !== editando.id) }); setEditando(null); } : null} />}
    </div>
  );
}

function ServicioSheet({ servicio, catalogo, onClose, onSave, onBorrar }) {
  const [s, setS] = useState({ descripcion: '', unidad: 'lote', cantidad: 1, precio: '', ...servicio });
  const [porObra, setPorObra] = useState(!!servicio.base);
  const valido = s.descripcion.trim() && s.precio !== '' && parseFloat(s.cantidad) > 0;
  const usarPorObra = (base, porcentaje) => setS({ ...s, base, porcentaje, cantidad: 1, unidad: 'lote', precio: honorariosPorObra(base, porcentaje) });
  const guardados = catalogo.servicios;
  return (
    <Sheet title={servicio.id ? 'Editar servicio' : 'Agregar servicio'} onClose={onClose}>
      {!servicio.id && guardados.length > 0 && (
        <Field label="De mis servicios">
          <Select value="" onChange={(ev) => { const g = guardados.find((x) => x.id === ev.target.value); if (g) setS({ ...s, descripcion: g.descripcion, unidad: g.unidad, precio: g.precio }); }}>
            <option value="">Elegir…</option>
            {guardados.map((g) => <option key={g.id} value={g.id}>{g.descripcion} · {pesos(g.precio, 0)}/{g.unidad}</option>)}
          </Select>
        </Field>
      )}
      {!servicio.id && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {SUGERIDOS.map(([d, u]) => <button key={d} onClick={() => setS({ ...s, descripcion: d, unidad: u })} className="text-[12px] px-2.5 py-1.5 rounded-full font-semibold" style={{ background: s.descripcion === d ? COLORS.night : COLORS.paperAlt, color: s.descripcion === d ? '#fff' : COLORS.inkSoft }}>{d}</button>)}
        </div>
      )}
      <Field label="Descripción"><TextInput value={s.descripcion} onChange={(ev) => setS({ ...s, descripcion: ev.target.value })} /></Field>
      <button onClick={() => { if (porObra) setS({ ...s, base: undefined, porcentaje: undefined }); setPorObra(!porObra); }} className="mb-3 text-[12.5px] font-bold flex items-center gap-1.5" style={{ color: COLORS.accent }}>
        <Percent size={14} />{porObra ? 'Capturar precio directo' : 'Cobrar como % del costo de obra'}
      </button>
      {porObra ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Costo de obra $"><Num value={s.base} onChange={(v) => usarPorObra(v, s.porcentaje)} placeholder="Ej. 2500000" /></Field>
          <Field label="Honorarios %"><Num step="0.5" value={s.porcentaje} onChange={(v) => usarPorObra(s.base, v)} placeholder="Ej. 6" /></Field>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <Field label="Unidad"><Select value={s.unidad} onChange={(ev) => setS({ ...s, unidad: ev.target.value })}>{UNIDADES.map((u) => <option key={u}>{u}</option>)}</Select></Field>
          <Field label="Cantidad"><Num value={s.cantidad} onChange={(v) => setS({ ...s, cantidad: v })} /></Field>
          <Field label="Precio $"><Num value={s.precio} onChange={(v) => setS({ ...s, precio: v })} /></Field>
        </div>
      )}
      <div className="rounded-xl px-3.5 py-2.5 mb-4 flex items-center justify-between" style={{ background: COLORS.paperAlt }}>
        <span className="text-[13px]" style={{ color: COLORS.inkSoft }}>Importe</span>
        <span className="text-[16px] font-bold nums" style={{ fontFamily: FONT_MONO }}>{pesos((parseFloat(s.cantidad) || 0) * (parseFloat(s.precio) || 0))}</span>
      </div>
      <PrimaryButton disabled={!valido} onClick={() => valido && onSave(s)}>Guardar servicio</PrimaryButton>
      {onBorrar && <BorrarConfirmado onBorrar={onBorrar} texto="Quitar servicio" />}
    </Sheet>
  );
}

/* ============================= CATÁLOGO ============================= */

function CatalogoView({ catalogo, onGuardar, onBack }) {
  const [editando, setEditando] = useState(null);
  const guardar = (s) => {
    const servicios = s.id && catalogo.servicios.some((x) => x.id === s.id) ? catalogo.servicios.map((x) => (x.id === s.id ? s : x)) : [...catalogo.servicios, { ...s, id: uid() }];
    onGuardar({ ...catalogo, servicios });
    setEditando(null);
  };
  return (
    <div className="pb-28">
      <Header title="Mis servicios" subtitle="Precios base" onBack={onBack} />
      <div className="px-4">
        <Note>Cuando marcas una propuesta como enviada, sus servicios y precios se guardan aquí solos. La próxima vez solo los eliges.</Note>
        {catalogo.servicios.map((s) => (
          <button key={s.id} onClick={() => setEditando(s)} className="w-full rounded-xl p-3 mb-2 text-left flex items-center justify-between gap-3" style={{ background: COLORS.paper, boxShadow: CARD_SHADOW }}>
            <span className="text-[14px] font-semibold" style={{ color: COLORS.ink }}>{s.descripcion}</span>
            <span className="text-[14px] font-bold nums shrink-0" style={{ fontFamily: FONT_MONO }}>{pesos(s.precio)}<span className="text-[10px] font-normal" style={{ color: COLORS.inkFaint }}>/{s.unidad}</span></span>
          </button>
        ))}
        {catalogo.servicios.length === 0 && <EmptyState icon={BookOpen} text="Aún no hay servicios guardados." />}
      </div>
      <FloatingAddButton onClick={() => setEditando({})} label="Servicio" />
      {editando && <ServicioCatalogoSheet servicio={editando} onClose={() => setEditando(null)} onSave={guardar}
        onBorrar={editando.id ? () => { onGuardar({ ...catalogo, servicios: catalogo.servicios.filter((x) => x.id !== editando.id) }); setEditando(null); } : null} />}
    </div>
  );
}

function ServicioCatalogoSheet({ servicio, onClose, onSave, onBorrar }) {
  const [s, setS] = useState({ descripcion: '', unidad: 'lote', precio: '', ...servicio });
  const valido = s.descripcion.trim() && parseFloat(s.precio) > 0;
  return (
    <Sheet title={servicio.id ? 'Editar servicio' : 'Nuevo servicio'} onClose={onClose}>
      <Field label="Descripción"><TextInput value={s.descripcion} onChange={(ev) => setS({ ...s, descripcion: ev.target.value })} placeholder="Ej. Levantamiento topográfico" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Unidad"><Select value={s.unidad} onChange={(ev) => setS({ ...s, unidad: ev.target.value })}>{UNIDADES.map((u) => <option key={u}>{u}</option>)}</Select></Field>
        <Field label="Precio base $"><Num value={s.precio} onChange={(v) => setS({ ...s, precio: v })} /></Field>
      </div>
      <PrimaryButton disabled={!valido} onClick={() => valido && onSave({ ...s, descripcion: s.descripcion.trim(), precio: parseFloat(s.precio) })}>Guardar</PrimaryButton>
      {onBorrar && <BorrarConfirmado onBorrar={onBorrar} texto="Eliminar servicio" />}
    </Sheet>
  );
}

/* ============================= PDF ============================= */

const renglones = (t) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean);

function PropuestaPDF({ c, cuenta, onBack }) {
  const r = calcularPropuesta(c);
  const datos = [['Fecha', fechaLarga(c.fecha)], ['Vigencia', `Hasta ${fechaLarga(vence(c))}`], ['Plazo', c.plazoSemanas ? `${c.plazoSemanas} semanas` : '—'], ['Folio', c.folio]];
  return (
    <div className="pb-16">
      <div className="no-print"><Header title="Vista PDF" subtitle={c.folio} onBack={onBack} /></div>
      <div className="px-4 no-print mb-4"><PrimaryButton onClick={() => window.print()}><FileText size={17} />Guardar PDF / imprimir</PrimaryButton></div>
      <div className="mx-3 rounded-2xl p-4 sm:p-6" style={{ background: '#fff', boxShadow: CARD_SHADOW }}>
        <EncabezadoReporte tipo="Propuesta técnico-económica" titulo={c.nombre || c.folio} proyecto={c} cuenta={cuenta} folio={c.folio} datos={datos} />
        <div className="grid grid-cols-3 gap-2 mb-4">
          <KpiReporte label="Subtotal" value={pesos(r.subtotal, 0)} />
          <KpiReporte label={`IVA ${cant(c.ivaPct)}%`} value={pesos(r.iva, 0)} />
          <KpiReporte label="Total" value={pesos(r.total, 0)} destacado />
        </div>
        {c.alcance && <><p className="titulo-seccion">Alcance</p><p className="text-[12px] whitespace-pre-line" style={{ color: COLORS.ink }}>{c.alcance}</p></>}
        <p className="titulo-seccion">Servicios</p>
        <div className="overflow-x-auto -mx-1 px-1"><table className="tabla-reporte">
          <thead><tr><th>#</th><th>Descripción</th><th>Unidad</th><th className="num">Cant.</th><th className="num">P. unitario</th><th className="num">Importe</th></tr></thead>
          <tbody>{r.servicios.map((s, i) => <tr key={s.id}><td>{i + 1}</td><td>{s.descripcion}{s.base ? <span style={{ color: COLORS.inkFaint }}> ({cant(s.porcentaje)}% de {pesos(s.base, 0)})</span> : null}</td><td>{s.unidad}</td><td className="num">{cant(s.cantidad)}</td><td className="num">{pesos(s.precio)}</td><td className="num">{pesos(s.importe)}</td></tr>)}</tbody>
          <tfoot><tr><td colSpan={5}>Subtotal</td><td className="num">{pesos(r.bruto)}</td></tr></tfoot>
        </table></div>
        <div className="break-inside-avoid mt-4 ml-auto max-w-[320px]">
          {r.descuento > 0 && <Fila label={`Descuento ${cant(c.descuentoPct)}%`} valor={`−${pesos(r.descuento)}`} />}
          <Fila label="Subtotal" valor={pesos(r.subtotal)} />
          <Fila label={`IVA ${cant(c.ivaPct)}%`} valor={pesos(r.iva)} />
          <Fila label="Total" valor={pesos(r.total)} fuerte color={COLORS.accent} />
        </div>
        {renglones(c.entregables).length > 0 && <><p className="titulo-seccion">Entregables</p><ul className="text-[12px] list-disc pl-5" style={{ color: COLORS.ink }}>{renglones(c.entregables).map((x) => <li key={x}>{x}</li>)}</ul></>}
        {r.pagos.length > 0 && (
          <div className="break-inside-avoid">
            <p className="titulo-seccion">Forma de pago</p>
            <table className="tabla-reporte">
              <thead><tr><th>Pago</th><th className="num">%</th><th className="num">Monto</th></tr></thead>
              <tbody>{r.pagos.map((p) => <tr key={p.id}><td>{p.concepto}</td><td className="num">{cant(p.pct, 1)}%</td><td className="num">{pesos(p.monto)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        {renglones(c.exclusiones).length > 0 && <><p className="titulo-seccion">No incluye</p><ul className="text-[12px] list-disc pl-5" style={{ color: COLORS.ink }}>{renglones(c.exclusiones).map((x) => <li key={x}>{x}</li>)}</ul></>}
        {c.notas && <><p className="titulo-seccion">Condiciones</p><p className="text-[12px] whitespace-pre-line" style={{ color: COLORS.ink }}>{c.notas}</p></>}
        <p className="text-[10.5px] mt-4" style={{ color: COLORS.inkSoft }}>Precios en moneda nacional. Propuesta válida hasta el {fechaLarga(vence(c))}.</p>
        <FirmasReporte cuenta={cuenta} firmas={['Elaboró', 'Aceptación del cliente']} />
      </div>
    </div>
  );
}
