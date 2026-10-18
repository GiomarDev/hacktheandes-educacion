/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Lo único de Node que usa la configuración: así compila sin @types/node (build aislado en Docker o CI).
declare const process: { env: Record<string, string | undefined> };

// En desarrollo, cada microservicio se expone bajo /api/<servicio> (sin CORS en el backend).
const SERVICES = {
  auth: 3000,
  siagie: 3001,
  alerta: 3002,
  simon: 3003,
  escale: 3004,
} as const;

const proxy = Object.fromEntries(
  Object.entries(SERVICES).map(([name, port]) => [
    `/api/${name}`,
    {
      target:
        process.env[`${name.toUpperCase()}_URL`] ?? `http://localhost:${port}`,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(`/api/${name}`, ''),
    },
  ]),
);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy },
  preview: { proxy },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
