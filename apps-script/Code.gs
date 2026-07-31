/**
 * Backend del panel de administración: recibe eventos de la plataforma
 * (inicio / entrega) y los registra en la hoja "Postulantes" de esta
 * planilla. También expone doGet para que admin.html lea los registros,
 * validando primero el ID token de Google del correo que hace la consulta.
 *
 * Instrucciones de despliegue en el README, sección "Panel de administración".
 */

var SHEET_NAME = "Postulantes";

// Correos autorizados para ver el panel de administración.
var CORREOS_ADMIN_AUTORIZADOS = ["matias@amplifica.io", "olivia@amplifica.io"];

// Carpeta de Drive donde se crea una subcarpeta individual por postulante.
// Es el ID de la carpeta del enlace https://drive.google.com/drive/folders/<ID>.
var CARPETA_ENTREGAS_ID = "1q0j1o2hU329LOYTcryxGfIMNdgaTR1zG";

function doPost(e) {
  var datos = JSON.parse(e.postData.contents);

  // Reiniciar el intento de un postulante es una acción de administración:
  // exige un ID token válido de un correo autorizado.
  if (datos.evento === "reiniciar") {
    var correoAdmin = verificarIdToken_(datos.idToken);
    if (!correoAdmin || CORREOS_ADMIN_AUTORIZADOS.indexOf(correoAdmin) === -1) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: "No autorizado" })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }

  var sheet = obtenerHoja_();
  sheet.appendRow([
    new Date(),
    datos.evento || "",
    datos.nombre || "",
    datos.email || "",
    datos.inicio ? new Date(Number(datos.inicio)) : "",
    datos.enviadoTs ? new Date(Number(datos.enviadoTs)) : "",
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet(e) {
  // La propia plataforma consulta esto (sin login) para saber si un admin
  // reinició su intento y debe volver a empezar desde cero.
  if (e.parameter.accion === "comprobarReset") {
    return comprobarReset_(e);
  }

  // La propia plataforma consulta esto (sin login) para obtener/crear la
  // subcarpeta de Drive individual del postulante.
  if (e.parameter.accion === "obtenerCarpeta") {
    return obtenerCarpetaCandidato_(e);
  }

  var idToken = e.parameter.idToken;
  var correo = verificarIdToken_(idToken);

  if (!correo || CORREOS_ADMIN_AUTORIZADOS.indexOf(correo) === -1) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: "No autorizado" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var sheet = obtenerHoja_();
  var valores = sheet.getDataRange().getValues();
  var filas = valores.slice(1).map(function (fila) {
    return {
      marcaTemporal: fila[0],
      evento: fila[1],
      nombre: fila[2],
      email: fila[3],
      inicio: fila[4],
      enviado: fila[5],
    };
  });

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, filas: filas })
  ).setMimeType(ContentService.MimeType.JSON);
}

function comprobarReset_(e) {
  var email = (e.parameter.email || "").toLowerCase();
  var desde = Number(e.parameter.desde || 0);
  var reiniciado = false;

  if (email) {
    var sheet = obtenerHoja_();
    var valores = sheet.getDataRange().getValues();
    for (var i = 1; i < valores.length; i++) {
      var fila = valores[i];
      var esReinicio = fila[1] === "reiniciar" && (fila[3] || "").toString().toLowerCase() === email;
      if (esReinicio && new Date(fila[0]).getTime() > desde) {
        reiniciado = true;
        break;
      }
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, reiniciado: reiniciado })
  ).setMimeType(ContentService.MimeType.JSON);
}

function obtenerCarpetaCandidato_(e) {
  var email = (e.parameter.email || "").trim();
  var nombre = (e.parameter.nombre || "").trim();

  if (!email) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: "Falta email" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  var nombreCarpeta = (nombre ? nombre + " - " : "") + email;

  try {
    var carpetaPadre = DriveApp.getFolderById(CARPETA_ENTREGAS_ID);
    var existentes = carpetaPadre.getFoldersByName(nombreCarpeta);
    var carpeta = existentes.hasNext() ? existentes.next() : null;

    if (!carpeta) {
      carpeta = carpetaPadre.createFolder(nombreCarpeta);
      carpeta.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, url: carpeta.getUrl() })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function verificarIdToken_(idToken) {
  if (!idToken) return null;
  try {
    var respuesta = UrlFetchApp.fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken),
      { muteHttpExceptions: true }
    );
    if (respuesta.getResponseCode() !== 200) return null;
    var info = JSON.parse(respuesta.getContentText());
    var verificado = info.email_verified === "true" || info.email_verified === true;
    return verificado ? info.email : null;
  } catch (err) {
    return null;
  }
}

function obtenerHoja_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(SHEET_NAME);
  if (!hoja) {
    hoja = libro.insertSheet(SHEET_NAME);
    hoja.appendRow(["Marca temporal", "Evento", "Nombre", "Correo", "Inicio", "Enviado"]);
  }
  return hoja;
}
