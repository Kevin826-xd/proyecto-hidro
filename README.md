# Plataforma Web E-commerce y Gestión Comercial para la Venta de Materiales e Insumos Hidráulicos

> **Proyecto de Titulación** — Ingeniería en Ejecución en Computación e Informática  
> **Universidad del Bío-Bío** | Facultad de Ciencias Empresariales | Departamento de Sistemas de Información  
> **Cliente / Empresa:** Servicios Hidroeléctricos Ñuble Ltda.  
> **Autor:** Kevin Aldair Estuardo Anabalón  

---

##  Descripción del Proyecto

Este sistema web e-commerce a medida está diseñado específicamente para responder a las necesidades técnicas y comerciales de **Servicios Hidroeléctricos Ñuble Ltda.**, pyme orientada a la provisión, asesoría y venta de materiales, repuestos y equipos hidráulicos (tuberías, bombas de agua, conexiones, válvulas y sistemas de riego/abastecimiento).

La plataforma resuelve la limitación geográfica, la dependencia de atención telefónica/presencial y la falta de un canal digital formal con filtros por especificaciones hidráulicas avanzadas (medidas en pulgadas/mm, presión de trabajo PN/SDR) e integración de pasarelas de pago digitales en Chile.

---

##  Características Principales

###  Módulo Comercial y de Cliente
- **Catálogo Técnico Interactivo:** Filtros especializados por diámetro, presión de trabajo (PN/SDR), material y tipo de insumo hídrico.
- **Cotizador Automático:** Generación instantánea de cotizaciones corporativas formalizadas en formato **PDF**.
- **Carrito de Compras y Checkout:** Gestión ágil de compras con integración a pasarelas de pago electrónicas (**Webpay Plus / Mercado Pago**).
- **Seguimiento de Pedidos y Perfil:** Espacio para que los clientes consulten el estado de sus pedidos e historial de cotizaciones.

###  Módulo de Administración e Inventario
- **Dashboard Administrativo:** Panel de control con métricas clave de ventas y gestión comercial.
- **Gestión de Stock y Alertado:** Control de inventario en tiempo real con alertas de stock crítico de insumos hidráulicos.
- **Gestión de Pedidos:** Módulo centralizado para el cambio de estados y emisión de documentos de compra.

---

##  Arquitectura y Tecnologías

El proyecto sigue una arquitectura web modular (**Full-Stack**) con separación clara entre catálogo, carrito, pasarelas de pago y administración:

- **Frontend:** HTML5, CSS3 y TypeScript con Vite; mapas con Leaflet
- **Backend:** Node.js, Express y TypeScript (API RESTful)
- **Base de Datos:** PostgreSQL
- **Pasarela de Pagos:** Webpay / Mercado Pago API
- **Generación de Reportes:** Generación dinámica de PDF (Cotizaciones)
- **Metodología de Desarrollo:** Ágil (Scrum / Prototipado Evolutivo)

---

##  Plan de Desarrollo y Metodología

El proyecto está estructurado en 5 iteraciones principales (Octubre 2026 - Julio 2027):

| Iteración / Fase | Descripción | Duración Estimada |
| :--- | :--- | :--- |
| **Fase 1: Inicio y Requerimientos** | Definición de alcance, levantamiento y especificación de requerimientos | 4 Semanas |
| **Iteración 1: Arquitectura y Catálogo** | Modelamiento BD, prototipado UI/UX e implementación de catálogo técnico | 7 Semanas |
| **Iteración 2: Carrito y Cotizaciones** | Lógica de filtrado, carrito de compras y cotizador PDF automático | 8 Semanas |
| **Iteración 3: Pasarela de Pagos y Pedidos** | Integración Webpay/Mercado Pago y módulo de seguimiento | 7 Semanas |
| **Iteración 4: Panel Admin e Inventario** | Dashboard de administración, control de stock y alertas | 7 Semanas |
| **Iteración 5: Pruebas y Despliegue** | Despliegue en producción, pruebas de aceptación y correcciones | 6 Semanas |

---

##  Instalación y Configuración Local

### Requisitos Previos
- **Node.js** v20 o superior.
- Servidor de base de datos **PostgreSQL**.
- Gestor de paquetes **npm**.

### Pasos para Ejecutar
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Kevin826-xd/proyecto-hidro.git
   cd proyecto-hidro
   ```

2. **Instalar dependencias:**
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

   El backend y el frontend tienen dependencias independientes. El backend está desarrollado en TypeScript y utiliza `tsx` para ejecutarse en desarrollo.

3. **Configurar variables de entorno (`.env`):**
   Crea el archivo `backend/.env` con la configuración del backend:
   ```env
   PORT=3000
   DATABASE_URL=postgres://usuario:password@localhost:5432/hidrocenter
   JWT_SECRET=tu_secreto_jwt
   ADMIN_EMAIL=admin@hidrocenter.cl
   ADMIN_PASSWORD=una_contraseña_segura
   ```

   Opcionalmente se pueden configurar el correo (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`), el despacho (`SHIPPING_PRICE_PER_KM`, `STORE_LAT`, `STORE_LNG`) y la vigencia de las cotizaciones (`QUOTE_VALIDITY_DAYS`).

4. **Base de datos:**
   No es necesario ejecutar las migraciones a mano: al iniciar, el backend aplica las migraciones pendientes y crea el administrador y los datos iniciales del catálogo.

5. **Compilar TypeScript (para producción):**
   ```bash
   cd backend
   npm run build
   ```

6. **Iniciar en entorno de desarrollo:**
   En una terminal inicia el backend:
   ```bash
   cd backend
   npm run dev
   ```

   En otra terminal inicia el frontend:
   ```bash
   cd frontend
   npm run dev
   ```

   El backend usa el puerto `3000` y el frontend el puerto `5173`. Configura el host de la API en `frontend/.env`.

### URL de la API del frontend

El frontend carga la URL del backend desde `frontend/.env`. Copia `frontend/.env.example` como `frontend/.env` y configura la URL de la API:

```env
VITE_API_URL=http://146.83.198.35:1638
```

Reinicia el servidor de desarrollo después de cambiar esta variable. En despliegues, configura `VITE_API_URL` con la URL pública de la API antes de compilar el frontend.

### API de Catálogo

Las consultas son públicas; crear, editar y eliminar requiere una sesión de administrador.

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/categories` | Lista las categorías |
| `POST` | `/api/categories` | Crea una categoría |
| `GET` | `/api/products` | Lista los productos |
| `GET` | `/api/products/:id` | Obtiene un producto |
| `POST` | `/api/products` | Crea un producto asociado a una categoría |
| `PUT` | `/api/products/:id` | Actualiza un producto |
| `PUT` | `/api/products/price-stock` | Actualiza el precio y el stock de varios productos a la vez |
| `DELETE` | `/api/products/:id` | Elimina un producto |

Ejemplo para crear una categoría:

```json
{
   "name": "Bombas de agua",
   "description": "Bombas y equipos de impulsión"
}
```

Ejemplo para crear un producto:

```json
{
   "name": "Bomba centrífuga 1 HP",
   "price": 149990,
   "stock": 8,
   "categoryId": "id-de-la-categoria",
   "diameter": "1 pulgada",
   "material": "Acero inoxidable",
   "workingPressure": "PN16"
}
```

Los datos se guardan en PostgreSQL.

### Registro y verificación de cuenta

Al registrarse, la persona recibe en su correo un código de 6 dígitos y lo ingresa en la tienda para activar su cuenta. No necesita la aprobación de un administrador.

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/users/register` | Crea la cuenta (pendiente) y envía el código al correo |
| `POST` | `/api/users/verify` | Recibe `email`, `password` y `code`; si son correctos activa la cuenta e inicia sesión |
| `POST` | `/api/users/resend-code` | Envía un código nuevo (como máximo uno por minuto) |
| `POST` | `/api/users/login` | Inicia sesión; si falta verificar responde `403` con `code: "EMAIL_NOT_VERIFIED"` |

- El código vence en 15 minutos y admite 5 intentos fallidos; después hay que pedir uno nuevo.
- En la base de datos solo se guarda un hash del código (HMAC con `JWT_SECRET`).
- Sin `SMTP_HOST` en `backend/.env`, el correo con el código se muestra en la consola del backend en vez de enviarse (útil en desarrollo).

### Cotizaciones

Al pedir una cotización se indica si es para una **persona** o una **empresa** (`customerType`: `person` o `company`). Una empresa debe ingresar su razón social y un RUT válido.

---

##  Licencia y Derechos

Este proyecto es desarrollado como **Proyecto de Titulación** para la carrera de **Ingeniería en Ejecución en Computación e Informática** de la **Universidad del Bío-Bío**, destinado al uso de la empresa **Servicios Hidroeléctricos Ñuble Ltda.**
