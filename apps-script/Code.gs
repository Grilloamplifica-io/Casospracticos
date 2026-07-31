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
var CORREOS_ADMIN_AUTORIZADOS = ["matias@amplifica.io"];

function doPost(e) {
  var sheet = obtenerHoja_();
  var datos = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    datos.evento || "",
    datos.nombre || "",
    datos.rut || "",
    datos.inicio ? new Date(Number(datos.inicio)) : "",
    datos.enviadoTs ? new Date(Number(datos.enviadoTs)) : "",
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet(e) {
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
      rut: fila[3],
      inicio: fila[4],
      enviado: fila[5],
    };
  });

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, filas: filas })
  ).setMimeType(ContentService.MimeType.JSON);
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
    hoja.appendRow(["Marca temporal", "Evento", "Nombre", "RUT", "Inicio", "Enviado"]);
  }
  return hoja;
}
