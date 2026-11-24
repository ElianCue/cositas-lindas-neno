export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** Errores de validación: [{ field, message }] */
  get fieldErrors(): { field: string; message: string }[] {
    const errors = (this.data as { errors?: { field: string; message: string }[] })?.errors;
    return Array.isArray(errors) ? errors : [];
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor", 0);
  }

  let json: { status?: string; data?: T; message?: string; errors?: unknown } | null = null;
  try {
    json = await response.json();
  } catch {
    // respuesta sin JSON
  }

  if (!response.ok || json?.status === "error") {
    throw new ApiError(json?.message ?? "Ocurrió un error", response.status, json);
  }

  return (json && "data" in json ? json.data : json) as T;
}

type Body = Record<string, unknown> | unknown[] | undefined;

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: Body) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: Body) =>
    request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: Body) =>
    request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
