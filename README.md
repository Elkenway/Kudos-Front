# UCO Kudos — Front-End

Aplicación web de UCO Kudos. React 18, TypeScript estricto y Vite. Consume la API REST del Back-End y no guarda reglas de negocio propias: las decisiones (quién aprueba, quién modera, qué se puede publicar) las toma el servidor, y la interfaz solo decide qué botones mostrar.

La instalación completa del entorno está en el [Manual de puesta a punto](../docs/MANUAL_PUESTA_A_PUNTO.md).

## Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | 20 LTS o superior |
| npm | 10 o superior |
| Back-End | En ejecución en `http://localhost:8080` |

## Ejecutar

```bash
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`. Vite redirige las peticiones `/api` al Back-End en el puerto 8080, así que en desarrollo no hace falta configurar CORS ni URLs.

Si el Back-End arrancó con el perfil `demo`, se puede entrar con cualquiera de estas cuentas (contraseña `KudosDemo2026`):

| Cuenta | Rol |
|---|---|
| `rector@uco.edu.co` | Rector |
| `coordinacion.academica@uco.edu.co` | Coordinador Académico |
| `decanatura.ingenieria@uco.edu.co` | Coordinador de Facultad |
| `coordinacion.sistemas@uco.edu.co` | Coordinador de Programa |
| `carlos.zapata@uco.edu.co` | Docente |
| `laura.rios@uco.edu.co`, `mateo.arango@uco.edu.co` | Estudiantes |

El Administrador es el que se configuró con las variables `KUDOS_ADMIN_*` del Back-End.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Verifica tipos y genera la versión de producción en `dist/` |
| `npm run typecheck` | Solo verificación de tipos |
| `npm run lint` | ESLint con `typescript-eslint` estricto y reglas de hooks de React |
| `npm test` | Pruebas con Vitest y Testing Library |
| `npm run coverage` | Pruebas con informe de cobertura en `coverage/index.html`; falla por debajo de 85 % de líneas y 80 % de ramas y funciones |

## Estructura

```
src
├── api          Cliente HTTP, tipos de la API y un objeto por recurso (kudoApi, moderationApi, ...)
├── auth         Sesión: contexto, proveedor, guarda de rutas protegidas
├── domain       Lógica de presentación pura: matriz de roles, etiquetas, aplanado de la conversación
├── hooks        useAsync (cargar datos) y useAction (enviar una acción y mostrar su error)
├── components   Piezas reutilizables: hilo de conversación, calificación, selector de personas, formularios
├── pages        Una pantalla por ruta
└── test         Utilidades de prueba: servidor simulado, datos de ejemplo, montaje de la aplicación
```

## Decisiones

- **Sin librería de estado global.** La única información compartida es la sesión, que vive en un contexto de React. Cada pantalla carga lo suyo con `useAsync` y recarga tras una acción; no hay caché que invalidar.
- **Sin librería de componentes ni de estilos.** Una hoja de estilos con variables CSS cubre las pocas piezas visuales del sistema y evita una dependencia más que justificar.
- **El token JWT se guarda en `localStorage`.** Es la opción más simple para una aplicación sin servidor propio. Si el servidor responde 401, la sesión se cierra automáticamente.
- **La conversación llega aplanada.** El Back-End entrega las réplicas en orden de lectura con su profundidad, y `domain/conversation.ts` decide qué se ve cuando se colapsa una rama, recorriendo la lista una sola vez. La sangría visual se limita a 8 niveles para que los hilos muy profundos sigan siendo legibles.
- **Las pruebas recorren la aplicación completa.** Las pruebas de páginas montan `App` con una sesión y un servidor simulado (`test/fakeServer.ts`), y verifican lo que la persona ve y las peticiones que se envían.
