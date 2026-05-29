"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateUserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!apiUrl) {
      setError("Falta configurar NEXT_PUBLIC_API_URL en el entorno.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Credenciales incorrectas. Revisá email y contraseña."
        );
        return;
      }

      if (data.user?.user_metadata?.role !== "admin") {
        setError("Esta cuenta no tiene permisos de administrador.");
        return;
      }

      if (!data.session?.access_token) {
        setError("No se recibió sesión del servidor. Intentá de nuevo.");
        return;
      }

      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("adminToken", data.session.access_token);
      if (data.user.user_metadata?.first_name) {
        localStorage.setItem("userName", data.user.user_metadata.first_name);
      }

      router.push("/dashboard");
    } catch {
      setError("No se pudo conectar con el servidor. Verificá tu conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="mb-12 flex flex-col items-center">
        <h1 className="mb-8 text-6xl font-bold text-black">Padel Managers</h1>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mb-4 w-full rounded border px-4 py-2 disabled:opacity-60"
          required
          disabled={isLoading}
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="mb-4 w-full rounded border px-4 py-2 disabled:opacity-60"
          required
          disabled={isLoading}
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-black px-6 py-3 text-base text-white shadow-lg transition-colors duration-300 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Ingresando…" : "Login"}
        </button>
      </form>
    </div>
  );
}
