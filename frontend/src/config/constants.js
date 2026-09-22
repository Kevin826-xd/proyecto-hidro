export const SESSION_KEY = "hidrocenter_session";

export const FALLBACK_PRODUCTS = [
  {
    id: "demo-gotero-4lh-swll",
    name: "Gotero 4Lh Swll",
    description: "Gotero de 4 L/h para riego uniforme y alta precisión.",
    price: 100,
    stock: 20,
    categoryId: "demo-goteros",
    diameter: "16",
    material: "PVC",
    workingPressure: "2",
  },
  {
    id: "demo-gotero-8lh-swll",
    name: "Gotero 8Lh Swll",
    description: "Gotero de caudal estable para riego uniforme.",
    price: 150,
    stock: 15,
    categoryId: "demo-goteros",
    diameter: "16",
    material: "Polietileno",
    workingPressure: "3",
  },
  {
    id: "demo-gotero-autocompensado-pce05",
    name: "Gotero Autocompensado Pce05 2L-H R. Bird Azul",
    description: "Gotero autocompensado para riego localizado y alta uniformidad.",
    price: 200,
    stock: 12,
    categoryId: "demo-goteros",
    diameter: "16",
    material: "PVC",
    workingPressure: "2",
  },
];

export const FALLBACK_CATEGORIES = [
  {
    id: "demo-goteros",
    name: "Goteros",
    description: "Goteros para sistemas de riego.",
  },
];

export const SHIPPING_LABELS = {
  pickup: "retiro en tienda",
  home: "despacho a domicilio",
  express: "despacho express",
};