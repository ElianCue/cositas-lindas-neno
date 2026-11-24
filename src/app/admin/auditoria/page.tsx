"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ScrollText, Search } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatFecha } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LogFila {
  id: string;
  user_nombre: string;
  accion: string;
  entidad: string;
  detalle: string;
  created_at: string;
}

const ETIQUETAS_ENTIDAD: Record<string, string> = {
  order: "Pedidos",
  product: "Productos",
  category: "Categorías",
  user: "Usuarios",
  customer: "Clientes",
  setting: "Configuración",
};

export default function AdminAuditoriaPage() {
  const [logs, setLogs] = useState<LogFila[] | null>(null);
  const [entidades, setEntidades] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [entidad, setEntidad] = useState("");
  const [total, setTotal] = useState(0);

  const cargar = useCallback(async () => {
    const params = new URLSearchParams({ limit: "100" });
    if (q.trim()) params.set("q", q.trim());
    if (entidad) params.set("entidad", entidad);
    try {
      const data = await api.get<{
        data: LogFila[];
        meta: { total: number };
        entidades: string[];
      }>(`/api/audit?${params}`);
      setLogs(data.data);
      setTotal(data.meta?.total ?? data.data.length);
      setEntidades(data.entidades ?? []);
    } catch {
      // Sólo ADMIN (auditoria:leer); el menú ya está oculto para otros roles
      setLogs([]);
      setTotal(0);
    }
  }, [q, entidad]);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
  }, [cargar]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Auditoría</h1>
        <p className="text-sm text-muted-foreground">
          {total} registros · quién hizo qué y cuándo
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por detalle, usuario o acción…"
            className="pl-8"
          />
        </div>

        <select
          value={entidad}
          onChange={(e) => setEntidad(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todas las áreas</option>
          {entidades.map((e) => (
            <option key={e} value={e}>
              {ETIQUETAS_ENTIDAD[e] ?? e}
            </option>
          ))}
        </select>
      </div>

      {logs === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-brand" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white p-12 text-center">
          <ScrollText className="mx-auto mb-3 text-brand/40" size={40} />
          <p className="font-semibold">No hay registros{q ? " para esa búsqueda" : ""}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada cambio de estado, stock o configuración queda acá.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Fecha</TableHead>
                <TableHead className="w-40">Usuario</TableHead>
                <TableHead className="w-52">Acción</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatFecha(log.created_at)}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{log.user_nombre}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">
                      {log.accion.replaceAll("_", " ").toLowerCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{log.detalle}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
