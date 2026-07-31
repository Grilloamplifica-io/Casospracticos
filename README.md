# Plataforma de Postulantes — Amplifica

Sitio estático para el caso de negocio del proceso de selección de **Encargado(a) de Finanzas** de Amplifica.

## Contenido

- `index.html` — página única con el enunciado del caso, descarga de archivos y entrega.
- `assets/css/style.css` — estilos.
- `assets/js/app.js` — registro del postulante, cronómetro de 2 horas persistente (con cierre automático de la página al agotarse) y checklist de entrega.
- `assets/files/Amplifica_Caso_Datos.xlsx` — data del caso, descargable desde la página.
- `assets/files/Plantilla_Respuesta_Candidato.xlsx` — plantilla de respuesta, descargable desde la página.
- `assets/js/config.js` — URLs/IDs del backend opcional (panel de administración).
- `admin.html` + `assets/js/admin.js` — panel interno para ver qué postulantes iniciaron y entregaron.
- `apps-script/Code.gs` — backend (Google Apps Script) que registra los eventos en una Google Sheet y sirve los datos al panel.

## Flujo para el postulante

1. Ingresa nombre y correo y presiona "Comenzar prueba" (arranca el cronómetro de 2 horas; al agotarse, la página se bloquea automáticamente).
2. Lee el enunciado completo y descarga los dos Excel.
3. Resuelve el caso fuera de la plataforma (Excel/Sheets).
4. Sube su informe y su Excel de respaldo a la carpeta de Drive del proceso y marca la casilla de confirmación.

El cronómetro y el checklist se guardan en `localStorage` del navegador, así que si el postulante recarga la página no pierde el progreso ni reinicia el tiempo. Al cumplirse las 2 horas, la página se bloquea automáticamente: el botón de subir a Drive queda deshabilitado y solo queda disponible la opción de enviar los archivos por correo a `olivia@amplifica.io`.

## Publicar en GitHub Pages

1. En GitHub, ve a **Settings → Pages** del repositorio.
2. En "Build and deployment", selecciona **Deploy from a branch**.
3. Elige la rama (`main` o esta rama) y la carpeta `/ (root)`.
4. Guarda; GitHub entrega una URL pública del tipo `https://<org>.github.io/<repo>/`.

## Carpeta de entrega (Google Drive)

El botón "Subir mis archivos a Drive" apunta a:
https://drive.google.com/drive/folders/1q0j1o2hU329LOYTcryxGfIMNdgaTR1zG?usp=drive_link

Verifica que el permiso de la carpeta sea "Cualquier persona con el enlace puede subir archivos" (o editor) para que los postulantes puedan cargar sus archivos sin necesitar acceso previo.

## Panel de administración (opcional)

Sin configurar nada, la plataforma funciona igual que antes (registro local por navegador, sin panel). Para ver en `admin.html` quién inició la prueba y quién entregó, con acceso restringido por cuenta de Google, hay que completar dos cosas una sola vez:

### 1. Backend en Google Sheets (Apps Script)

1. Crea una Google Sheet nueva (en el Drive de `matias@amplifica.io` o el que prefieras administrar).
2. Ve a **Extensiones → Apps Script**.
3. Borra el contenido de `Code.gs` que aparece por defecto y pega el contenido de [`apps-script/Code.gs`](apps-script/Code.gs) de este repo.
4. En la constante `CORREOS_ADMIN_AUTORIZADOS`, agrega los correos de Google que podrán ver el panel (ya incluye `matias@amplifica.io`).
5. Guarda y ve a **Implementar → Nueva implementación**.
   - Tipo: **Aplicación web**.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier usuario**.
6. Autoriza los permisos que pida (acceso a la propia Sheet). Copia la **URL de la aplicación web** (termina en `/exec`).

### 2. Cliente OAuth de Google (para el botón "Iniciar sesión")

1. Entra a [Google Cloud Console](https://console.cloud.google.com/) → **APIs y servicios → Credenciales**.
2. Crea un **ID de cliente de OAuth** de tipo **Aplicación web**.
3. En "Orígenes de JavaScript autorizados" agrega la URL pública de GitHub Pages (ej. `https://grilloamplifica-io.github.io`).
4. Copia el **Client ID** generado.

### 3. Completar `assets/js/config.js`

```js
window.AMPLIFICA_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/XXXXX/exec",
  GOOGLE_CLIENT_ID: "XXXXX.apps.googleusercontent.com",
};
```

Con eso, `index.html` empieza a registrar automáticamente cada inicio y entrega en la Sheet, y `admin.html` muestra la tabla de postulantes (nombre, correo, hora de inicio, si entregó y tiempo utilizado) solo a los correos autorizados.
