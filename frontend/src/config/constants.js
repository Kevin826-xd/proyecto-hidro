export const SESSION_KEY = "hidrocenter_session";

export const FALLBACK_PRODUCTS = [
  {
    id: "demo-gotero-regulable",
    name: "Gotero regulable",
    description: "Gotero regulable para controlar el caudal de riego.",
    price: 100,
    stock: 20,
    categoryId: "demo-goteros",
    diameter: "16",
    material: "PVC",
    workingPressure: "2",
  },
  {
    id: "demo-gotero-autocompensante",
    name: "Gotero autocompensante",
    description: "Gotero de caudal estable para riego uniforme.",
    price: 150,
    stock: 15,
    categoryId: "demo-goteros",
    diameter: "16",
    material: "Polietileno",
    workingPressure: "3",
  },
  {
    id: "demo-gotero-pulsador",
    name: "Gotero con pulsador",
    description: "Gotero con pulsador para riego localizado.",
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