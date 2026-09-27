// Propuestas de proyecto: servicios con cantidad y precio, descuento, IVA y calendario de pagos.
// Todo vive en registros sincronizados de la empresa, marcados con `tipo`:
//   tipo 'catalogo'   → un solo registro por empresa (id CATALOGO_ID) con los servicios que ofrece y su precio base.
//   tipo 'cotizacion' → una propuesta.

export const CATALOGO_ID = 'catalogo-servicios';
export const ESTADOS_COTIZACION = ['borrador', 'enviada', 'aceptada', 'rechazada'];

export const esCotizacion = (r) => r?.tipo === 'cotizacion';

const n = (v) => { const x = parseFloat(v); return Number.isFinite(x) ? x : 0; };
const pct = (v) => n(v) / 100;

export function catalogoVacio() {
  return { id: CATALOGO_ID, tipo: 'catalogo', nombre: 'Catálogo de servicios', servicios: [] };
}
export function normalizarCatalogo(c) {
  return { ...catalogoVacio(), ...(c || {}), servicios: c?.servicios || [] };
}

// Honorarios como porcentaje del costo estimado de la obra (práctica común en arquitectura).
export function honorariosPorObra(costoObra, porcentaje) {
  return redondear(n(costoObra) * pct(porcentaje));
}

export function calcularPropuesta(c) {
  const servicios = (c.servicios || []).map((s) => ({ ...s, cantidad: n(s.cantidad), precio: n(s.precio), importe: redondear(n(s.cantidad) * n(s.precio)) }));
  const bruto = servicios.reduce((s, x) => s + x.importe, 0);
  const descuento = redondear(bruto * pct(c.descuentoPct));
  const subtotal = bruto - descuento;
  const iva = redondear(subtotal * pct(c.ivaPct));
  const total = subtotal + iva;
  const pagos = (c.pagos || []).map((p) => ({ ...p, pct: n(p.pct), monto: redondear(total * pct(p.pct)) }));
  const sumaPagos = pagos.reduce((s, p) => s + p.pct, 0);
  return { servicios, bruto, descuento, subtotal, iva, total, pagos, sumaPagos, pagosCuadran: Math.abs(sumaPagos - 100) < 0.01 };
}

export const totalCotizacion = (c) => calcularPropuesta(c).total;

export function siguienteFolio(registros, prefijo = 'PR') {
  const max = registros.filter(esCotizacion)
    .reduce((m, r) => Math.max(m, parseInt(String(r.folio || '').split('-')[1], 10) || 0), 0);
  return `${prefijo}-${String(max + 1).padStart(3, '0')}`;
}

export function isoDe(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function vence(cotizacion) {
  if (!cotizacion.fecha) return null;
  const d = new Date(`${cotizacion.fecha}T00:00:00`);
  d.setDate(d.getDate() + (parseInt(cotizacion.vigenciaDias, 10) || 0));
  return isoDe(d);
}

// Guarda en el catálogo los servicios de una propuesta (nuevos o con precio distinto) para reusarlos.
export function aprenderServicios(catalogo, propuesta, nuevoId) {
  const servicios = [...catalogo.servicios];
  for (const s of propuesta.servicios || []) {
    const clave = String(s.descripcion || '').trim().toLowerCase();
    if (!clave || !(n(s.precio) > 0)) continue;
    const i = servicios.findIndex((x) => x.descripcion.trim().toLowerCase() === clave);
    if (i < 0) servicios.push({ id: nuevoId(), descripcion: s.descripcion.trim(), unidad: s.unidad, precio: n(s.precio) });
    else if (servicios[i].precio !== n(s.precio) || servicios[i].unidad !== s.unidad) servicios[i] = { ...servicios[i], unidad: s.unidad, precio: n(s.precio) };
  }
  return { ...catalogo, servicios };
}

export function redondear(v) { return Math.round((v + Number.EPSILON) * 100) / 100; }
