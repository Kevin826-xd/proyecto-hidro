// Tipos de la interfaz que se comparten entre componentes.

export type StatusType = "info" | "success" | "error";

// Muestra un mensaje en la barra de estado del catálogo.
export type SetStatus = (message: string, type?: StatusType) => void;
