import { env } from "../config/env";
import { hashPassword } from "../utils/password";
import { database } from "./connection";

interface SeedProduct {
  name: string;
  description: string;
  price: number;
  stock: number;
  diameter: string;
  material: string;
  workingPressure: string;
  imageUrl: string;
}

const SEED_PRODUCTS: SeedProduct[] = [
  {
    name: "Gotero 4Lh Swll",
    description: "Gotero de 4 L/h para riego uniforme y alta precisión.",
    price: 180,
    stock: 20,
    diameter: "16",
    material: "PVC",
    workingPressure: "2",
    imageUrl: "images/products/gotero-swll.png",
  },
  {
    name: "Gotero 8Lh Swll",
    description: "Gotero de caudal estable para riego uniforme.",
    price: 150,
    stock: 15,
    diameter: "16",
    material: "Polietileno",
    workingPressure: "3",
    imageUrl: "images/products/gotero-swll.png",
  },
  {
    name: "Gotero Autocompensado Pce05 2L-H R. Bird Azul",
    description: "Gotero autocompensado para riego localizado y alta uniformidad.",
    price: 200,
    stock: 12,
    diameter: "16",
    material: "PVC",
    workingPressure: "2",
    imageUrl: "images/products/gotero-autocompensado-pce05.png",
  },
];

// [grupo, nombre, descripción]: cada grupo se muestra como un select en el catálogo.
const GROUPED_CATEGORIES: [string, string, string][] = [
  ["Abrazaderas", "Reforzadas", "Abrazaderas reforzadas"],
  ["Abrazaderas", "Reforzadas Inoxidable", "Abrazaderas reforzadas de acero inoxidable"],
  ["Cañerías", "Cobre Tipo L", "Cañerías de cobre tipo L"],
  ["Cañerías", "Cobre Tipo M", "Cañerías de cobre tipo M"],
  ["Complementos de Gasfitería", "Adhesivos", "Adhesivos para gasfitería"],
  ["Complementos de Gasfitería", "Lijas", "Lijas para gasfitería"],
  ["Complementos de Gasfitería", "Lubricantes", "Lubricantes para gasfitería"],
  ["Complementos de Gasfitería", "Siliconas", "Siliconas para gasfitería"],
  ["Bombas", "Accesorios de Bombas", "Accesorios para bombas de agua"],
  ["Bombas", "Aguas Fecales", "Bombas para aguas fecales"],
  ["Bombas", "Aspiración Profunda", "Bombas de aspiración profunda"],
  ["Bombas", "Autocebantes", "Bombas autocebantes"],
  ["Bombas", "Centrífugas Multietapas", "Bombas centrífugas multietapas"],
  ["Bombas", "Periféricas", "Bombas periféricas"],
  ["Bombas", "Sumergible Agua Limpia", "Bombas sumergibles para agua limpia"],
  ["Bombas", "Sumergible Agua Sucia", "Bombas sumergibles para agua sucia"],
  ["Planza", "Cañería Planza", "Cañerías Planza"],
  ["Planza", "Cañería Planza por Gotero", "Cañerías Planza con gotero incorporado"],
  ["Estanques", "Estanques", "Estanques para almacenamiento de agua"],
];

// Precio provisorio y sin stock: el administrador define los valores reales desde su panel.
const REINFORCED_CLAMPS = [
  "Abrazadera Reforzada T499 (17-19)",
  "Abrazadera Reforzada T500 (23-25)",
  "Abrazadera Reforzada T501 (27-30) Versachem",
  "Abrazadera Reforzada T502 (29-31)",
  "Abrazadera Reforzada T503 (33.3-36.5) Versachem",
  "Abrazadera Reforzada T504 (36-39)",
  "Abrazadera Reforzada T505 (39.7-44.5) Versachem",
  "Abrazadera Reforzada T506 (44-47)",
  "Abrazadera Reforzada T507 (46-52.4) Versachem",
  "Abrazadera Reforzada T508 (49.2-57.2) Versachem",
  "Abrazadera Reforzada T509 (52-55)",
  "Abrazadera Reforzada T510 (60-63)",
  "Abrazadera Reforzada T511 (63.5-71.4) Versachem",
  "Abrazadera Reforzada T512 (68-73)",
  "Abrazadera Reforzada T513 (76.2-84.1) Versachem",
  "Abrazadera Reforzada T514 (80-85)",
  "Abrazadera Reforzada T515 (88.9 – 96.8) Versachem",
  "Abrazadera Reforzada T516 (92-97)",
  "Abrazadera Reforzada T517 (98-103)",
  "Abrazadera Reforzada T518 (106.4-114.3) Versachem",
  "Abrazadera Reforzada T519 (113-121)",
  "Abrazadera Reforzada T520 (120.7-128.6) Versachem",
  "Abrazadera Reforzada T521 (131-139)",
  "Abrazadera Reforzada T522 (136.5-144.5) Versachem",
  "Abrazadera Reforzada T523 (149-161)",
  "Abrazadera Reforzada T524 (155.6-163.5) Versachem",
  "Abrazadera Reforzada T525 (166.7-174.6) Versachem",
  "Abrazadera Reforzada T526 (175-187)",
  "Abrazadera Reforzada T527 (192.1-200) Versachem",
  "Abrazadera Reforzada T528 (201-213)",
  "Abrazadera Reforzada T529 (217.5-225.4) Versachem",
  "Abrazadera Reforzada T530 (227-239)",
  "Abrazadera Reforzada T531 (253-265)",
  "Abrazadera Reforzada T532 (279-291)",
];

const STAINLESS_REINFORCED_CLAMPS = [
  "Abrazadera Reforzada Inox T499 (17-19)",
  "Abrazadera Reforzada Inox T500 (23-25)",
  "Abrazadera Reforzada Inox T502 (29-31)",
  "Abrazadera Reforzada Inox T504 (36-39)",
  "Abrazadera Reforzada Inox T506 (44-47)",
  "Abrazadera Reforzada Inox T510 (60-63)",
  "Abrazadera Reforzada Inox T511 (68-73)",
  "Abrazadera Reforzada Inox T514 (80-85)",
  "Abrazadera Reforzada Inox T515 (92-97)",
  "Abrazadera Reforzada Inox T516 (98-103)",
  "Abrazadera Reforzada Inox T519 (113-121)",
  "Abrazadera Reforzada Inox T523 (149-161)",
  "Abrazadera Reforzada Inox T530 (227-239)",
  "Abrazadera Reforzada Inox T531 (253-265)",
  "Abrazadera Reforzada Inox T532 (279-291)",
];

// Ordenadas por diámetro, de menor a mayor.
const COPPER_TYPE_L_PIPES = [
  "Cañería Cu L 3/8",
  "Cañería Cu L 1/2",
  "Cañería Cu L 3/4",
  "Cañería Cu L 1",
  "Cañería Cu L 11/4",
  "Cañería Cu L 11/2",
  "Cañería Cu L 2",
  "Cañería Cu L 21/2",
  "Cañería Cu L 3",
  "Cañería Cu L 4",
  "Cañería Cu L 5",
];

const COPPER_TYPE_M_PIPES = [
  "Cañería Cu M 3/8",
  "Cañería Cu M 1/2",
  "Cañería Cu M 3/4",
  "Cañería Cu M 1",
  "Cañería Cu M 11/4",
  "Cañería Cu M 11/2",
  "Cañería Cu M 2",
  "Cañería Cu M 3",
];

const ERA_ADHESIVES = [
  "Adhesivo Era 3011 118 Ml Azul General Yng",
  "Adhesivo Era 3011 237 Ml Azul General Yng",
  "Adhesivo Era 3011 473 Ml Azul General Yng",
];

const OATEY_ADHESIVES = [
  "Adhesivo Oatey Azul 118 Ml",
  "Adhesivo Oatey Azul 237 Ml",
  "Adhesivo Oatey Azul 473 Ml",
];

const OATEY_GOLD_ADHESIVES = [
  "Adhesivo Oatey Dorado 118 Ml",
  "Adhesivo Oatey Dorado 237 Ml",
  "Adhesivo Oatey Dorado 473 Ml",
];

// Ordenadas por grano, de más grueso a más fino.
const EMERY_SANDPAPERS = [
  "Lija Esmeril 60 Villar",
  "Lija Esmeril 80 Villar",
  "Lija Esmeril 100 Villar",
  "Lija Esmeril 120 Villar",
  "Lija Esmeril 150 Villar",
];

// Ordenadas por línea y luego por diámetro, de menor a mayor.
const PLANZA_PIPES = [
  "Cañería Plansa 1/2 Impla",
  "Cañería Plansa 3/4 Impla",
  "Cañería Plansa 1 Impla",
  "Cañería Plansa 11/4 Impla",
  "Cañería Plansa 11/2 Impla",
  "Cañería Plansa 2 Impla",
  "Cañería Polit D/Pres.90 Lbs 1/2 X 100",
  "Cañería Polit D/Pres 90 Lbs 3/4 X 100",
  "Cañería Polit D/Pres.90 Lbs 1 X 100",
  "Cañería Polit D/Pres.90 Lbs 11/4 X 100",
  "Cañería Polit D/Pres.90 Lbs 11/2 X 100",
  "Cañería Polit D/Pres.90 Lbs 2 X 100",
  "Cañería Polit Liso 16 Mm",
];

// Ordenadas por distancia entre goteros y luego por caudal.
const PLANZA_DRIPPER_PIPES = [
  "Cañería Polit.C/Gotero 0.20 Mt 2Lt/H",
  "Cañería Polit.C/Gotero 0.30 Mt 1.6Lt/H",
  "Cañería Polit.C/Gotero 0.30 Mts 2Lt/H",
  "Cañería Polit.C/Gotero 0.30 Mts 4Lt/H",
  "Cañería Polit.C/Gotero 0.50 Mts 2Lt/H",
  "Cañería Polit.C/Gotero 0.50 Mt 2Lt/H Autocompensado",
  "Cañería Polit.C/Gotero 0.50 Mts 4Lt/H",
  "Cañería Polit.C/Gotero 0.80 Mts 4Lt/H",
  "Cañería Polit.C/Gotero 1.00 Mts 4Lt/H",
  "Cañería Polit.C/Gotero 1 Mt 4Lt/H Autocompensado .Rollo.",
];

const GROUPED_PRODUCTS = [
  {
    groupName: "Abrazaderas",
    categoryName: "Reforzadas",
    names: REINFORCED_CLAMPS,
    description: "Abrazadera reforzada (rango de apriete en mm).",
    imageUrl: "images/products/abrazadera-reforzada.png",
  },
  {
    groupName: "Abrazaderas",
    categoryName: "Reforzadas Inoxidable",
    names: STAINLESS_REINFORCED_CLAMPS,
    description: "Abrazadera reforzada de acero inoxidable (rango de apriete en mm).",
    imageUrl: "images/products/abrazadera-reforzada-inox.png",
  },
  {
    groupName: "Cañerías",
    categoryName: "Cobre Tipo L",
    names: COPPER_TYPE_L_PIPES,
    description: "Cañería de cobre tipo L (diámetro en pulgadas).",
    imageUrl: "images/products/caneria-cobre.png",
  },
  {
    groupName: "Cañerías",
    categoryName: "Cobre Tipo M",
    names: COPPER_TYPE_M_PIPES,
    description: "Cañería de cobre tipo M (diámetro en pulgadas).",
    imageUrl: "images/products/caneria-cobre.png",
  },
  {
    groupName: "Complementos de Gasfitería",
    categoryName: "Adhesivos",
    names: ERA_ADHESIVES,
    description: "Adhesivo para cañerías de PVC.",
    imageUrl: "images/products/adhesivo-era-3011.png",
  },
  {
    groupName: "Complementos de Gasfitería",
    categoryName: "Adhesivos",
    names: OATEY_ADHESIVES,
    description: "Adhesivo PVC de fraguado rápido; une con presencia de agua.",
    imageUrl: "images/products/adhesivo-oatey-azul.png",
  },
  {
    groupName: "Complementos de Gasfitería",
    categoryName: "Adhesivos",
    names: OATEY_GOLD_ADHESIVES,
    description: "Cemento transparente regular especial para PVC.",
    imageUrl: "images/products/adhesivo-oatey-dorado.png",
  },
  {
    groupName: "Complementos de Gasfitería",
    categoryName: "Lijas",
    names: EMERY_SANDPAPERS,
    description: "Lija esmeril en pliego (número de grano).",
    imageUrl: "images/products/lija-esmeril.png",
  },
  {
    groupName: "Complementos de Gasfitería",
    categoryName: "Lubricantes",
    names: ["Lubricante 500 Cc Hoffens"],
    description: "Lubricante para tuberías y fittings de PVC.",
    imageUrl: "images/products/lubricante-hoffens.png",
  },
  {
    groupName: "Complementos de Gasfitería",
    categoryName: "Siliconas",
    names: ["Silicona 300 Ml Poliuretano Genérico"],
    description: "Sellante de poliuretano flexible y pintable.",
    imageUrl: "images/products/silicona-poliuretano.png",
  },
  {
    groupName: "Complementos de Gasfitería",
    categoryName: "Siliconas",
    names: ["Silicona Acrilica Pintable Versachem"],
    description: "Sellador acrílico pintable.",
    imageUrl: "images/products/silicona-acrilica.png",
  },
  {
    groupName: "Complementos de Gasfitería",
    categoryName: "Siliconas",
    names: [
      "Silicona Aluminio Neutra Zinc 310 Cc Genérico",
      "Silicona Blanca 300 Ml Genérico",
      "Silicona Roja A/Temp 280Ml Genérico",
      "Silicona Transparente 300 Ml Genérico",
    ],
    description: "Sellador de silicona multiuso.",
    imageUrl: "images/products/silicona-generica.png",
  },
  {
    groupName: "Planza",
    categoryName: "Cañería Planza",
    names: PLANZA_PIPES,
    description: "Cañería de polietileno en rollo.",
    imageUrl: "images/products/caneria-planza.png",
  },
  {
    groupName: "Planza",
    categoryName: "Cañería Planza por Gotero",
    names: PLANZA_DRIPPER_PIPES,
    description: "Cañería de polietileno con goteros incorporados (distancia entre goteros y caudal).",
    imageUrl: "images/products/caneria-planza-gotero.png",
  },
];

async function seedAdmin(): Promise<void> {
  const { email: adminEmail, password: adminPassword, name: adminName } = env.admin;

  // Si el administrador ya existe, solo se asegura su rol; su contraseña no se modifica.
  await database.query(
    `INSERT INTO users (id, name, email, password, role, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 'admin', NOW())
     ON CONFLICT (email) DO UPDATE SET role = 'admin', status = 'approved'`,
    [adminName, adminEmail, await hashPassword(adminPassword)],
  );
}

async function seedCatalog(): Promise<void> {
  await database.query(`
    INSERT INTO categories (id, name, description, created_at)
    SELECT gen_random_uuid(), 'Goteros', 'Goteros para sistemas de riego', NOW()
    WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Goteros');
  `);

  for (const [groupName, name, description] of GROUPED_CATEGORIES) {
    await database.query(
      `INSERT INTO categories (id, name, description, group_name, created_at)
       SELECT gen_random_uuid(), $1::varchar, $2, $3::varchar, NOW()
       WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = $1::varchar AND group_name = $3::varchar)`,
      [name, description, groupName],
    );
  }

  for (const product of SEED_PRODUCTS) {
    await database.query(
      `INSERT INTO products (
         id, name, description, price, stock, category_id, diameter, material, working_pressure, image_url, created_at
       )
       SELECT gen_random_uuid(), $1::varchar, $2, $3, $4,
         (SELECT id FROM categories WHERE name = 'Goteros' LIMIT 1),
         $5, $6, $7, $8, NOW()
       WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = $1::varchar)`,
      [
        product.name,
        product.description,
        product.price,
        product.stock,
        product.diameter,
        product.material,
        product.workingPressure,
        product.imageUrl,
      ],
    );
  }

  for (const { groupName, categoryName, names, description, imageUrl } of GROUPED_PRODUCTS) {
    for (const name of names) {
      await database.query(
        `INSERT INTO products (id, name, description, price, stock, category_id, image_url, created_at)
         SELECT gen_random_uuid(), $1::varchar, $2, 1, 0,
           (SELECT id FROM categories WHERE name = $3 AND group_name = $5 LIMIT 1),
           $4, NOW()
         WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = $1::varchar)`,
        [name, description, categoryName, imageUrl, groupName],
      );
    }
  }
}

// Datos iniciales: se pueden ejecutar varias veces sin duplicar nada.
export async function seedDatabase(): Promise<void> {
  await seedAdmin();
  await seedCatalog();
}
