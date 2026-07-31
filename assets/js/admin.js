(function () {
  "use strict";

  var CONFIG = window.AMPLIFICA_CONFIG || {};
  var APPS_SCRIPT_URL = CONFIG.APPS_SCRIPT_URL || "";
  var GOOGLE_CLIENT_ID = CONFIG.GOOGLE_CLIENT_ID || "";

  var $ = function (id) { return document.getElementById(id); };

  var elConfigFaltante = $("tarjeta-config-faltante");
  var elLogin = $("tarjeta-login");
  var elDatos = $("tarjeta-datos");
  var elBotonGoogle = $("boton-google");
  var elLoginError = $("login-error");
  var elDatosInfo = $("datos-info");
  var elCuerpoTabla = $("cuerpo-tabla");
  var elBtnRefrescar = $("btn-refrescar");

  var idTokenActual = null;

  if (!APPS_SCRIPT_URL || !GOOGLE_CLIENT_ID) {
    return; // se queda mostrando la tarjeta "Panel no configurado" del HTML
  }
  elConfigFaltante.classList.add("hidden");
  elLogin.classList.remove("hidden");

  function formatoFechaLegible(valor) {
    if (!valor) return "—";
    var fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return "—";
    return fecha.toLocaleString("es-CL");
  }

  function formatoDuracion(inicioMs, enviadoMs) {
    if (!inicioMs || !enviadoMs) return "—";
    var minutos = Math.round((enviadoMs - inicioMs) / 60000);
    if (minutos < 0) return "—";
    var horas = Math.floor(minutos / 60);
    var min = minutos % 60;
    return (horas > 0 ? horas + "h " : "") + min + "min";
  }

  function agruparPorCorreo(filas) {
    var mapa = {};
    filas.forEach(function (fila) {
      var email = fila.email;
      if (!email) return;
      if (!mapa[email]) {
        mapa[email] = { nombre: fila.nombre, email: email, inicio: null, entregado: false, enviado: null };
      }
      var registro = mapa[email];
      if (fila.nombre) registro.nombre = fila.nombre;
      if (fila.inicio && !registro.inicio) registro.inicio = fila.inicio;
      if (fila.evento === "entrega") {
        registro.entregado = true;
        if (fila.enviado) registro.enviado = fila.enviado;
        if (fila.inicio) registro.inicio = fila.inicio;
      }
    });
    return Object.keys(mapa).map(function (email) { return mapa[email]; });
  }

  function renderizarTabla(registros) {
    elCuerpoTabla.innerHTML = "";
    registros
      .sort(function (a, b) { return new Date(b.inicio) - new Date(a.inicio); })
      .forEach(function (r) {
        var tr = document.createElement("tr");
        var inicioMs = r.inicio ? new Date(r.inicio).getTime() : null;
        var enviadoMs = r.enviado ? new Date(r.enviado).getTime() : null;
        tr.innerHTML =
          "<td>" + escapeHtml_(r.nombre || "—") + "</td>" +
          "<td>" + escapeHtml_(r.email || "—") + "</td>" +
          "<td>" + formatoFechaLegible(r.inicio) + "</td>" +
          "<td>" + (r.entregado ? "✅ Sí" : "⏳ No") + "</td>" +
          "<td>" + formatoDuracion(inicioMs, enviadoMs) + "</td>" +
          "<td></td>";
        var celdaAccion = tr.lastElementChild;
        var btnReiniciar = document.createElement("button");
        btnReiniciar.type = "button";
        btnReiniciar.className = "btn secundario";
        btnReiniciar.style.padding = "0.4rem 0.8rem";
        btnReiniciar.style.fontSize = "0.85rem";
        btnReiniciar.textContent = "↺ Reiniciar";
        btnReiniciar.addEventListener("click", function () {
          reiniciarCandidato_(r, btnReiniciar);
        });
        celdaAccion.appendChild(btnReiniciar);
        elCuerpoTabla.appendChild(tr);
      });
    elDatosInfo.textContent = registros.length + " postulante(s) registrados.";
    elDatosInfo.classList.remove("hidden");
  }

  function reiniciarCandidato_(registro, boton) {
    var confirmado = window.confirm(
      "¿Reiniciar el intento de " + (registro.nombre || registro.email) + "? " +
      "Podrá volver a comenzar la prueba desde cero la próxima vez que entre a la página."
    );
    if (!confirmado) return;

    boton.disabled = true;
    boton.textContent = "Reiniciando...";

    fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        evento: "reiniciar",
        nombre: registro.nombre,
        email: registro.email,
        idToken: idTokenActual,
      }),
    })
      .then(function () {
        boton.textContent = "✅ Reiniciado";
      })
      .catch(function () {
        boton.disabled = false;
        boton.textContent = "↺ Reiniciar";
        window.alert("No se pudo reiniciar. Intenta de nuevo.");
      });
  }

  function escapeHtml_(texto) {
    var div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
  }

  function cargarDatos() {
    if (!idTokenActual) return;
    elDatosInfo.textContent = "Cargando...";
    elDatosInfo.classList.remove("hidden");
    fetch(APPS_SCRIPT_URL + "?idToken=" + encodeURIComponent(idTokenActual))
      .then(function (resp) { return resp.json(); })
      .then(function (data) {
        if (!data.ok) {
          elLogin.classList.remove("hidden");
          elDatos.classList.add("hidden");
          elLoginError.classList.remove("hidden");
          return;
        }
        elLoginError.classList.add("hidden");
        elLogin.classList.add("hidden");
        elDatos.classList.remove("hidden");
        renderizarTabla(agruparPorCorreo(data.filas || []));
      })
      .catch(function () {
        elDatosInfo.textContent = "No se pudo conectar con el backend. Intenta de nuevo.";
      });
  }

  elBtnRefrescar.addEventListener("click", cargarDatos);

  function manejarCredencial(respuesta) {
    idTokenActual = respuesta.credential;
    cargarDatos();
  }

  window.addEventListener("load", function () {
    if (!window.google || !window.google.accounts) return;
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: manejarCredencial,
    });
    google.accounts.id.renderButton(elBotonGoogle, { theme: "outline", size: "large" });
  });
})();
