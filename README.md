# Al Estilo Criollo — Carnes Premium

React + Vite + Firebase (Realtime Database + Authentication).

## Puesta en marcha
1. `src/config.js` ya tiene el firebaseConfig completo del proyecto `chino-a425c`.
2. Firebase → Authentication → Sign-in method → habilitar **Correo/contraseña**.
3. Firebase → Authentication → Users → **Agregar usuario**:
   - `admin@criollo.app` (administrador)
   - `estilocampo@criollo.app` (el cliente)
   Cada uno con su contraseña. En el panel se entra escribiendo solo `admin` o `estilocampo`.
4. Firebase → Realtime Database → Reglas → pegar el contenido de `firebase.rules.json` y **Publicar**.
5. Subir a GitHub → Vercel compila solo.

Los mails no tienen que existir: son solo identificadores. Si alguien olvida la contraseña, se cambia desde Firebase → Authentication → Users.

## Panel
Botón de la tranquera (arriba a la derecha) o `/#admin`. Pestañas: Pedidos (con buscador), Productos (aumento masivo con deshacer), Categorías, Reseñas, Bot y Negocio (logo, WhatsApp, dirección, horarios, redes, cambiar contraseña).
