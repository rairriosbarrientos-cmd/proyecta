# Proyecta

Propuestas técnico-económicas para proyectos de ingeniería y arquitectura, con PDF profesional. Funciona sin internet.

## Qué hace
- **Propuestas**: servicios (topografía, estudios, proyecto arquitectónico, estructural, planos, permisos…) con cantidad y precio, o como **% del costo de obra**.
- **Alcance, entregables y exclusiones** en la propuesta y en el PDF.
- **Forma de pago** con esquemas rápidos (50/50, 40/30/30, 30/40/30) y aviso si no suma 100%.
- **Descuento e IVA**, vigencia y plazo.
- **Estados**: borrador → enviada → aceptada / rechazada, con tablero de montos en juego, ganados y % de cierre.
- **Mis servicios**: al enviar una propuesta, sus servicios y precios se guardan solos para la siguiente.
- **Cuentas por empresa**: código de invitación con aprobación, roles (admin, captura, solo lectura) y licencias que activa el dueño.

## Servidor (Supabase)
Usa tablas propias con prefijo `proy_` (`proy_empresas`, `proy_miembros`, `proy_registros`) y funciones `proy_*`.
Comparte con la plataforma solo `plataforma_admins`, `es_admin_plataforma()` y `_nuevo_codigo()`; la migración los crea solo si faltan.

1. Aplica `supabase/migrations/001_cuentas.sql` en el SQL Editor (se puede correr más de una vez).
2. Para ser dueño (activar licencias): `insert into public.plataforma_admins (user_id) values ('<tu user id>');`
3. La URL y la llave publishable están en `src/nube/cliente.js` (o variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).

## Publicar (Netlify)
Importa el repo en Netlify; `netlify.toml` ya trae el build (`npm run build`, carpeta `dist`).

## Pruebas
```bash
npm test                                                    # cálculos y sincronización
PGHOST=/tmp PGPORT=5433 PGUSER=postgres bash supabase/tests/correr.sh   # seguridad de la base (Postgres local)
```
