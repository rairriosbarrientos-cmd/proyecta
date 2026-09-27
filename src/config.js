// Identidad y conexión de esta app. Las tablas y funciones de Supabase llevan el prefijo
// para que sus cuentas, licencias y datos queden separados de cualquier otra app del mismo proyecto.
export const APP = {
  nombre: 'Proyecta',
  prefijo: 'proy',
  claveLocal: 'proyecta',
  lema: 'Propuestas de proyecto que cierran',
  descripcion: 'Cotizaciones de proyectos de ingeniería y arquitectura: servicios, entregables y calendario de pagos, en PDF profesional.',
  titulosEntrar: ['Entra a tus propuestas', 'Crea tu cuenta'],
  subtituloEntrar: 'Cotiza topografía, estudios, planos y permisos en minutos, con un PDF que da confianza.',
  beneficios: ['Funciona sin señal; se sincroniza sola.', 'Tu despacho usa los mismos precios y formatos.', 'Tus clientes y precios, separados de otras empresas.'],
  cosa: ['propuesta', 'propuestas'],
  empresaPlaceholder: 'Ej. Taller de Arquitectura Ríos',
  empresaLabel: 'Nombre de tu despacho o empresa',
  correoPlaceholder: 'tu@despacho.mx',
};

export const rpcDe = (nombre) => `${APP.prefijo}_${nombre}`;
export const tablaDe = (nombre) => `${APP.prefijo}_${nombre}`;
