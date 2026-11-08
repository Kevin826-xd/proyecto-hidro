import { env } from "../config/env";
import { database } from "../db/connection";
import { CreateQuoteInput, Quote, QuoteItem } from "../entities/quote.entity";
import { NotFoundError, ValidationError } from "../errors/http-errors";

const MAX_LISTED_QUOTES = 100;

interface ProductPriceRow {
  id: string;
  name: string;
  price: string;
}

// Fila de la consulta de cotizaciones: PostgreSQL entrega los NUMERIC como texto.
type QuoteRow = Omit<Quote, "total" | "items"> & {
  total: string;
  items: Array<Omit<QuoteItem, "unitPrice" | "subtotal"> & { unitPrice: string | number; subtotal: string | number }>;
};

const QUOTE_SELECT = `
  SELECT q.id, q.number, q.user_id AS "userId",
         q.customer_name AS "customerName", q.customer_email AS "customerEmail",
         q.customer_phone AS "customerPhone", q.company_name AS "companyName", q.company_rut AS "companyRut",
         q.notes, q.total, q.valid_until::text AS "validUntil", q.created_at AS "createdAt",
         COALESCE(
           json_agg(json_build_object(
             'productId', i.product_id, 'productName', i.product_name, 'unitPrice', i.unit_price,
             'quantity', i.quantity, 'subtotal', i.subtotal
           ) ORDER BY i.position) FILTER (WHERE i.quote_id IS NOT NULL),
           '[]'
         ) AS items
  FROM quotes q
  LEFT JOIN quote_items i ON i.quote_id = q.id`;

function roundPrice(value: number): number {
  return Number(value.toFixed(2));
}

function mapQuote(row: QuoteRow): Quote {
  return {
    ...row,
    total: Number(row.total),
    items: row.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice), subtotal: Number(item.subtotal) })),
  };
}

// Precios actuales de los productos pedidos. Solo se pueden cotizar productos visibles en el catálogo.
async function findProductPrices(productIds: string[]): Promise<Map<string, ProductPriceRow>> {
  const result = await database.query<ProductPriceRow>(
    `SELECT p.id, p.name, p.price
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.id = ANY($1::uuid[]) AND c.visible`,
    [productIds],
  );
  return new Map(result.rows.map((row) => [row.id, row]));
}

export async function getQuoteById(id: string): Promise<Quote> {
  const result = await database.query<QuoteRow>(`${QUOTE_SELECT} WHERE q.id = $1 GROUP BY q.id`, [id]);
  if (!result.rows[0]) {
    throw new NotFoundError("Cotización no encontrada");
  }
  return mapQuote(result.rows[0]);
}

// Los precios salen de la base de datos, nunca de lo que envía el navegador.
// userId es null cuando la pide un visitante sin sesión.
export async function createQuote(input: CreateQuoteInput, userId: string | null): Promise<Quote> {
  const products = await findProductPrices(input.items.map((item) => item.productId));
  if (products.size !== input.items.length) {
    throw new ValidationError("Uno o más productos ya no están disponibles. Quítalos de la cotización e inténtalo nuevamente");
  }

  const items = input.items.map((item, index) => {
    const product = products.get(item.productId) as ProductPriceRow;
    const unitPrice = Number(product.price);
    return {
      position: index + 1,
      productId: product.id,
      productName: product.name,
      unitPrice,
      quantity: item.quantity,
      subtotal: roundPrice(unitPrice * item.quantity),
    };
  });
  const total = roundPrice(items.reduce((sum, item) => sum + item.subtotal, 0));

  // La cotización y sus productos se guardan juntos: si algo falla, no queda una cotización a medias.
  const client = await database.connect();
  let quoteId: string;
  try {
    await client.query("BEGIN");
    const quote = await client.query<{ id: string }>(
      `INSERT INTO quotes (id, user_id, customer_name, customer_email, customer_phone, company_name, company_rut, notes, total, valid_until)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE + $9::int)
       RETURNING id`,
      [
        userId,
        input.customerName,
        input.customerEmail,
        input.customerPhone ?? null,
        input.companyName ?? null,
        input.companyRut ?? null,
        input.notes ?? null,
        total,
        env.quoteValidityDays,
      ],
    );
    quoteId = quote.rows[0].id;

    await client.query(
      `INSERT INTO quote_items (quote_id, position, product_id, product_name, unit_price, quantity, subtotal)
       SELECT $1, * FROM UNNEST($2::int[], $3::uuid[], $4::varchar[], $5::numeric[], $6::int[], $7::numeric[])`,
      [
        quoteId,
        items.map((item) => item.position),
        items.map((item) => item.productId),
        items.map((item) => item.productName),
        items.map((item) => item.unitPrice),
        items.map((item) => item.quantity),
        items.map((item) => item.subtotal),
      ],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return getQuoteById(quoteId);
}

// Cotizaciones recibidas, de la más reciente a la más antigua (para el panel de administración).
export async function listQuotes(): Promise<Quote[]> {
  const result = await database.query<QuoteRow>(
    `${QUOTE_SELECT} GROUP BY q.id ORDER BY q.created_at DESC LIMIT $1`,
    [MAX_LISTED_QUOTES],
  );
  return result.rows.map(mapQuote);
}
