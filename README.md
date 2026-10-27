# Al Estilo Criollo — Carnes Premium

React + Vite + Firebase Realtime Database.

## Antes de publicar
Firebase ya está conectado (proyecto `chino-a425c`). Solo queda:
1. Agregar el bloque `criollo` a las reglas de Firebase (abajo).
2. `ADMIN` en `src/config.js`: usuario y contraseña iniciales del panel (después se cambian desde el panel).

Todo lo demás lo carga el cliente desde el panel: **pestaña Negocio** (logo, nombre, WhatsApp, dirección, mapa, redes, horarios, link de reseñas y acceso al panel), **Bot** (preguntas frecuentes), **Reseñas**, **Productos** (incluye aumento masivo con deshacer) y **Categorías**.

## Reglas de Firebase
Los datos van bajo el nodo `criollo/`. **No reemplaces las reglas existentes del proyecto** (rompería otras webs que usan la misma base): agregá solo este bloque dentro de `"rules"`:

```json
"criollo": {
  "categories": { ".read": true, ".write": true },
  "products":   { ".read": true, ".write": true },
  "orders":     { ".read": true, ".write": true },
  "track":      { ".read": true, ".write": true },
  "reviews":    { ".read": true, ".write": true },
  "settings":   { ".read": true, ".write": true },
  "botItems":   { ".read": true, ".write": true },
  "backup":     { ".read": true, ".write": true }
}
```

## Publicar
Subir todos los archivos al repo de GitHub y conectarlo a Vercel (Framework: Vite). Vercel hace `npm install` y `npm run build` solo.

## Admin
Entrar desde el pie de página ("Acceso administrador") o con `tu-web.vercel.app/#admin`.
