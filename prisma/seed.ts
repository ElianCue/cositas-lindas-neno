import "dotenv/config";
import { PrismaClient, Rol } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORIAS = [
  { nombre: "Scrunchies", slug: "scrunchies", orden: 1 },
  { nombre: "Accesorios", slug: "accesorios", orden: 2 },
  { nombre: "Regalos", slug: "regalos", orden: 3 },
  { nombre: "Temporada", slug: "temporada", orden: 4 },
];

const PRODUCTOS = [
  {
    nombre: "Scrunchie Terciopelo",
    slug: "scrunchie-terciopelo",
    descripcion: "Scrunchie de terciopelo, suave y sin dañar el pelo.",
    precio: 2500,
    stock: 8,
    categoria: "scrunchies",
    destacado: true,
  },
  {
    nombre: "Scrunchie Algodón",
    slug: "scrunchie-algodon",
    descripcion: "Scrunchie de algodón orgánico, ideal para el día a día.",
    precio: 1800,
    stock: 12,
    categoria: "scrunchies",
    destacado: false,
  },
  {
    nombre: "Scrunchie Satinado",
    slug: "scrunchie-satinado",
    descripcion: "Scrunchie satinado con acabado brillante.",
    precio: 2200,
    stock: 5,
    categoria: "scrunchies",
    destacado: false,
  },
  {
    nombre: "Llavero Artesanal",
    slug: "llavero-artesanal",
    descripcion: "Llavero hecho a mano con mostacillas.",
    precio: 1500,
    stock: 20,
    categoria: "accesorios",
    destacado: false,
  },
  {
    nombre: "Broche Mariposa",
    slug: "broche-mariposa",
    descripcion: "Broche de pelo en forma de mariposa.",
    precio: 1200,
    stock: 15,
    categoria: "accesorios",
    destacado: false,
  },
  {
    nombre: "Kit Regalo Neno",
    slug: "kit-regalo-neno",
    descripcion: "Kit de regalo con scrunchie, llavero y broche.",
    precio: 6500,
    stock: 4,
    categoria: "regalos",
    destacado: true,
  },
  {
    nombre: "Cinta Estate",
    slug: "cinta-estate",
    descripcion: "Cinta decorativa de temporada. Sin stock por el momento.",
    precio: 900,
    stock: 0,
    categoria: "temporada",
    destacado: false,
  },
];

async function upsertUsuarios() {
  const usuarios = [
    {
      email: process.env.ADMIN_EMAIL || "admin@cositaslindas.com",
      password: process.env.ADMIN_PASSWORD || "admin1234",
      nombre: "Administrador",
      rol: Rol.ADMIN,
      telefono: process.env.NEXT_PUBLIC_WHATSAPP_NUMERO || null,
    },
    {
      email: process.env.ADMIN_NENO_EMAIL || "neno@cositaslindas.com",
      password: process.env.ADMIN_NENO_PASSWORD || "neno1234",
      nombre: "Neno",
      rol: Rol.ADMIN_NENO,
      telefono: process.env.NEXT_PUBLIC_WHATSAPP_NUMERO || null,
    },
    {
      email: process.env.CLIENTE_EMAIL || "cliente@cositaslindas.com",
      password: process.env.CLIENTE_PASSWORD || "cliente1234",
      nombre: "Cliente Demo",
      rol: Rol.CLIENTE,
      telefono: "5491122334455",
      direccion: "Av. Siempreviva 742",
      localidad: "Springfield",
    },
  ];

  for (const u of usuarios) {
    const password = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { nombre: u.nombre, rol: u.rol },
      create: { ...u, password },
    });
  }
}

async function upsertCatalogo() {
  for (const c of CATEGORIAS) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { nombre: c.nombre, orden: c.orden },
      create: c,
    });
  }

  for (const p of PRODUCTOS) {
    const categoria = await prisma.category.findUnique({ where: { slug: p.categoria } });
    if (!categoria) continue;

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        stock: p.stock,
        destacado: p.destacado,
        categoria_id: categoria.id,
      },
      create: {
        nombre: p.nombre,
        slug: p.slug,
        descripcion: p.descripcion,
        precio: p.precio,
        stock: p.stock,
        destacado: p.destacado,
        categoria_id: categoria.id,
      },
    });
  }
}

async function upsertSettings() {
  const settings: { clave: string; valor: string }[] = [
    { clave: "tienda_nombre", valor: process.env.NEXT_PUBLIC_TIENDA_NOMBRE || "Cositas Lindas Neno" },
    { clave: "whatsapp_numero", valor: process.env.NEXT_PUBLIC_WHATSAPP_NUMERO || "" },
    { clave: "envio_precio", valor: "1500" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { clave: s.clave },
      update: {},
      create: s,
    });
  }

  await prisma.counter.upsert({
    where: { clave: "pedido" },
    update: {},
    create: { clave: "pedido", valor: 0 },
  });
}

async function main() {
  console.log("🌱 Cargando datos iniciales...");
  await upsertUsuarios();
  await upsertCatalogo();
  await upsertSettings();
  console.log("✅ Seed completado.");
  console.log("   👑 ADMIN     ", process.env.ADMIN_EMAIL || "admin@cositaslindas.com");
  console.log("   👩🏻‍💼 ADMIN NENO", process.env.ADMIN_NENO_EMAIL || "neno@cositaslindas.com");
  console.log("   🛍️ CLIENTE   ", process.env.CLIENTE_EMAIL || "cliente@cositaslindas.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
