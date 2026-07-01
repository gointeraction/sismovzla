# SismoVZLA — Manual de Usuario v3.2

## Índice

1. [Acceso al Sistema](#1-acceso-al-sistema)
2. [Estructura de la Plataforma](#2-estructura-de-la-plataforma)
3. [Módulos de Coordinación (01-09)](#3-módulos-de-coordinación)
4. [Módulos de Apoyo Táctico (10-17)](#4-módulos-de-apoyo-táctico)
5. [Módulos de Logística (18-23)](#5-módulos-de-logística)
6. [Módulos de Apoyo Ciudadano (24-35)](#6-módulos-de-apoyo-ciudadano)
7. [Exportación de Datos](#7-exportación-de-datos)
8. [Gestión de Reportes](#8-gestión-de-reportes)
9. [Roles y Permisos](#9-roles-y-permisos)
10. [Sistema Offline](#10-sistema-offline)
11. [Solución de Problemas](#11-solución-de-problemas)

---

## 1. Acceso al Sistema

### URLs Oficiales
- **Primaria**: https://ayudasismovzla.web.app
- **Espejo**: https://sismovzla.web.app

### Requisitos del Navegador
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- JavaScript habilitado
- Conexión a internet (funciona offline después de primera carga)

### Inicio de Sesión
1. Abra el navegador en la URL indicada
2. El sistema carga automáticamente en modo **Público** (Reporte Ciudadano)
3. Para acceder a módulos tácticos, use el selector de roles en la barra superior
4. Seleccione su rol asignado para desbloquear los módulos correspondientes

---

## 2. Estructura de la Plataforma

### Capas de la Arquitectura

| Capa | Módulos | Descripción |
|------|---------|-------------|
| **Coordinación** | 01-09 | Centro de control, mapas, reportes, logística central |
| **Apoyo Táctico** | 10-17 | Búsqueda-rescate, triaje, cascadas, evacuación |
| **Logística** | 18-23 | Suministros, agua, fallecidos, psicosocial, comunicaciones |
| **Apoyo Ciudadano** | 24-35 | Reportes, búsqueda personas, refugios, donaciones, protección |

### Navegación
- Use la **barra lateral izquierda** para seleccionar módulos
- Los módulos se organizan por pestañas colapsables por capa
- El botón **🏠** retorna al Dashboard Principal (Módulo 01)
- Cada módulo tiene su propio menú interno con sub-secciones

---

## 3. Módulos de Coordinación

### Módulo 01 — Centro de Operaciones (EOC)
**Función**: Panel central de monitoreo y control de la emergencia.

**Acciones disponibles**:
- **Acusar recibo** de incidentes nuevos
- **Resolver** incidentes confirmados
- **Asignar sectores** de búsqueda y rescue
- Visualizar métricas en tiempo real (incidentes activos, víctimas, refugios)

**Uso**:
1. Revise la lista de incidentes pendientes
2. Haga clic en ✓ para acusar recibo
3. Haga clic en ✓✓ para marcar como resuelto
4. Asigne sectores SAR a equipos de rescate

### Módulo 02 — Mapa de Incidentes
**Función**: Visualización geoespacial de todos los reportes.

**Características**:
- Mapa interactivo con Leaflet
- Marcadores coloreados por severidad
- Filtros por estado, tipo y fecha
- Popups con detalles del incidente

### Módulo 03 — Reporte Ciudadano
**Función**: Formulario público para reportar emergencias.

**Campos obligatorios**:
- Tipo de emergencia (terremoto, incendio, inundación, etc.)
- Severidad (1-5)
- Descripción
- Ubicación (automática o manual)

**Campos opcionales**:
- Audio narrativo (máx. 80KB)
- Coordenadas exactas

### Módulo 04 — Búsqueda de Personas
**Función**: Directorio de personas reportadas como desaparecidas o localizadas.

**Estados**:
- `Buscado` — Persona desaparecida
- `Localizado` — Persona encontrada
- `Hospitalizado` — Persona en centro médico

### Módulo 05 — Directorio de Refugios
**Función**: Gestión de albergues temporales.

**Indicadores visuales**:
- 🟢 Verde: Capacidad disponible
- 🟡 Amarillo: Capacidad casi llena
- 🔴 Rojo: Capacidad completa

### Módulo 06 — Mapa Táctico de Refugios
**Función**: Vista geoespacial de refugios con ocupación en tiempo real.

### Módulo 07 — Banco de Sangre
**Función**: Registro de donantes y solicitud de sangre.

**Estados del donante**:
- `Registrado` → `Calificado` → `Remitido` → `Donación Completada`

### Módulo 08 — Registro Hospitalario
**Función**: Seguimiento de pacientes en centros hospitalarios.

### Módulo 09 — Consola de Reportes
**Función**: Generación de 43 reportes PDF especializados.

**Categorías de reportes**:
- Incidentes por estado, tipo, severidad
- Refugios por capacidad y ubicación
- Logística de suministros
- Voluntarios y donaciones
- Estadísticas generales

---

## 4. Módulos de Apoyo Táctico

### Módulo 10 — Triaje de Víctimas
**Función**: Clasificación de víctimas por estado médico.

**Códigos START**:
- **Negro**: Fallecido / Sin signos vitales
- **Rojo**: Crítico (frecuencia respiratoria >30 o <10, o no ambulatorio)
- **Amarillo`: Moderado (no clasificable en otros)
- **Verde**: Leve (consciente, respirando, ambulatorio)

**Modo Masivo**:
1. Haga clic en "Modo Masivo"
2. Ingrese número de víctimas
3. El sistema crea registros automáticos: "Víctima 1", "Víctima 2", etc.
4. Edite cada víctima con detalles específicos

### Módulo 11 — Cascada de Desastres
**Función**: Timeline de eventos en cadena.

**Tipos de evento**:
Réplica, Incendio, Fuga de Gas, Deslizamiento, Inundación, Tsunami, Colapso Estructural, Explosión, Derrame Químico, Ruptura de Presa, Licuefacción

### Módulo 12 — Coordinación USAR
**Función**: Gestión de equipos de búsqueda y rescate urbano.

**Sectores**:
- Cada sector tiene coordenadas, prioridad y estado
- Estados: No Iniciado → En Progreso → Completado → Verificado

### Módulo 13 — Vías y Rutas de Evacuación
**Función**: Monitoreo de vías de acceso y rutas de evacuación.

**Estados de vía**:
- `Despejada` — Sin obstrucciones
- `Parcial` — Parcialmente bloqueada
- `Bloqueada` — No transitable
- `Evaluando` — En proceso de evaluación

### Módulo 14 — Mapa de Recursos
**Función**: Ubicación de recursos disponibles (hospitales, centros de acopio, etc.).

### Módulo 15 — Vivienda Temporal
**Función**: Gestión de refugios temporales post-desastre.

### Módulo 16 — Educación y Escuelas
**Función**: Reporte de daños en instituciones educativas.

### Módulo 17 — Operaciones Aéreas
**Función**: Coordinación de drones y helicópteros.

**Tipos de misión**:
Evaluación de Daños, Búsqueda, Entrega de Suministros, Evacuación Aeromédica, Reconocimiento, Mapeo Térmico

---

## 5. Módulos de Logística

### Módulo 18 — Logística de Suministros
**Función**: Gestión de inventario y solicitudes de suministros.

**Categorías**:
Agua, Alimentos, Medicamentos, Carpas, Mantas/Ropa, Higiene, Herramientas, Combustible, Comunicaciones, Otro

**Proceso de entrega**:
1. Seleccione una solicitud pendiente
2. Revise los items solicitados
3. Haga clic en "Entregar"
4. El sistema descuenta automáticamente del inventario

### Módulo 19 — Agua y Saneamiento
**Función**: Monitoreo de puntos de agua y servicios sanitarios.

**Estados de agua**:
- `Potable` — Apta para consumo
- `No Potable` — No apta
- `En Prueba` — Siendo evaluada
- `Agotado` — Sin suministro

### Módulo 20 — Gestión de Fallecidos
**Función**: Registro y seguimiento de personas fallecidas.

**Estados**:
Recuperado → En Morgue → Identificado → Entregado a Familiares → Sepultado

**Acciones**:
- `Enviar a Morgue` — Cambia estado a "En Morgue"
- `Identificar` — Registra nombre y cédula
- `Entregar a Familiares` — Registra entrega
- `Sepultar` — Registra sepultura

### Módulo 21 — Apoyo Psicosocial
**Función**: Gestión de casos de crisis emocional.

**Tipos de crisis**:
Pérdida Familiar, Pérdida de Vivienda, Estrés Agudo, Crisis de Pánico, Menor No Acompañado, Violencia, Intento Suicida, Otro

**Acciones**:
- `Abrir caso` — Registra nuevo caso
- `Seguimiento` — Registra evolución
- `Cerrar caso` — Cierra caso atendido
- `Derivar` — Envía a otro profesional

### Módulo 22 — Comunicaciones de Emergencia
**Función**: Gestión de canales de comunicación.

**Tipos**:
Radioaficionado, Repetidora, Frecuencia VHF, Frecuencia UHF, HF, Satélite, Mesh WiFi, Punto de Mensajería

### Módulo 23 — Coordinación Interagencial
**Función**: Tareas compartidas entre agencias gubernamentales.

---

## 6. Módulos de Apoyo Ciudadano

### Módulo 24 — Voluntarios y Donaciones
**Función**: Registro de voluntarios y donaciones recibidas.

### Módulo 25 — Turnos de Voluntarios
**Función**: Asignación y seguimiento de turnos.

**Selector automático**: Seleccione un voluntario del registro existente.

### Módulo 26 — Reunificación Familiar
**Función**: Búsqueda de familiares desaparecidos.

**Búsqueda cruzada**: El sistema busca automáticamente en el directorio de personas (`people_search`) y muestra coincidencias.

**Acciones**:
- `Marcar Contactado` — Familia ha sido notificada
- `Marcar Reunificado` — Familia reunificada

### Módulo 27 — Protección de la Infancia
**Función**: Casos de menores no acompañados o en riesgo.

**Restricción**: Requiere autenticación para crear casos.

### Módulo 28 — Asistencia Legal
**Función**: Solicitudes de apoyo documental.

**Restricción**: Requiere autenticación para crear solicitudes.

### Módulo 29 — Centro de Prensa
**Función**: Comunicados oficiales y notas de prensa.

### Módulo 30 — Capacitación y Simulacros
**Función**: Registro de entrenamientos y simulacros de emergencia.

### Módulo 31 — Lecciones Aprendidas
**Función**: Documentación de mejoras post-incidente.

### Módulo 32 — Combustible y Energía
**Función**: Monitoreo de estaciones de combustible y fuentes de energía.

### Módulo 33 — Alertas Meteorológicas
**Función**: Creación manual de alertas climáticas.

**Note**: Este módulo no se conecta a APIs externas. Las alertas son creadas manualmente por los operadores.

### Módulo 34 — Alertas Públicas
**Función**: Notificaciones a la población civil.

### Módulo 35 — Reportes (Consola Maestra)
**Función**: Generación de 43 reportes PDF organizados por categoría.

---

## 7. Exportación de Datos

### Exportar PDF
1. Navegue al módulo deseado
2. Haga clic en el botón **📄 PDF**
3. Seleccione el tipo de reporte
4. Se genera automáticamente un PDF con:
   - Encabezado institucional
   - Fecha y hora de generación
   - Tabla de datos formateada
   - Firmas autorizadas
   - Disclaimer legal

### Exportar CSV
1. Navegue al módulo de Logística o Recursos
2. Haga clic en el botón **📊 CSV**
3. Se descarga un archivo `.csv` con los datos

---

## 8. Gestión de Reportes

### Consola de Reportes (Módulo 09)
La Consola de Reportes organiza 43 reportes en categorías:

| Categoría | Reportes |
|-----------|----------|
| Incidentes | Por estado, tipo, severidad, ubicación, fecha |
| Refugios | Por capacidad, ocupación, ubicación, estado |
| Logística | Inventario, solicitudes, entregas, pendientes |
| Voluntarios | Registro, turnos, donaciones |
| Salud | Pacientes, sangre, psicosocial |
| Estadísticas | Resumen general, comparativas, tendencias |

---

## 9. Roles y Permisos

### Roles Base (5)
| Rol | Acceso |
|-----|--------|
| **Ciudadano** | Reporte ciudadano, búsqueda personas |
| **Voluntario** | Turnos, donaciones, refugios básicos |
| **Operador** | Módulos tácticos básicos |
| **Coordinador** | Todos los módulos tácticos |
| **Director** | Acceso completo + reportes |

### Roles Tácticos (7)
| Rol | Módulos Específicos |
|-----|---------------------|
| **Jefe de Logística** | Suministros, inventario, entregas |
| **Jefe de Salud** | Triaje, hospital, psicosocial |
| **Jefe de Refugios** | Refugios, ocupantes, solicitudes |
| **Jefe de Búsqueda** | SAR, sectores, equipos |
| **Jefe de Comunicaciones** | Comunicaciones, alertas |
| **Jefe de Protección** | Infantil, legal, familiar |
| **Jefe de Operaciones Aéreas** | Drones, helicópteros |

### Eliminar Registros
Solo los roles **Coordinador** y **Director** pueden eliminar registros. El botón de eliminación (✕) aparece en:
- Triaje de Víctimas
- Agua y Saneamiento
- Comunicaciones de Emergencia
- Apoyo Psicosocial
- Reunificación Familiar

---

## 10. Sistema Offline

### Funcionamiento
1. **Primera carga**: El sistema descarga todos los módulos y archivos estáticos
2. **Offline**: Puede crear reportes y modificar datos sin conexión
3. **Sincronización**: Al recuperar conexión, los datos se suben automáticamente

### Cola Offline
- Los reportes creados offline se almacenan en `localStorage`
- Al reconectar, se sincronizan con Firestore
- Si hay conflictos, se muestra un indicador visual

---

## 11. Solución de Problemas

### El mapa no carga
- Verifique su conexión a internet
- Intente recargar la página (Ctrl+F5)
- Verifique que JavaScript esté habilitado

### Los datos no se guardan
- Verifique su conexión a internet
- Revise la consola del navegador (F12) para errores
- Si está offline, los datos se guardan localmente

### Los reportes PDF no generan
- Verifique que no haya bloqueadores de popup
- Intente en otro navegador
- Verifique que jsPDF esté cargado (consola: `typeof jspdf`)

### El sistema es lento
- Cierre otras pestañas del navegador
- Limite la caché del navegador
- Use una conexión estable a internet

### Error de permisos
- Verifique que haya iniciado sesión
- Confirme que su rol tenga acceso al módulo
- Contacte al administrador si el problema persiste

---

## Información Técnica

### Stack Tecnológico
- React 19 + TypeScript 5.8
- Vite 6.4 (empaquetador)
- Tailwind CSS v4 (estilos)
- Firebase Firestore (base de datos)
- Leaflet (mapas)
- jsPDF (generación de PDF)
- PWA (Progressive Web App)

### APIs Disponibles
El sistema expone 20+ APIs tipadas para desarrollo:
- CRUD genérico con `createCrud()`
- Métodos especializados por módulo
- Documentación completa en `README.md`

### Contacto Soporte
- **Email**: soporte@ayudasismovzla.web.app
- **GitHub**: https://github.com/gointeraction/sismovzla
- **Issues**: Reporte problemas en GitHub Issues

---

*Última actualización: v3.2 — Junio 2026*
