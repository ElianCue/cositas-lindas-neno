import { prisma } from "../prisma";
import { NotFoundError } from "../errors";
import { Accion, logAudit } from "../audit";
import { deleteStorageObjects, pathFromPublicUrl, resolveImagePath } from "../storage";
import { slugify } from "@/lib/slug";
import type {
  CreateProductInput,
  ListProductsInput,
  UpdateProductInput,
} from "../validators/product.validator";

interface Actor {
  id: string;
  nombre: string;
}

const INCLUDE = {
  categoria: { select: { id: true, nombre: true, slug: true } },
  imagenes: { orderBy: { orden: "asc" as const } },
};

/** Genera un slug único: si "scrunchie" está usado, devuelve "scrunchie-2". */
async function slugUnico(base: string, excluirId?: string): Promise<string> {
  const slug = base || "producto";
  let intento = 0;

  while (true) {
    const candidato = intento === 0 ? slug : `${slug}-${intento + 1}`;
    const existe = await prisma.product.findUnique({ where: { slug: candidato } });
    if (!existe || existe.id === excluirId) return candidato;
    intento++;
    if (intento > 50) return `${slug}-${Date.now()}`;
  }
}

export class ProductService {
  static async list(input: ListProductsInput) {
    const where = {
      ...(input.incluirInactivos ? {} : { activo: true }),
      ...(input.destacados ? { destacado: true } : {}),
      ...(input.conStock ? { stock: { gt: 0 } } : {}),
      ...(input.categoria ? { categoria: { slug: input.categoria } } : {}),
      ...(input.q
        ? {
            OR: [
              { nombre: { contains: input.q, mode: "insensitive" as const } },
              { descripcion: { contains: input.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, data] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: INCLUDE,
        orderBy: [{ destacado: "desc" }, { created_at: "desc" }],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
    ]);

    return { data, total, page: input.page, pages: Math.ceil(total / input.limit) };
  }

  /** Trae por id o por slug (la ficha pública usa slug). */
  static async getById(idOslug: string, incluirInactivos = false) {
    const producto = await prisma.product.findFirst({
      where: {
        OR: [{ id: idOslug }, { slug: idOslug }],
        ...(incluirInactivos ? {} : { activo: true }),
      },
      include: INCLUDE,
    });

    if (!producto) throw new NotFoundError("Producto no encontrado");
    return producto;
  }

  static async create(input: CreateProductInput, actor: Actor) {
    const slug = await slugUnico(input.slug || slugify(input.nombre));

    const { imagenes, ...data } = input;

    const producto = await prisma.product.create({
      data: {
        ...data,
        slug,
        descripcion: input.descripcion || null,
        imagenes: {
          create: imagenes.map((img, i) => ({
            ...img,
            orden: img.orden ?? i,
            path: img.path ?? pathFromPublicUrl(img.url),
          })),
        },
      },
      include: INCLUDE,
    });

    await logAudit({
      userId: actor.id,
      userNombre: actor.nombre,
      accion: Accion.CREAR_PRODUCTO,
      entidad: "product",
      entidadId: producto.id,
      detalle: `Creó el producto ${producto.nombre} ($${producto.precio}, stock ${producto.stock})`,
    });

    return producto;
  }

  static async update(id: string, input: UpdateProductInput, actor: Actor) {
    const actual = await prisma.product.findUnique({
      where: { id },
      include: { imagenes: true },
    });
    if (!actual) throw new NotFoundError("Producto no encontrado");

    const { imagenes, slug, ...campos } = input;

    // Archivos que estaban antes y ya no van a estar: se borran del bucket.
    const rutasNuevas = new Set(
      (imagenes ?? [])
        .map((img) => img.path ?? pathFromPublicUrl(img.url))
        .filter((p): p is string => Boolean(p)),
    );
    const rutasAEliminar = imagenes
      ? actual.imagenes
          .map(resolveImagePath)
          .filter((p): p is string => p !== null && !rutasNuevas.has(p))
      : [];

    const data: Record<string, unknown> = { ...campos };
    if (slug !== undefined) {
      data.slug = await slugUnico(slugify(slug), id);
    }
    if (campos.descripcion !== undefined) {
      data.descripcion = campos.descripcion || null;
    }

    const producto = await prisma.$transaction(async (tx) => {
      if (imagenes) {
        await tx.productImage.deleteMany({ where: { product_id: id } });
        await tx.productImage.createMany({
          data: imagenes.map((img, i) => ({
            ...img,
            product_id: id,
            orden: img.orden ?? i,
            path: img.path ?? pathFromPublicUrl(img.url),
          })),
        });
      }

      return tx.product.update({
        where: { id },
        data,
        include: INCLUDE,
      });
    });

    await deleteStorageObjects(rutasAEliminar);

    // Auditoría detallada
    const cambios: string[] = [];
    if (campos.nombre && campos.nombre !== actual.nombre)
      cambios.push(`nombre "${actual.nombre}" → "${producto.nombre}"`);
    if (campos.precio !== undefined && campos.precio !== actual.precio)
      cambios.push(`precio $${actual.precio} → $${producto.precio}`);
    if (campos.activo !== undefined && campos.activo !== actual.activo)
      cambios.push(campos.activo ? "activado" : "desactivado");

    if (cambios.length) {
      await logAudit({
        userId: actor.id,
        userNombre: actor.nombre,
        accion: Accion.MODIFICAR_PRODUCTO,
        entidad: "product",
        entidadId: id,
        detalle: `${producto.nombre}: ${cambios.join(", ")}`,
      });
    }

    // El stock queda registrado aparte, como pide el negocio:
    // "Stock de Scrunchie modificado de 8 a 6 — Sofi — 28/09/2026 15:32"
    if (campos.stock !== undefined && campos.stock !== actual.stock) {
      await logAudit({
        userId: actor.id,
        userNombre: actor.nombre,
        accion: Accion.MODIFICAR_STOCK,
        entidad: "product",
        entidadId: id,
        detalle: `Stock de ${producto.nombre} modificado de ${actual.stock} a ${producto.stock}`,
      });
    }

    return producto;
  }

  static async remove(id: string, actor: Actor) {
    const actual = await prisma.product.findUnique({
      where: { id },
      include: { imagenes: true },
    });
    if (!actual) throw new NotFoundError("Producto no encontrado");

    const rutasImagenes = actual.imagenes
      .map(resolveImagePath)
      .filter((p): p is string => Boolean(p));

    // Si tiene pedidos, preferimos desactivar para no perder el historial visual
    const enPedidos = await prisma.orderItem.count({ where: { product_id: id } });
    if (enPedidos > 0) {
      await prisma.product.update({ where: { id }, data: { activo: false } });

      await logAudit({
        userId: actor.id,
        userNombre: actor.nombre,
        accion: Accion.DESACTIVAR_PRODUCTO,
        entidad: "product",
        entidadId: id,
        detalle: `${actual.nombre}: se desactivó (tiene ${enPedidos} pedidos en el historial)`,
      });

      return { id, desactivado: true };
    }

    await prisma.product.delete({ where: { id } });
    await deleteStorageObjects(rutasImagenes);

    await logAudit({
      userId: actor.id,
      userNombre: actor.nombre,
      accion: Accion.ELIMINAR_PRODUCTO,
      entidad: "product",
      entidadId: id,
      detalle: `Eliminó el producto ${actual.nombre}`,
    });

    return { id, desactivado: false };
  }
}
