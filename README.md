<div align="center">

# 🚨 SISMOVZLA — Plataforma Táctica Comunitaria de Emergencia
**Nodo Civil Descentralizado para Mapeo de Daños, Triaje de Riesgos y Respuesta Ante Catástrofes Sísmicas**

[![Despliegue Oficial](https://img.shields.io/badge/Despliegue-Firebase_Hosting-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://sismovzla.web.app)
[![PWA Offline-First](https://img.shields.io/badge/Arquitectura-PWA_Resiliente-4CAF50?style=for-the-badge&logo=pwa&logoColor=white)](#-arquitectura-resiliente-offline-first)
[![Stack](https://img.shields.io/badge/Frontend-React_19_%2B_TypeScript-3178C6?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Estilos](https://img.shields.io/badge/UI-Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)


<br />
</div>

---

## 📖 Descripción General

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
- **Geolocalización Automática**: Captura de coordenadas GPS de alta precisión con un solo toque.
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
  - **Operador Táctico** (`RESISTENCIA_2026`): Verificación oficial de emergencias, resolución de incidentes, órdenes de despacho a agencias (*911, Bomberos, PC*) y **✏ edición directa de correcciones en Firestore**.
  - **Coordinador / Admin** (`SISMO_CRISIS_ADMIN`): Administración absoluta y purga de documentos.

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

Únete a nuestro nodo de coordinación en Telegram: [SismoVZLA Canal Oficial](https://t.me/+q9ScOcEulV9kY2Q5).

<br />

<div align="center">
  <p className="text-xs">Desplegado bajo licencia abierta MIT — Desarrollado por y para la sociedad civil venezolana.</p>
</div>
