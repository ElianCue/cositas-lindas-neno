# 👒 Cositas Lindas Neno — Tienda online

Tienda online para el emprendimiento familiar: catálogo, carrito, pedidos por WhatsApp,
panel de administración con clientes, productos, stock, facturación y roles.

> 📌 **Este README es el PLAN MAESTRO (TODO).** Cada fase y cada paso tiene su checkbox.
> Se va tildando a medida que se avanza para saber siempre **en qué fase estamos**.

---

## 🧱 Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router + Route Handlers, **sin Express**) |
| UI | **shadcn/ui** (Base UI) + Tailwind CSS 4 · lucide-react |
| Base de datos | **Supabase** (Postgres) con **Prisma 6** |
| Auth | JWT propio en cookie httpOnly + bcrypt (roles en la app) |
| Imágenes | Supabase Storage |
| Estado (carrito) | Zustand + localStorage |
| Validación | Zod 4 |
| Deploy | Vercel + Supabase |

---

## 🚀 Setup

```bash
pnpm install                 # instalar dependencias
cp .env.example .env         # completar variables (ver abajo)
pnpm db:migrate              # crear tablas en Supabase (primera vez: --name init)
pnpm db:seed                 # usuarios de prueba + categorías + productos
pnpm dev                     # http://localhost:3000
```

Requerido: Node 20+ y un proyecto **Supabase** con una base Postgres.

### Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | servidor de desarrollo |
| `pnpm build` | `prisma generate` + build de producción |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript sin emitir |
| `pnpm db:migrate` | migraciones Prisma (dev) |
| `pnpm db:deploy` | migraciones en producción |
| `pnpm db:seed` | datos iniciales |
| `pnpm db:imagenes` | imágenes demo de productos (idempotente) |
| `pnpm db:studio` | Prisma Studio (ver/editar tablas) |

### Usuarios del seed

| Rol | Email (default) | Acceso |
|---|---|---|
| 👑 ADMIN | `admin@cositaslindas.com` | TODO, incluye usuarios y config |
| 👩🏻‍💼 ADMIN NENO | `neno@cositaslindas.com` | gestión del negocio |
| 🛍️ CLIENTE | `cliente@cositaslindas.com` | solo su cuenta y sus pedidos |

---

## 🗂️ Estructura

```
cositas-lindas-neno/
├── prisma/
│   ├── schema.prisma          # modelo de datos completo
│   ├── seed.ts                # datos iniciales
│   └── migrations/
├── src/
│   ├── proxy.ts               # guards de rutas (Next 16: ex-middleware)
│   ├── app/
│   │   ├── (tienda)/          # rutas PÚBLICAS del cliente
│   │   │   ├── page.tsx                   # home
│   │   │   ├── catalogo/                  # catálogo + búsqueda + filtros
│   │   │   ├── producto/[slug]/           # ficha de producto
│   │   │   ├── carrito/                   # carrito
│   │   │   ├── checkout/                  # entrega + pago + dirección
│   │   │   ├── pedido/[numero]/           # confirmación + botón WhatsApp
│   │   │   ├── login/ · registro/
│   │   │   ├── cuenta/                    # perfil
│   │   │   └── mis-pedidos/               # historial propio
│   │   ├── admin/
│   │   │   ├── layout.tsx                 # sidebar + guard de sesión
│   │   │   ├── page.tsx                   # dashboard (estadísticas)
│   │   │   ├── login/
│   │   │   ├── pedidos/                   # estados, flags, stock
│   │   │   ├── clientes/                  # búsqueda, historial, alta manual
│   │   │   ├── productos/ · categorias/   # CRUD + stock + fotos
│   │   │   ├── ventas/                    # facturación + KPIs + CSV
│   │   │   ├── usuarios/                  # solo ADMIN
│   │   │   ├── auditoria/                 # quién modificó qué
│   │   │   └── config/                    # solo ADMIN
│   │   └── api/
│   │       ├── auth/       login · logout · me · register
│   │       ├── products/ · categories/
│   │       ├── orders/     creación, lista, detalle, estados
│   │       ├── customers/  clientes (staff)
│   │       ├── payments/ · sales/ · users/ · audit/
│   │       ├── upload/ · health/
│   ├── lib/
│   │   ├── api-client.ts     # fetch wrapper (credentials: include)
│   │   ├── whatsapp.ts       # links wa.me precargados
│   │   ├── csv.ts            # export facturación
│   │   └── api/
│   │       ├── env.ts prisma.ts errors.ts response.ts validation.ts
│   │       ├── auth.ts permissions.ts audit.ts
│   │       ├── services/     # lógica de negocio (una por entidad)
│   │       └── validators/   # schemas Zod
│   ├── components/
│   │   ├── tienda/  admin/  ui/
│   ├── store/                 # zustand: carrito
│   └── hooks/
```

---

## 📋 PLAN — FASES

> Estado actual: **🟢 Todas las fases completadas (0–8)** — pendiente sólo la demo visual
> Avance: Fase 0–8 ✅ · Falta: prueba visual de la UI (Fase 4/6/7) y número de WhatsApp real en settings
> Regla: cada fase termina con un **checkpoint** → se revisa el código, se corrige, y recién ahí se tilda y sigue la siguiente.

### ✅ Fase 0 — Inicialización del proyecto
- [x] `create-next-app` (TypeScript, Tailwind, App Router, `src/`, alias `@/*`)
- [x] Dependencias: prisma, @prisma/client, zod, bcryptjs, jsonwebtoken, zustand, lucide-react, @supabase/supabase-js, clsx, tailwind-merge, cva
- [x] Prisma fijado en versión estable 6.x (evitar RC)
- [x] Árbol de carpetas base (`app/`, `api/`, `lib/`, `components/`, `store/`)
- [x] `.env.example` con todas las variables documentadas
- [x] `.gitignore` (ignora `.env`, conserva `.env.example`)
- [x] Scripts de `package.json` (`typecheck`, `db:*`)
- [x] README con este plan
- [x] **Checkpoint:** `pnpm dev` levanta · `pnpm lint` · `pnpm typecheck` sin errores

### ✅ Fase 1 — Base de datos
- [x] `prisma/schema.prisma` con enums y tablas:
  - [x] `users` (rol ADMIN | ADMIN_NENO | CLIENTE, WhatsApp obligatorio en cliente)
  - [x] `categories`, `products`, `product_images`
  - [x] `orders` (numero único #000125, estado + flags pagado/enviado/entregado)
  - [x] `order_items` (snapshots de nombre y precio)
  - [x] `payments`, `audit_logs`, `settings`, `counter`
- [x] `seed.ts`: 3 usuarios (uno por rol), categorías, productos de ejemplo (Scrunchie con stock 8)
- [x] Migración inicial `pnpm db:migrate --name init` (aplicada: `20260929203130_init`)
- [x] **Checkpoint:** tablas creadas y seed cargado (3 usuarios · 4 categorías · 7 productos · `GET /api/health` → `db: ok`)

### ✅ Fase 2 — Núcleo backend
- [x] `lib/api/env.ts` — variables validadas con Zod
- [x] `lib/api/prisma.ts` — singleton
- [x] `lib/api/errors.ts` — `AppError`, `ValidationError` 400, `UnauthorizedError` 401, `ForbiddenError` 403, `NotFoundError` 404, `ConflictError` 409
- [x] `lib/api/response.ts` — envelope `{status, data}` + `errorResponse()`
- [x] `lib/api/validation.ts` — wrapper Zod → `ValidationError`
- [x] `lib/api/auth.ts` — JWT en cookie httpOnly, `requireAuth()` (verifica en BD que el usuario siga activo)
- [x] `lib/api/permissions.ts` — **matriz de roles** (recurso → acción → roles permitidos)
- [x] `lib/api/audit.ts` — `logAudit()` + constantes de acción
- [x] `src/proxy.ts` — guarda `/admin/*`, `/cuenta/*`, `/mis-pedidos/*` (Next 16: `proxy.ts`, no `middleware.ts`)
- [x] **Checkpoint:** typecheck + lint en verde

### ✅ Fase 3 — Auth y usuarios
- [x] validators de auth y usuarios (Zod)
- [x] API: `POST /api/auth/login` · `POST /api/auth/logout` · `GET/PATCH /api/auth/me` · `POST /api/auth/register` · `POST /api/auth/password`
- [x] API CRUD `/api/users` (sólo ADMIN, con auditoría)
- [x] `lib/api-client.ts` — wrapper de fetch con `ApiError`
- [x] Páginas: `/login`, `/registro`, `/admin/login` (con shadcn/ui)
- [x] `admin/layout.tsx` con guard de sesión + sidebar filtrada por rol
- [x] **Checkpoint:** los 3 roles loguean; CLIENTE no entra a `/admin` (307) ni a `/api/users` ni a `POST /api/products` (403); ADMIN NENO crea producto (201) pero no ve `/api/users` (403); `/admin` con cookie ADMIN → 200

### ✅ Fase 4 — Catálogo
- [x] validators + services de products/categories (con auditoría de stock y cambios)
- [x] API CRUD con permisos de staff: `GET/POST /api/products`, `GET/PATCH/DELETE /api/products/[id]` (acepta id o slug), `GET/POST /api/categories`, `PATCH/DELETE /api/categories/[id]`
- [x] `POST /api/upload` → Supabase Storage (bucket `productos`, público, 5MB máx) — *probado: claves válidas*
- [x] `GET /api/health` (chequeo de conexión a la BD)
- [x] Panel `/admin/productos`: tabla, dialog de edición, stock, activar/desactivar, fotos (subida múltiple con preview y foto principal)
- [x] Panel `/admin/categorias`: CRUD con conteo de productos
- [x] **Checkpoint:** CRUD probado con curl (crear/editar/desactivar/eliminar; público vs staff) — *falta la prueba visual con fotos desde el navegador*

### 🔵 Fase 5 — Tienda del cliente + pedidos ✅
- [x] Store del carrito (zustand + persistencia en localStorage, respeta stock)
- [x] `/` home: hero, categorías, destacados
- [x] `/catalogo`: búsqueda, filtros por categoría, destacados, paginación
- [x] `/producto/[slug]`: foto, precio, stock, cantidad, agregar al carrito
- [x] `/carrito`: stepper, quitar, subtotal, vaciar
- [x] `/checkout`: entrega (envío/retiro), pago, dirección, datos (WhatsApp) + prefill si hay sesión
- [x] API `POST /api/orders`: transacción, número secuencial `#000001`, snapshots de precios, **no descuenta stock** (valida stock insuficiente con 400)
- [x] `/pedido/[numero]`: "¡Pedido recibido! … pendiente de confirmación" + botón 💬 WhatsApp precargado (número desde settings)
- [x] `GET /api/orders` (mis pedidos) + `/cuenta` (editar datos, cambiar contraseña) y `/mis-pedidos` (estado + historial)
- [x] Imágenes demo subidas al bucket (`pnpm db:imagenes`, idempotente)
- [x] **Checkpoint:** compra E2E verificada con curl: pedido queda PENDIENTE, stock intacto, numeración secuencial, validaciones 400, redirección a `/login` sin sesión
- [ ] ⚠ Pendiente: cargar el `whatsapp_numero` real en settings para que el botón de WhatsApp funcione (hoy muestra texto alternativo)

### ✅ Fase 6 — Panel de pedidos, clientes, estados y stock
- [x] `/admin/pedidos`: tabla con filtros por estado + búsqueda (cliente/WhatsApp/número) + detalle `/admin/pedidos/[id]`
- [x] Cambio de estados (pendiente → contactado → confirmado → …) + flags independientes pagado/enviado/entregado
- [x] Transiciones con lógica de stock: **confirmar descuenta, cancelar restaura** (y verificar stock insuficiente con 400 al confirmar)
- [x] Auditoría automática: `Pedido #000001 (Maria Prueba): estado PENDIENTE → CONFIRMADO · Stock: Kit Regalo Neno -2`
- [x] `/admin/clientes`: búsqueda por nombre/WhatsApp/email, detalle con historial y stats (pedidos + gastado), alta manual con contraseña auto-generada
- [x] APIs: `GET/POST /api/customers`, `GET /api/customers/[id]` (permisos `clientes:leer/escribir`)
- [x] **Checkpoint backend:** probado con curl (4→2 al confirmar, 2→4 al cancelar, flags no tocan stock, 400 sin stock; 401/403 de permisos)
- [ ] **Pendiente:** prueba visual de la UI (confirmar/cancelar un pedido desde el navegador)

### ✅ Fase 7 — Facturación y estadísticas
- [x] `services/sales`: rangos (hoy/7 días/mes/custom), total vendido, cobrado, pendiente, pedidos, ticket promedio, ventas por categoría, productos más vendidos
- [x] API `GET /api/sales` (KPIs + top + pedidos paginados) + `GET /api/sales/export` (CSV con `;` y BOM para Excel)
- [x] `/admin/ventas`: filtros de rango, 5 KPIs, barras de productos/categorías, tabla `Fecha | Pedido | Cliente | Medio de pago | Estado | Total`, paginación y export
- [x] `/admin` dashboard con KPIs del mes, últimos pedidos, más vendidos y accesos rápidos
- [x] **Checkpoint:** totales cruzados contra los pedidos de prueba (vendido 27.500 = 14.500 + 6.500 + 6.500 ✓ · cobrado 14.500 = #1 ✓ · 3 pedidos · ticket 9.167 ✓ · CSV y permisos 401/403/200 ✓)

### ✅ Fase 8 — Auditoría, permisos y pulido
- [x] `/admin/auditoria` + `GET /api/audit`: filtros por búsqueda y entidad; formato `Stock de Kit Regalo Neno modificado de 4 a 2 — Administrador — 30/09/2026 15:32`
- [x] `/admin/usuarios` (solo ADMIN): CRUD con roles, búsqueda, filtros y confirmación de borrado — 403 amigable para otros roles
- [x] `/admin/config` (solo ADMIN): `GET ?panel=true` + `PATCH /api/settings` con whitelist de claves y auditoría `CAMBIAR_CONFIG` (`envio_precio: "1500" → "1800"`)
- [x] **Matriz de permisos ruta por ruta** (22 checks con curl): NENO puede catálogo/pedidos/clientes/ventas pero 403 en users/audit/config; CLIENTE 403 en todo lo de staff
- [x] Mobile: menú hamburguesa con Sheet en la tienda (Inicio/Catálogo/Destacados + sesión), grids responsive 2→4 columnas
- [x] Estados vacíos, loading y errores en tienda y panel (carrito vacío, sin pedidos, sin resultados, 403 amigables)
- [x] `pnpm lint` + `pnpm typecheck` + `pnpm build` en verde
- [ ] **Checkpoint final:** demo completa del flujo (visual, en navegador)

---

## 📦 Pedidos — flujo y estados

```
Cliente arma el carrito → Checkout → PENDIENTE (stock sin tocar)
        → pantalla de confirmación + botón 💬 WhatsApp
        → nosotras confirmamos por WhatsApp
        → CONTACTADO → CONFIRMADO (acá sí descuenta stock)
        → PAGADO → PREPARANDO → ENVIADO → ENTREGADO
        → (en cualquier momento) CANCELADO (restaura stock si estaba confirmado)
```

- `pagado`, `enviado` y `entregado` además se pueden marcar **independientemente** desde el panel.
- **Stock:** agregar al carrito no descuenta nada; se descuenta al **confirmar** y se restaura al **cancelar**.
- Cada pedido guarda: número único, cliente, WhatsApp, fecha/hora, productos con precio al momento de la compra, subtotal, envío, total, forma de pago, forma de entrega, dirección y estado.

## 🔐 Permisos

| Acción | 👑 ADMIN | 👩🏻‍💼 ADMIN NENO | 🛍️ CLIENTE |
|---|:---:|:---:|:---:|
| Ver/crear/editar/eliminar productos, categorías, stock | ✅ | ✅ | ❌ |
| Ver/editar pedidos, cambiar estados, registrar pagos | ✅ | ✅ | solo los suyos (ver) |
| Ver clientes e historial, crear clientes manuales | ✅ | ✅ | ❌ |
| Ver ventas, facturación y estadísticas | ✅ | ✅ | ❌ |
| Gestionar usuarios y roles | ✅ | ❌ | ❌ |
| Configuración técnica del sistema | ✅ | ❌ | ❌ |
| Ver auditoría de cambios | ✅ | ❌ | ❌ |
| Registrarse, comprar, ver sus pedidos y su historial | ✅ | ✅ | ✅ |

---

## 🧭 Notas técnicas (Next.js 16)

- **`proxy.ts`** reemplaza a `middleware.ts` (mismo comportamiento, matcher igual).
- `params`, `searchParams` y `cookies()` son **async** → `await params`, `await cookies()`.
- Route handlers tipan el contexto con `RouteContext<'/ruta/[id]>'` y hacen `await ctx.params`.
- Tailwind 4 se configura en CSS (`@theme`), no con `tailwind.config.js`.
- Docs locales de Next: `node_modules/next/dist/docs/`.
