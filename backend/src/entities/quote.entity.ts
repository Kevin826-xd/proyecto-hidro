// Cotización que pide un cliente desde el catálogo. No necesita sesión: si la hay, se guarda quién la pidió.

// Quién pide la cotización. Una empresa debe indicar su razón social y su RUT.
export type QuoteCustomerType = "person" | "company";

export interface QuoteItem {
  productId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Quote {
  id: string;
  // Número correlativo que ve el cliente (COT-000001).
  number: number;
  userId: string | null;
  customerType: QuoteCustomerType;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  companyName: string | null;
  companyRut: string | null;
  notes: string | null;
  items: QuoteItem[];
  total: number;
  validUntil: string;
  createdAt: string;
}

// Lo que envía el navegador: solo productos y cantidades. Los precios los pone el backend.
export interface CreateQuoteInput {
  customerType: QuoteCustomerType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  companyRut?: string;
  notes?: string;
  items: Array<{ productId: string; quantity: number }>;
}
