# Plataforma de Postulantes — Amplifica

Sitio estático para el caso de negocio del proceso de selección de **Encargado(a) de Finanzas** de Amplifica.

## Contenido

- `index.html` — página única con el enunciado del caso, descarga de archivos y entrega.
- `assets/css/style.css` — estilos.
- `assets/js/app.js` — registro del postulante, cronómetro de 1,5 horas persistente y checklist de entrega.
- `assets/files/Amplifica_Caso_Datos.xlsx` — data del caso, descargable desde la página.
- `assets/files/Plantilla_Respuesta_Candidato.xlsx` — plantilla de respuesta, descargable desde la página.

## Flujo para el postulante

1. Ingresa nombre y correo y presiona "Comenzar prueba" (arranca el cronómetro de 1,5 horas).
2. Lee el enunciado completo y descarga los dos Excel.
3. Resuelve el caso fuera de la plataforma (Excel/Sheets).
4. Sube su informe y su Excel de respaldo a la carpeta de Drive del proceso y marca la casilla de confirmación.

El cronómetro y el checklist se guardan en `localStorage` del navegador, así que si el postulante recarga la página no pierde el progreso ni reinicia el tiempo.

## Publicar en GitHub Pages

1. En GitHub, ve a **Settings → Pages** del repositorio.
2. En "Build and deployment", selecciona **Deploy from a branch**.
3. Elige la rama (`main` o esta rama) y la carpeta `/ (root)`.
4. Guarda; GitHub entrega una URL pública del tipo `https://<org>.github.io/<repo>/`.

## Carpeta de entrega (Google Drive)

El botón "Subir mis archivos a Drive" apunta a:
https://drive.google.com/drive/folders/1q0j1o2hU329LOYTcryxGfIMNdgaTR1zG?usp=drive_link

Verifica que el permiso de la carpeta sea "Cualquier persona con el enlace puede subir archivos" (o editor) para que los postulantes puedan cargar sus archivos sin necesitar acceso previo.
