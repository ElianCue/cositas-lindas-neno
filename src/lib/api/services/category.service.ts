import { prisma } from "../prisma";
import { ConflictError, NotFoundError } from "../errors";
import { Accion, logAudit } from "../audit";
import { slugify } from "@/lib/slug";
import type {
  CreateCategoryInput,
  ListCategoriesInput,
  UpdateCategoryInput,
} from "../validators/category.validator";

interface Actor {
  id: string;
  nombre: string;
}

export class CategoryService {
  static async list(input: ListCategoriesInput) {
    const data = await prisma.category.findMany({
      where: input.todas ? {} : { activo: true },
      orderBy: [{ orden: "asc" }, { nombre: "asc" }],
      include: { _count: { select: { products: true } } },
    });
    return { data, total: data.length };
  }

  static async getById(id: string) {
    const categoria = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!categoria) throw new NotFoundError("Categoría no encontrada");
    return categoria;
  }

  static async create(input: CreateCategoryInput, actor: Actor) {
    const slug = input.slug || slugify(input.nombre);

    const existe = await prisma.category.findUnique({ where: { slug } });
    if (existe) throw new ConflictError("Ya existe una categoría con ese nombre");

    const categoria = await prisma.category.create({
      data: { nombre: input.nombre, slug, orden: input.orden, activo: input.activo },
      include: { _count: { select: { products: true } } },
    });

    await logAudit({
      userId: actor.id,
      userNombre: actor.nombre,
      accion: Accion.CREAR_CATEGORIA,
      entidad: "category",
      entidadId: categoria.id,
      detalle: `Creó la categoría ${categoria.nombre}`,
    });

    return categoria;
  }

  static async update(id: string, input: UpdateCategoryInput, actor: Actor) {
    const actual = await prisma.category.findUnique({ where: { id } });
    if (!actual) throw new NotFoundError("Categoría no encontrada");

    if (input.slug && input.slug !== actual.slug) {
      const duplicada = await prisma.category.findUnique({ where: { slug: input.slug } });
      if (duplicada) throw new ConflictError("Ya existe una categoría con ese nombre");
    }

    const categoria = await prisma.category.update({
      where: { id },
      data: {
        ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
        ...(input.slug !== undefined ? { slug: slugify(input.slug) } : {}),
        ...(input.orden !== undefined ? { orden: input.orden } : {}),
        ...(input.activo !== undefined ? { activo: input.activo } : {}),
      },
      include: { _count: { select: { products: true } } },
    });

    await logAudit({
      userId: actor.id,
      userNombre: actor.nombre,
      accion: Accion.MODIFICAR_CATEGORIA,
      entidad: "category",
      entidadId: id,
      detalle: `Modificó la categoría ${categoria.nombre}`,
    });

    return categoria;
  }

  static async remove(id: string, actor: Actor) {
    const actual = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!actual) throw new NotFoundError("Categoría no encontrada");

    if (actual._count.products > 0) {
      throw new ConflictError(
        `No se puede eliminar: tiene ${actual._count.products} producto(s). Movelos o desactivalos primero.`,
      );
    }

    await prisma.category.delete({ where: { id } });

    await logAudit({
      userId: actor.id,
      userNombre: actor.nombre,
      accion: Accion.ELIMINAR_CATEGORIA,
      entidad: "category",
      entidadId: id,
      detalle: `Eliminó la categoría ${actual.nombre}`,
    });

    return { id };
  }
}
