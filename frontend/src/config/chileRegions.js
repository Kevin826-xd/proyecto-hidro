// Regiones de Chile de norte a sur, con sus comunas.
// center es la capital regional y se usa para mostrar la región en el mapa.
export const CHILE_REGIONS = [
  {
    name: "Arica y Parinacota",
    center: { lat: -18.4783, lng: -70.3126, zoom: 8 },
    cities: ["Arica", "Camarones", "General Lagos", "Putre"],
  },
  {
    name: "Tarapacá",
    center: { lat: -20.2133, lng: -70.1503, zoom: 8 },
    cities: ["Alto Hospicio", "Camiña", "Colchane", "Huara", "Iquique", "Pica", "Pozo Almonte"],
  },
  {
    name: "Antofagasta",
    center: { lat: -23.6509, lng: -70.3975, zoom: 7 },
    cities: ["Antofagasta", "Calama", "María Elena", "Mejillones", "Ollagüe", "San Pedro de Atacama", "Sierra Gorda", "Taltal", "Tocopilla"],
  },
  {
    name: "Atacama",
    center: { lat: -27.3668, lng: -70.3323, zoom: 7 },
    cities: ["Alto del Carmen", "Caldera", "Chañaral", "Copiapó", "Diego de Almagro", "Freirina", "Huasco", "Tierra Amarilla", "Vallenar"],
  },
  {
    name: "Coquimbo",
    center: { lat: -29.9027, lng: -71.2519, zoom: 8 },
    cities: [
      "Andacollo", "Canela", "Combarbalá", "Coquimbo", "Illapel", "La Higuera", "La Serena", "Los Vilos", "Monte Patria",
      "Ovalle", "Paiguano", "Punitaqui", "Río Hurtado", "Salamanca", "Vicuña",
    ],
  },
  {
    name: "Valparaíso",
    center: { lat: -33.0472, lng: -71.6127, zoom: 8 },
    cities: [
      "Algarrobo", "Cabildo", "Calle Larga", "Cartagena", "Casablanca", "Catemu", "Concón", "El Quisco", "El Tabo", "Hijuelas",
      "Isla de Pascua", "Juan Fernández", "La Calera", "La Cruz", "La Ligua", "Limache", "Llaillay", "Los Andes", "Nogales",
      "Olmué", "Panquehue", "Papudo", "Petorca", "Puchuncaví", "Putaendo", "Quillota", "Quilpué", "Quintero", "Rinconada",
      "San Antonio", "San Esteban", "San Felipe", "Santa María", "Santo Domingo", "Valparaíso", "Villa Alemana", "Viña del Mar",
      "Zapallar",
    ],
  },
  {
    name: "Metropolitana de Santiago",
    center: { lat: -33.4489, lng: -70.6693, zoom: 9 },
    cities: [
      "Alhué", "Buin", "Calera de Tango", "Cerrillos", "Cerro Navia", "Colina", "Conchalí", "Curacaví", "El Bosque", "El Monte",
      "Estación Central", "Huechuraba", "Independencia", "Isla de Maipo", "La Cisterna", "La Florida", "La Granja", "La Pintana",
      "La Reina", "Lampa", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "María Pinto", "Melipilla",
      "Ñuñoa", "Padre Hurtado", "Paine", "Pedro Aguirre Cerda", "Peñaflor", "Peñalolén", "Pirque", "Providencia", "Pudahuel",
      "Puente Alto", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Bernardo", "San Joaquín", "San José de Maipo",
      "San Miguel", "San Pedro", "San Ramón", "Santiago", "Talagante", "Tiltil", "Vitacura",
    ],
  },
  {
    name: "Libertador General Bernardo O'Higgins",
    center: { lat: -34.1708, lng: -70.7444, zoom: 8 },
    cities: [
      "Chépica", "Chimbarongo", "Codegua", "Coinco", "Coltauco", "Doñihue", "Graneros", "La Estrella", "Las Cabras", "Litueche",
      "Lolol", "Machalí", "Malloa", "Marchigüe", "Mostazal", "Nancagua", "Navidad", "Olivar", "Palmilla", "Paredones", "Peralillo",
      "Peumo", "Pichidegua", "Pichilemu", "Placilla", "Pumanque", "Quinta de Tilcoco", "Rancagua", "Rengo", "Requínoa",
      "San Fernando", "San Vicente", "Santa Cruz",
    ],
  },
  {
    name: "Maule",
    center: { lat: -35.4264, lng: -71.6554, zoom: 8 },
    cities: [
      "Cauquenes", "Chanco", "Colbún", "Constitución", "Curepto", "Curicó", "Empedrado", "Hualañé", "Licantén", "Linares",
      "Longaví", "Maule", "Molina", "Parral", "Pelarco", "Pelluhue", "Pencahue", "Rauco", "Retiro", "Río Claro", "Romeral",
      "Sagrada Familia", "San Clemente", "San Javier", "San Rafael", "Talca", "Teno", "Vichuquén", "Villa Alegre", "Yerbas Buenas",
    ],
  },
  {
    name: "Ñuble",
    center: { lat: -36.6066, lng: -72.1034, zoom: 9 },
    cities: [
      "Bulnes", "Chillán", "Chillán Viejo", "Cobquecura", "Coelemu", "Coihueco", "El Carmen", "Ninhue", "Ñiquén", "Pemuco",
      "Pinto", "Portezuelo", "Quillón", "Quirihue", "Ránquil", "San Carlos", "San Fabián", "San Ignacio", "San Nicolás",
      "Treguaco", "Yungay",
    ],
  },
  {
    name: "Biobío",
    center: { lat: -36.827, lng: -73.0503, zoom: 8 },
    cities: [
      "Alto Biobío", "Antuco", "Arauco", "Cabrero", "Cañete", "Chiguayante", "Concepción", "Contulmo", "Coronel", "Curanilahue",
      "Florida", "Hualpén", "Hualqui", "Laja", "Lebu", "Los Álamos", "Los Ángeles", "Lota", "Mulchén", "Nacimiento", "Negrete",
      "Penco", "Quilaco", "Quilleco", "San Pedro de la Paz", "San Rosendo", "Santa Bárbara", "Santa Juana", "Talcahuano",
      "Tirúa", "Tomé", "Tucapel", "Yumbel",
    ],
  },
  {
    name: "La Araucanía",
    center: { lat: -38.7359, lng: -72.5904, zoom: 8 },
    cities: [
      "Angol", "Carahue", "Cholchol", "Collipulli", "Cunco", "Curacautín", "Curarrehue", "Ercilla", "Freire", "Galvarino",
      "Gorbea", "Lautaro", "Loncoche", "Lonquimay", "Los Sauces", "Lumaco", "Melipeuco", "Nueva Imperial", "Padre Las Casas",
      "Perquenco", "Pitrufquén", "Pucón", "Purén", "Renaico", "Saavedra", "Temuco", "Teodoro Schmidt", "Toltén", "Traiguén",
      "Victoria", "Vilcún", "Villarrica",
    ],
  },
  {
    name: "Los Ríos",
    center: { lat: -39.8142, lng: -73.2459, zoom: 8 },
    cities: ["Corral", "Futrono", "La Unión", "Lago Ranco", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "Río Bueno", "Valdivia"],
  },
  {
    name: "Los Lagos",
    center: { lat: -41.4693, lng: -72.9424, zoom: 7 },
    cities: [
      "Ancud", "Calbuco", "Castro", "Chaitén", "Chonchi", "Cochamó", "Curaco de Vélez", "Dalcahue", "Fresia", "Frutillar",
      "Futaleufú", "Hualaihué", "Llanquihue", "Los Muermos", "Maullín", "Osorno", "Palena", "Puerto Montt", "Puerto Octay",
      "Puerto Varas", "Puqueldón", "Purranque", "Puyehue", "Queilén", "Quellón", "Quemchi", "Quinchao", "Río Negro",
      "San Juan de la Costa", "San Pablo",
    ],
  },
  {
    name: "Aysén del General Carlos Ibáñez del Campo",
    center: { lat: -45.5712, lng: -72.0685, zoom: 7 },
    cities: ["Aysén", "Chile Chico", "Cisnes", "Cochrane", "Coyhaique", "Guaitecas", "Lago Verde", "O'Higgins", "Río Ibáñez", "Tortel"],
  },
  {
    name: "Magallanes y de la Antártica Chilena",
    center: { lat: -53.1638, lng: -70.9171, zoom: 7 },
    cities: ["Antártica", "Cabo de Hornos", "Laguna Blanca", "Natales", "Porvenir", "Primavera", "Punta Arenas", "Río Verde", "San Gregorio", "Timaukel", "Torres del Paine"],
  },
];

export function getCitiesByRegion(regionName) {
  return CHILE_REGIONS.find((region) => region.name === regionName)?.cities ?? [];
}

export function getRegionCenter(regionName) {
  return CHILE_REGIONS.find((region) => region.name === regionName)?.center ?? null;
}

export function findRegionByCity(cityName) {
  const city = cityName?.trim().toLowerCase();
  return city ? CHILE_REGIONS.find((region) => region.cities.some((item) => item.toLowerCase() === city))?.name ?? "" : "";
}
