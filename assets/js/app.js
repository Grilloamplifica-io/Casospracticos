(function () {
  "use strict";

  var DURACION_SEGUNDOS = 2 * 60 * 60; // 2 horas máximo
  var STORAGE_KEY = "amplifica_caso_finanzas_estado";
  var APPS_SCRIPT_URL = (window.AMPLIFICA_CONFIG && window.AMPLIFICA_CONFIG.APPS_SCRIPT_URL) || "";

  function registrarEvento(evento, estado) {
    if (!APPS_SCRIPT_URL) return; // sin backend configurado, no se registra nada
    try {
      fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          evento: evento,
          nombre: estado.nombre,
          rut: estado.rut,
          inicio: estado.inicio,
          enviadoTs: estado.enviadoTs || "",
        }),
      });
    } catch (e) {
      /* si falla el registro remoto, la prueba del candidato sigue funcionando igual */
    }
  }

  var $ = function (id) { return document.getElementById(id); };

  var elRegistro = $("registro");
  var elContenido = $("contenido-caso");
  var elBloqueoTiempo = $("bloqueo-tiempo");
  var elTimerBar = $("timer-bar");
  var elTimerTexto = $("timer-texto");
  var elBtnComenzar = $("btn-comenzar");
  var elInputRut = $("input-rut");
  var elRegistroError = $("registro-error");
  var CANDIDATOS_AUTORIZADOS = (window.AMPLIFICA_CONFIG && window.AMPLIFICA_CONFIG.CANDIDATOS_AUTORIZADOS) || [];

  var elChkInforme = $("chk-informe");
  var elChkExcel = $("chk-excel");
  var elChkNombre = $("chk-nombre");
  var elBtnConfirmarEnvio = $("btn-confirmar-envio");
  var elConfirmacionEnvio = $("confirmacion-envio");

  var pills = {
    1: $("pill-1"),
    2: $("pill-2"),
    3: $("pill-3"),
    4: $("pill-4"),
  };

  function leerEstado() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function guardarEstado(estado) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } catch (e) {
      /* almacenamiento no disponible, la prueba sigue funcionando sin persistencia */
    }
  }

  function normalizarRut(rut) {
    return (rut || "").toString().toUpperCase().replace(/[^0-9K]/g, "");
  }

  function buscarCandidatoPorRut(rutIngresado) {
    var normalizado = normalizarRut(rutIngresado);
    if (!normalizado) return null;
    for (var i = 0; i < CANDIDATOS_AUTORIZADOS.length; i++) {
      if (normalizarRut(CANDIDATOS_AUTORIZADOS[i].rut) === normalizado) {
        return CANDIDATOS_AUTORIZADOS[i];
      }
    }
    return null;
  }

  function marcarPill(numero, clase) {
    var el = pills[numero];
    if (!el) return;
    el.classList.remove("activo", "hecho");
    if (clase) el.classList.add(clase);
  }

  function formatoTiempo(segundos) {
    var s = Math.max(0, Math.floor(segundos));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    return pad(h) + ":" + pad(m) + ":" + pad(sec);
  }

  var intervaloTimer = null;

  function tiempoExpirado(startTs) {
    return (Date.now() - startTs) / 1000 >= DURACION_SEGUNDOS;
  }

  function bloquearPorTiempo() {
    if (intervaloTimer) clearInterval(intervaloTimer);
    elTimerBar.classList.remove("visible");
    elRegistro.classList.add("hidden");
    elContenido.classList.add("hidden");
    elBloqueoTiempo.classList.remove("hidden");
  }

  function iniciarCronometro(startTs) {
    elTimerBar.classList.add("visible");

    function tick() {
      var transcurrido = (Date.now() - startTs) / 1000;
      var restante = DURACION_SEGUNDOS - transcurrido;

      elTimerBar.classList.remove("warning", "expired");
      if (restante <= 0) {
        clearInterval(intervaloTimer);
        bloquearPorTiempo();
        return;
      }
      if (restante <= 15 * 60) {
        elTimerBar.classList.add("warning");
      }
      elTimerTexto.textContent = formatoTiempo(restante);
    }

    tick();
    intervaloTimer = setInterval(tick, 1000);
  }

  function mostrarContenido(estado) {
    if (tiempoExpirado(estado.inicio)) {
      bloquearPorTiempo();
      return;
    }
    elRegistro.classList.add("hidden");
    elContenido.classList.remove("hidden");
    marcarPill(1, "hecho");
    marcarPill(2, "hecho");
    marcarPill(3, "activo");
    if (estado.enviado) {
      marcarPill(3, "hecho");
      marcarPill(4, "hecho");
    } else {
      marcarPill(4, null);
    }
    iniciarCronometro(estado.inicio);
  }

  function restaurarChecklist(estado) {
    if (!estado.checklist) return;
    elChkInforme.checked = !!estado.checklist.informe;
    elChkExcel.checked = !!estado.checklist.excel;
    elChkNombre.checked = !!estado.checklist.nombre;
    actualizarBotonConfirmar();
    if (estado.enviado) {
      elBtnConfirmarEnvio.setAttribute("disabled", "disabled");
      elBtnConfirmarEnvio.textContent = "Entrega ya confirmada";
      elConfirmacionEnvio.classList.remove("hidden");
    }
  }

  function actualizarBotonConfirmar() {
    var todoMarcado = elChkInforme.checked && elChkExcel.checked && elChkNombre.checked;
    if (todoMarcado) {
      elBtnConfirmarEnvio.removeAttribute("disabled");
    } else {
      elBtnConfirmarEnvio.setAttribute("disabled", "disabled");
    }
  }

  function guardarChecklistEnEstado() {
    var estado = leerEstado();
    if (!estado) return;
    estado.checklist = {
      informe: elChkInforme.checked,
      excel: elChkExcel.checked,
      nombre: elChkNombre.checked,
    };
    guardarEstado(estado);
  }

  [elChkInforme, elChkExcel, elChkNombre].forEach(function (chk) {
    chk.addEventListener("change", function () {
      actualizarBotonConfirmar();
      guardarChecklistEnEstado();
    });
  });

  elBtnConfirmarEnvio.addEventListener("click", function () {
    var estado = leerEstado();
    if (!estado) return;
    estado.enviado = true;
    estado.enviadoTs = Date.now();
    guardarEstado(estado);
    elBtnConfirmarEnvio.setAttribute("disabled", "disabled");
    elBtnConfirmarEnvio.textContent = "Entrega ya confirmada";
    elConfirmacionEnvio.classList.remove("hidden");
    marcarPill(3, "hecho");
    marcarPill(4, "hecho");
    registrarEvento("entrega", estado);
  });

  elBtnComenzar.addEventListener("click", function () {
    var rutIngresado = elInputRut.value.trim();
    var candidato = buscarCandidatoPorRut(rutIngresado);

    if (!candidato) {
      elRegistroError.classList.remove("hidden");
      return;
    }
    elRegistroError.classList.add("hidden");

    var estado = {
      nombre: candidato.nombre,
      rut: candidato.rut,
      inicio: Date.now(),
      enviado: false,
      checklist: { informe: false, excel: false, nombre: false },
    };
    guardarEstado(estado);
    mostrarContenido(estado);
    registrarEvento("inicio", estado);
  });

  // Al cargar la página, si ya existe una prueba en curso para este navegador, se retoma.
  (function inicializar() {
    var estado = leerEstado();
    if (estado && estado.inicio) {
      elInputRut.value = estado.rut || "";
      mostrarContenido(estado);
      restaurarChecklist(estado);
    } else {
      marcarPill(1, "activo");
    }
  })();
})();
