# Plataforma Web E-commerce y Gestión Comercial para la Venta de Materiales e Insumos Hidráulicos

> **Proyecto de Titulación** — Ingeniería en Ejecución en Computación e Informática  
> **Universidad del Bío-Bío** | Facultad de Ciencias Empresariales | Departamento de Sistemas de Información  
> **Cliente / Empresa:** Servicios Hidroeléctricos Ñuble Ltda.  
> **Autor:** Kevin Aldair Estuardo Anabalón  

---

## 📋 Descripción del Proyecto

Este sistema web e-commerce a medida está diseñado específicamente para responder a las necesidades técnicas y comerciales de **Servicios Hidroeléctricos Ñuble Ltda.**, pyme orientada a la provisión, asesoría y venta de materiales, repuestos y equipos hidráulicos (tuberías, bombas de agua, conexiones, válvulas y sistemas de riego/abastecimiento).

La plataforma resuelve la limitación geográfica, la dependencia de atención telefónica/presencial y la falta de un canal digital formal con filtros por especificaciones hidráulicas avanzadas (medidas en pulgadas/mm, presión de trabajo PN/SDR) e integración de pasarelas de pago digitales en Chile.

---

## ✨ Características Principales

### 🛒 Módulo Comercial y de Cliente
- **Catálogo Técnico Interactivo:** Filtros especializados por diámetro, presión de trabajo (PN/SDR), material y tipo de insumo hídrico.
- **Cotizador Automático:** Generación instantánea de cotizaciones corporativas formalizadas en formato **PDF**.
- **Carrito de Compras y Checkout:** Gestión ágil de compras con integración a pasarelas de pago electrónicas (**Webpay Plus / Mercado Pago**).
- **Seguimiento de Pedidos y Perfil:** Espacio para que los clientes consulten el estado de sus pedidos e historial de cotizaciones.

### ⚙️ Módulo de Administración e Inventario
- **Dashboard Administrativo:** Panel de control con métricas clave de ventas y gestión comercial.
- **Gestión de Stock y Alertado:** Control de inventario en tiempo real con alertas de stock crítico de insumos hidráulicos.
- **Gestión de Pedidos:** Módulo centralizado para el cambio de estados, despacho y emisión de documentos de compra.

---

## 🛠️ Arquitectura y Tecnologías

El proyecto sigue una arquitectura web modular (**Full-Stack**) con separación clara entre catálogo, carrito, pasarelas de pago y administración:

- **Frontend:** HTML5, CSS3, TypeScript / Framework Moderno UI/UX
- **Backend:** Node.js / Python / Java (API RESTful)
- **Base de Datos:** Base de Datos Relacional (PostgreSQL / MySQL)
- **Pasarela de Pagos:** Webpay / Mercado Pago API
- **Generación de Reportes:** Generación dinámica de PDF (Cotizaciones)
- **Metodología de Desarrollo:** Ágil (Scrum / Prototipado Evolutivo)

---

## 📅 Plan de Desarrollo y Metodología

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

## 🚀 Instalación y Configuración Local

### Requisitos Previos
- **Node.js** v18+ o entorno de ejecución correspondiente.
- Servidor de base de datos **PostgreSQL / MySQL**.
- Gestor de paquetes **npm** / **yarn**.

### Pasos para Ejecutar
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/ecommerce-hidroelectricasnuble.git
   cd ecommerce-hidroelectricasnuble
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno (`.env`):**
   Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:
   ```env
   PORT=3000
   DATABASE_URL=postgres://usuario:password@localhost:5432/hidrolectrica_db
   WEBPAY_COMMERCE_CODE=tu_codigo_comercio
   WEBPAY_API_KEY=tu_api_key
   JWT_SECRET=tu_secreto_jwt
   ```

4. **Ejecutar migraciones de la Base de Datos:**
   ```bash
   npm run db:migrate
   ```

5. **Iniciar en entorno de desarrollo:**
   ```bash
   npm run dev
   ```

---

## 📄 Licencia y Derechos

Este proyecto es desarrollado como **Proyecto de Titulación** para la carrera de **Ingeniería en Ejecución en Computación e Informática** de la **Universidad del Bío-Bío**, destinado al uso de la empresa **Servicios Hidroeléctricos Ñuble Ltda.**# proyecto-hidro
