import type { ShippingMethod } from "../state/appState";

export const SESSION_KEY = "hidrocenter_session";
export const GUEST_CART_KEY = "hidrocenter_guest_cart";
export const CATALOG_VIEW_KEY = "hidrocenter_catalog_view";
export const QUOTE_LIST_KEY = "hidrocenter_quote_list";

export const SHIPPING_LABELS: Record<ShippingMethod, string> = {
  pickup: "retiro en tienda",
  home: "despacho a domicilio",
};
