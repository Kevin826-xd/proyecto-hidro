import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // Las pruebas de integración usan el servidor real, que envía correos por SMTP al aprobar cuentas;
    // un correo lento puede tardar más que los 5 segundos que vitest permite por defecto.
    testTimeout: 15000,
  },
});
