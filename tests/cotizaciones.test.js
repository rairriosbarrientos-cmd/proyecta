import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularPropuesta, honorariosPorObra, siguienteFolio, vence, aprenderServicios, normalizarCatalogo } from '../src/cotizaciones/calculo.js';

test('propuesta con descuento, IVA y calendario de pagos', () => {
  const r = calcularPropuesta({
    servicios: [{ id: 'a', cantidad: 12, precio: 2500 }, { id: 'b', cantidad: '18', precio: '1800' }],
    descuentoPct: 10, ivaPct: 16, pagos: [{ id: 'p1', concepto: 'Anticipo', pct: 50 }, { id: 'p2', concepto: 'Entrega', pct: 50 }],
  });
  assert.equal(r.bruto, 62400);
  assert.equal(r.descuento, 6240);
  assert.equal(r.subtotal, 56160);
  assert.equal(r.iva, 8985.6);
  assert.equal(r.total, 65145.6);
  assert.equal(r.pagos[0].monto, 32572.8);
  assert.ok(r.pagosCuadran);
  assert.equal(calcularPropuesta({ servicios: [], pagos: [{ id: 'x', pct: 60 }] }).pagosCuadran, false);
});

test('honorarios como porcentaje de obra, folios y vigencia', () => {
  assert.equal(honorariosPorObra(2500000, 6), 150000);
  assert.equal(siguienteFolio([{ tipo: 'cotizacion', folio: 'PR-009' }, { tipo: 'catalogo' }]), 'PR-010');
  assert.equal(siguienteFolio([]), 'PR-001');
  assert.equal(vence({ fecha: '2026-09-27', vigenciaDias: 30 }), '2026-10-27');
});

test('el catálogo aprende servicios y precios nuevos', () => {
  let i = 0;
  const cat = normalizarCatalogo({ servicios: [{ id: 's1', descripcion: 'Levantamiento topográfico', unidad: 'ha', precio: 2000 }] });
  const nuevo = aprenderServicios(cat, { servicios: [
    { descripcion: 'levantamiento topográfico ', unidad: 'ha', precio: 2500 },
    { descripcion: 'Planos ejecutivos', unidad: 'plano', precio: 1800 },
    { descripcion: 'Sin precio', unidad: 'lote', precio: '' },
  ] }, () => `n${i++}`);
  assert.equal(nuevo.servicios.length, 2);
  assert.equal(nuevo.servicios[0].precio, 2500);
  assert.equal(nuevo.servicios[1].descripcion, 'Planos ejecutivos');
});
