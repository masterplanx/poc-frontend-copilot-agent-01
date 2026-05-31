# Frontend React con login y bienvenida protegida

Este repositorio contiene una aplicación web en React creada en la carpeta `frontend/`.

## Funcionalidad

- Página de login en `/login`
- Página de bienvenida en `/welcome`
- Autenticación contra el backend externo `poc-backend-copilot-agent-01`
- Guardado del `access_token` y `refresh_token` en `sessionStorage`
- Redirección automática al login si no existe una sesión válida
- Cierre de sesión para limpiar el token y bloquear nuevamente la ruta protegida
- Botón para refrescar manualmente el token y mostrar su nueva expiración

## Backend esperado

La aplicación consume por defecto el backend en:

```txt
http://localhost:8000
```

Endpoints utilizados:

```txt
POST /token
POST /refresh
```

Body esperado:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Para refrescar el token:

```json
{
  "refresh_token": "<jwt>"
}
```

## Requisitos

- Node.js 20+ recomendado
- npm
- Backend disponible localmente en `http://localhost:8000`

## Ejecución

1. Levanta el backend del repositorio `masterplanx/poc-backend-copilot-agent-01`.
2. Desde este repositorio, instala dependencias del frontend:

```bash
cd frontend
npm install
```

3. Inicia la aplicación:

```bash
npm run dev
```

4. Abre la URL entregada por Vite, normalmente:

```txt
http://localhost:5173
```

## Configuración opcional

Si necesitas apuntar a otra URL del backend, define la variable:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

Ejemplo:

```bash
cd frontend
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Build y validación

Desde `frontend/`:

```bash
npm run lint
npm run build
```

## Uso

1. Entra a `/login`.
2. Usa las credenciales:
   - usuario: `admin`
   - contraseña: `admin123`
3. Al autenticarse correctamente se guarda el token en la sesión del navegador.
4. La aplicación redirige a `/welcome`.
5. En `/welcome`, usa **Refrescar token** para renovar manualmente la sesión.
6. La interfaz muestra un mensaje con la nueva fecha y hora de expiración del token.
7. Si intentas entrar a `/welcome` sin sesión, volverás automáticamente a `/login`.