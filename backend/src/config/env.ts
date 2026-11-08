import path from "node:path";
import dotenv from "dotenv";

// La configuración se lee desde backend/.env (también al ejecutar el código compilado en dist/).
// Este es el único archivo que lee process.env; el resto del backend usa el objeto env.
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
  override: true,
  quiet: true,
});

// Texto sin espacios al inicio ni al final; undefined si la variable no existe o está vacía.
function readText(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

// Número de la variable; si no existe o no es un número, se usa el valor por defecto.
function readNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return readText(name) !== undefined && Number.isFinite(value) ? value : fallback;
}

// Plaza de Armas de Chillán.
const DEFAULT_STORE_LOCATION = { lat: -36.6066, lng: -72.1034 };

// Se leen al usarse (getters), así las pruebas pueden cambiar process.env sin volver a importar este archivo.
export const env = {
  get port(): number {
    return readNumber("PORT", 3000);
  },
  get databaseUrl(): string | undefined {
    return process.env.DATABASE_URL;
  },
  get jwtSecret(): string | undefined {
    return readText("JWT_SECRET");
  },

  // Dirección pública del backend, usada en los enlaces del correo (por ejemplo https://api.midominio.cl).
  get publicUrl(): string {
    return readText("PUBLIC_URL")?.replace(/\/+$/, "") || `http://localhost:${env.port}`;
  },
  // Las solicitudes de registro llegan a este correo.
  get adminNotifyEmail(): string {
    return readText("ADMIN_NOTIFY_EMAIL") ?? "hidroelectricos.center@gmail.com";
  },

  // Administrador que se crea al iniciar el servidor.
  get admin() {
    return {
      email: (process.env.ADMIN_EMAIL ?? "admin@hidrocenter.cl").trim().toLowerCase(),
      password: process.env.ADMIN_PASSWORD ?? "Admin123!",
      name: process.env.ADMIN_NAME ?? "Administrador",
    };
  },

  // Sin SMTP_HOST los correos se muestran en la consola en vez de enviarse.
  get smtp() {
    const user = readText("SMTP_USER");
    return {
      host: readText("SMTP_HOST"),
      port: Number(process.env.SMTP_PORT ?? 587),
      user,
      pass: process.env.SMTP_PASS ?? "",
      from: readText("SMTP_FROM") ?? user,
    };
  },

  // Días que dura una cotización desde que se pide.
  get quoteValidityDays(): number {
    return readNumber("QUOTE_VALIDITY_DAYS", 15);
  },

  get shipping() {
    return {
      pricePerKm: readNumber("SHIPPING_PRICE_PER_KM", 700),
      storeLocation: {
        lat: readNumber("STORE_LAT", DEFAULT_STORE_LOCATION.lat),
        lng: readNumber("STORE_LNG", DEFAULT_STORE_LOCATION.lng),
      },
    };
  },
};
