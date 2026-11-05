// Express entrega los parámetros de la URL como texto o, en algunos casos, como lista.
// Devuelve siempre un texto (vacío si no viene) para que los controladores no repitan esta lógica.
export function readParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}
