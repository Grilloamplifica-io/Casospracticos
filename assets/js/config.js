// Configuración de la plataforma. Completa estos valores siguiendo el README
// (sección "Panel de administración") antes de publicar.
window.AMPLIFICA_CONFIG = {
  // URL del Web App de Google Apps Script (termina en /exec). Déjalo vacío
  // ("") para deshabilitar el registro en Sheets y el panel de administración.
  APPS_SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycbxvB0PIjOlT4R8rqE4eWbH4uQWdkk4Xdx_gyAv-kf7M94QbQ7eaBfLpzm-1DrzApWBWaA/exec",

  // Client ID de OAuth de Google Cloud (Credentials → OAuth client ID → Web application),
  // usado únicamente por admin.html para el botón de inicio de sesión con Google.
  GOOGLE_CLIENT_ID: "162346621751-n09na6d9npiup2fdo2t2jtu8drpqfh3a.apps.googleusercontent.com",

  // Postulantes autorizados a rendir la prueba. El RUT es la clave de acceso:
  // solo quien ingrese un RUT de esta lista puede comenzar. Agrega o quita
  // candidatos aquí, en el formato que prefieras (con o sin puntos).
  CANDIDATOS_AUTORIZADOS: [
    { nombre: "Rodrigo Rioz", rut: "20.072.535-2" },
    { nombre: "Joaquín Riveros", rut: "18.395.975-1" },
    { nombre: "Camila Marín", rut: "17.253.754-5" },
  ],
};
