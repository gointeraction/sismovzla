<div align="center">

# 🚨 SISMOVZLA — Plataforma Táctica Comunitaria de Emergencia
**Nodo Civil Descentralizado para Mapeo de Daños, Triaje de Riesgos y Respuesta Ante Catástrofes Sísmicas**

[![Plataforma Oficial](https://img.shields.io/badge/Plataforma-AyudaSismoVZLA.web.app-FF9800?style=for-the-badge&logo=firebase&logoColor=black)](https://ayudasismovzla.web.app)
[![PWA Offline-First](https://img.shields.io/badge/Arquitectura-PWA_Resiliente-4CAF50?style=for-the-badge&logo=pwa&logoColor=white)](#-arquitectura-resiliente-offline-first)
[![Stack](https://img.shields.io/badge/Frontend-React_19_%2B_TypeScript-3178C6?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Estilos](https://img.shields.io/badge/UI-Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)


<br />
</div>

---

## 📖 Descripción General

**🌐 URL Oficial de la Plataforma:** [https://ayudasismovzla.web.app/](https://ayudasismovzla.web.app/)

**SismoVZLA** es una Aplicación Web Progresiva (**PWA**) de código abierto diseñada para operar como una red de contingencia humanitaria en Venezuela tras eventos sísmicos de gran escala. 

Cuando ocurren terremotos severos, las infraestructuras de telecomunicaciones colapsan o se degradan dramáticamente (operando en velocidades mínimas 2G/EDGE). SismoVZLA resuelve este problema mediante una arquitectura **Offline-First** que permite a los ciudadanos guardar reportes, consultar manuales de auxilio y buscar familiares **completamente sin internet**, almacenando los datos en el disco local y sincronizándose con la nube tan pronto se recupera cualquier rastro de señal móvil.

---

## ✨ Características Críticas de la Plataforma

### 1. 🗺️ Mapa Táctico Georeferenciado en Tiempo Real
- **Visualización de Crisis**: Marcadores de colores por gravedad del incidente (**Gravedad 1 a 5**).
- **Estabilidad Táctica**: Implementación optimizada sobre Leaflet con control de estado en memoria (`useRef`). Al recibir actualizaciones masivas desde Firestore, **el mapa no salta ni recentra la cámara**, manteniendo la navegación del operador intacta.
- **Ventanas Emergentes Persistentes**: Los globos informativos (*Popups*) permanecen abiertos continuamente, cerrándose únicamente cuando el operador decide seleccionar otro punto del mapa.
- **Filtros Regionales**: Segmentación operativa instantánea por estados (*Caracas, La Guaira, Aragua, Carabobo, Otros*).

### 2. 📡 Arquitectura Resiliente (Offline-First)
- **Persistencia en Disco**: Toda la base de datos ciudadana se almacena localmente en el terminal del usuario mediante **IndexedDB**.
- **Cola de Transmisión Asincrónica**: Si el usuario envía una alerta sin internet, la solicitud se guarda en la cola local y un interceptor en segundo plano reintenta la retransmisión automática al detectar red.
- **Optimización de Ancho de Banda**: Transmisión ultraliviana compatible con redes 2G degradadas.

### 3. 🆘 Reporte Ciudadano Multimodal
- **Geolocalización Flexible**: Captura de coordenadas GPS satelitales mediante botón automático opcional o ingreso manual directo de Latitud/Longitud.
- **Direcciones o Referencias Manuales Exactas**: Campo dedicado para describir ubicaciones textuales precisas (*Ej: Av. Principal, Edificio Santa Ana, Piso 3*), modificable posteriormente por operadores tácticos.
- **Notas de Voz Comprimidas**: Codificación de mensajes de auxilio en formato **OPUS base64** (~4KB por nota), evitando enviar archivos de audio pesados.
- **Evidencia Visual y Lightbox**: Registro fotográfico comprimido con un visor ampliado (*ImageLightbox*) accesible desde reportes y bitácoras operativas.

### 4. 🔎 Búsqueda de Personas y Desaparecidos
- Directorio comunitario de ciudadanos buscados, localizados o hospitalizados.
- Indexación simplificada mediante fonética en minúsculas (*Slug*) para búsquedas instantáneas en bases de datos locales con miles de registros.

### 5. 🩸 Red Sanitaria de Voluntarios Donantes de Sangre
- **Inscripción y Triaje Clínico**: Formulario ciudadano para indicar grupo sanguíneo (`O+`, `A-`, `AB+`, etc.) y responder 4 criterios de calificación previa de la OMS (*Edad 18-65, Peso >50kg, >3 meses de última donación, buen estado clínico*).
- **Remisión Hospitalaria Directa**: Operadores autorizados pueden derivar donantes aptos hacia hospitales habilitados (*Ej: Hospital Domingo Luciani, HUC, Hospital Central de Maracay*), emitiendo instrucciones de traslado en vivo.

### 6. 🏢 Monitoreo de Refugios & Centros de Acopio
- Semáforo de capacidad en tiempo real: 🟢 **Verde** (*Disponible*), 🟡 **Amarillo** (*Casi lleno*), 🔴 **Rojo** (*Colapsado*).
- Tablero de requerimientos críticos (*Suministros médicos solicitados vs. servicios ofrecidos*).

### 7. 🛡️ Matriz de Control de Seguridad por Roles
- Acreditación local mediante tokens de terminal en la pestaña `[ADM] COORDINADOR`:
  - **Voluntario Ciudadano** (`VOLUNTARIO_VZLA`): Lectura general y envío de reportes.
  - **Operador Táctico** (`TACTICO_2026`): Verificación oficial de emergencias, resolución de incidentes, órdenes de despacho a agencias (*911, Bomberos, PC*) y **✏ edición directa de correcciones en Firestore**.
  - **Coordinador / Admin** (`SISMO_CRISIS_ADMIN`): Administración absoluta y purga de documentos.

### 8. 🏛️ Evaluación Estructural Post-Sismo (COVENIN 1756 / ATC-20)
- **Dictamen Técnico de Habitabilidad**: Formulario clínico opcional para clasificar edificaciones tras sismos severos (🟢 **Verde - Habitable**, 🟡 **Amarillo - Restringido**, 🔴 **Rojo - No Habitable**).
- **Inspección Exhaustiva A-F**: Registro estandarizado de daños en columnas, vigas, losas, derivas globales, riesgos geotécnicos e instalaciones tecnológicas según normas COVENIN 1756, ATC-20 y FEMA 154 adaptadas para Venezuela.
- **Acciones Inmediatas y CIV**: Identificación de acciones críticas en escena (*Ej: acordonamiento de perímetro, apuntalamiento de urgencia, corte de servicios*) y acreditación oficial por número CIV / INCES del evaluador.
- **Usabilidad y Navegación en Cuadrícula (*Grid 4 Pasos*)**: Flujo guiado paso a paso (*Edificio ➔ Daños A-C ➔ Riesgos D-F ➔ Dictamen*) con selectores proporcionales diseñados para pantallas táctiles en tierra.
- **Adjuntar o Editar a Posteriori**: Comisión técnica u operadores (`TACTICO_2026`) pueden incorporar por primera vez o corregir el informe estructural sobre reportes ya existentes mediante el modal **`✏ EDITAR`**, sincronizando el semáforo de habitabilidad en vivo hacia el mapa georeferenciado.

### 9. 🏥 Base de Datos de Personas en Centros Asistenciales (OCR Masivo + Doble Chequeo)
- **Directorio Georeferenciado Oficial**: Integración exacta de los **9 centros asistenciales prioritarios de Caracas y La Guaira** (*Hospital Domingo Luciani, HUC, Cruz Roja Carlos J. Bello, Miguel Pérez Carreño, Periférico de Catia, Periférico de Pariata, Vargas de La Guaira, Militar Carlos Arvelo, Los Magallanes de Catia*). Al seleccionar un hospital en los formularios clínicos, el sistema muestra en tiempo real su dirección completa y coordenadas GPS exactas con botón de copia rápida.
- **Carga Masiva por Foto / OCR (*IA Vision*)**: Digitalización instantánea de listados de papel pegados en puertas de hospitales, interpretando automáticamente Nombre Completo, Cédula y Edad.
- **Deduplicación & Regla de Doble Chequeo**: Verificación en tiempo real contra la base nacional en Firestore. Si la cédula coincide con un paciente censado en otro hospital diferente, **crea automáticamente un segundo registro intermitente en color rojo** (`⚠️ DOBLE CHEQUEO REQUERIDO`) para que comisiones de rescate verifiquen físicamente la ubicación real del ciudadano.
- **Censo Nacional & Mapas GPS**: Buscador público interactivo y pestaña dedicada `📍 Directorio & Coordenadas` con enlaces de navegación directa en Google Maps.

### 10. 🎨 Usabilidad y Rediseño Ergonómico UX/UI (`Pills Navbar`)
- **Carrusel Compacto de Píldoras Flotantes**: Reemplazo total de la antigua barra de navegación desbordada por un menú tipo *Pills* de alta ergonomía visual (`[01] MAPA`, `[02] REPORTE`, `[03] PERSONAS`, `[04] AUXILIOS`, `[05] REFUGIOS`, `[06] SANGRE`, `[07] HOSPITALES`, `[08] REPORTES`, `[ADM] COORDINADOR`).
- **Codificación Cromática Diferenciada**: Asignación de colores tácticos únicos por módulo que resplandecen al activarse (`drop-shadow`), eliminando el cansancio visual y previniendo errores de selección en pantallas pequeñas o celulares bajo condiciones de estrés.
- **Desplazamiento Horizontal Suave**: Integración nativa `scroll-smooth` sin barra de desplazamiento visible, garantizando acceso instantáneo a todas las opciones del sistema en cualquier resolución.

### 11. 📄 Consola Maestro de Bitácoras & Exportación Gubernamental PDF (A4)
- **Centro Auditor Unificado (`[08] REPORTES`)**: Componente ejecutivo con métricas instantáneas y selectores ergonómicos (*envoltura `flex-wrap` sin emojis repetidos*) para 6 tipos de reportes oficiales de respuesta ante catástrofes:
  1. `Boletín Táctico de Daños e Incidentes` (Filtrable por región y gravedad).
  2. `Dictámenes Estructurales COVENIN 1756` (Certificados individuales completos A4).
  3. `Censo Clínico Asistencial de Heridos` (Resaltando alertas rojas de traslados cruzados).
  4. `Manifiesto Quirúrgico de Banco de Sangre` (Donantes calificados OMS).
  5. `Balance Logístico de Refugios & Acopio` (Capacidades e insumos críticos).
  6. **`Suite Ejecutiva de 6 Reportes Globales de Daños`**: Consolidado gubernamental bajo estándares de la ONU (OCHA) y Protección Civil Internacional:
     - **Densidad Regional por Estado**: % de colapsos e Índice de Respuesta Técnica CIV.
     - **Manifiesto GPS de Objetivos SAR / USAR**: Coordenadas satelitales en gran formato tipográfico para pilotos de helicóptero y brigadas K9.
     - **Catálogo Municipal de Inmuebles Etiquetados**: Registro oficial COVENIN (Rojo, Amarillo, Verde).
     - **Matriz Frecuencial de Patologías Estructurales CIV**: Estudio sismológico de fallas constructivas A-F.
     - **Alerta Táctica de Redes Vitales & Riesgos Secundarios**: Despacho para CORPOELEC, PDVSA Gas e Hidros.
     - **Boletín Internacional SITREP**: Informe de situación humanitaria oficial multilateral.
- **Generación PDF Certificada (Estrategia *Zero-Bloat*)**: Emplea el motor de renderizado nativo del sistema operativo (`window.print()`) con hojas de estilo `@media print` de alta definición geométrica, evitando añadir megabytes al paquete de la PWA y asegurando descargas instantáneas en conexiones degradadas 2G.
- **Dictamen Estructural Autógrafo A4**: Imprime el certificado individual de habitabilidad con membrete oficial del Colegio de Ingenieros de Venezuela (CIV), desglose de patologías A-F, acciones inmediatas ordenadas y recuadros de firma autógrafa y sello profesional.

### 12. 🔌 API REST de Integración (Backend Node.js)
- **Endpoints Completos (Lectura/Escritura)**: Disponibilidad de métodos `GET` (Listado y consulta por `:id`), `POST` (Creación) y `PUT` (Actualización) para integrar e ingestar datos masivos desde otros sistemas de emergencia o reportes externos.
- **Entidades Expuestas Oficialmente**:
  - `/api/v1/incidents`: Reportes y estado de incidentes.
  - `/api/v1/shelters`: Nivel de ocupación y registro de refugios.
  - `/api/v1/people`: Personas buscadas y localizadas.
  - `/api/v1/patients`: Ingreso y triaje de pacientes en hospitales.
  - `/api/v1/donors`: Censo nacional de donantes de sangre.
  - `/api/v1/evaluations`: Evaluaciones técnicas estructurales (COVENIN 1756).
- **Seguridad Táctica**: Las peticiones pueden ser protegidas mediante Middleware con un `API_KEY` (Header: `x-api-key`) para asegurar que solo agencias autorizadas inyecten o modifiquen la base de datos de crisis.
- **Puesta en marcha**: Se incluye un servidor Express nativo que se enlaza al entorno de Firebase. Puede iniciarse con `npm run api`.

---

## 🏗️ Stack Tecnológico

* **Núcleo**: [React 19](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
* **Empaquetador**: [Vite 6](https://vitejs.dev/) (Build PWA optimizado)
* **Diseño e Iconos**: [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/)
* **Mapas**: [Leaflet](https://leafletjs.com/)
* **Backend & Base de Datos**: [Firebase Firestore Realtime](https://firebase.google.com/docs/firestore) + [Firebase Hosting](https://firebase.google.com/docs/hosting)
* **PWA Engine**: Interceptores nativos `serviceWorker` + `localStorage` + `IndexedDB`

---

## 🚀 Instalación y Desarrollo Local

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/gointeraction/sismovzla.git
   cd sismovzla
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Crea un archivo `.env` basado en `.env.example` con tus credenciales de proyecto Firebase:
   ```env
   VITE_FIREBASE_API_KEY="tu-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="sismovzla.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="sismovzla"
   VITE_FIREBASE_STORAGE_BUCKET="sismovzla.firebasestorage.app"
   VITE_FIREBASE_MESSAGING_SENDER_ID="tu-sender-id"
   VITE_FIREBASE_APP_ID="tu-app-id"
   ```

4. **Ejecutar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

5. **Generar compilación de producción**:
   ```bash
   npm run build
   ```

---

## 🤝 Contribuciones y Coordinación Civil

Las contribuciones ciudadanas para optimizar el rendimiento en redes degradadas, traducir manuales de supervivencia o ampliar el directorio hospitalario son bienvenidas. 


<br />

<div align="center">
  <p className="text-xs">Desplegado bajo licencia abierta MIT — Desarrollado por y para la sociedad civil venezolana.</p>
</div>
