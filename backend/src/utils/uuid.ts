const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Evita enviar a PostgreSQL ids con formato inválido, que provocarían un error de la base de datos.
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
