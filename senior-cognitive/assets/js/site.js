/* Senior Cognitive website: three small jobs. No frameworks, no tracking.
   1. Close the mobile menu.
   2. Turn the "coming soon" buttons into App Store links once the link exists.
   3. Validate and send the contact form. */
(function () {
  "use strict";

  var lang = (document.documentElement.lang || "es").slice(0, 2) === "en" ? "en" : "es";
  var T = {
    es: {
      centro: "Escribe el nombre del centro.",
      nombre: "Escribe tu nombre.",
      email: "Escribe un correo válido, por ejemplo nombre@centro.es.",
      consent: "Marca la casilla para poder enviar el mensaje.",
      sending: "Enviando...",
      ok: "Mensaje enviado. Te responderemos lo antes posible.",
      mail: "Se ha abierto tu programa de correo con el mensaje listo para enviar. Si no se abre, escribe a albeasystems@gmail.com.",
      fail: "No se ha podido enviar. Inténtalo de nuevo en unos minutos.",
      unset: "El envío todavía no está configurado en esta página.",
      subject: "Información para un centro: ",
      store: "Descargar en App Store",
      labels: ["Centro", "Nombre y cargo", "Correo", "Teléfono", "Personas que lo usarían", "Mensaje"]
    },
    en: {
      centro: "Enter the name of the centre.",
      nombre: "Enter your name.",
      email: "Enter a valid email address, for example name@centre.org.",
      consent: "Tick the box so the message can be sent.",
      sending: "Sending...",
      ok: "Message sent. We will reply as soon as we can.",
      mail: "Your email app has opened with the message ready to send. If it does not open, write to albeasystems@gmail.com.",
      fail: "The message could not be sent. Please try again in a few minutes.",
      unset: "Sending is not set up on this page yet.",
      subject: "Information for a centre: ",
      store: "Download on the App Store",
      labels: ["Centre", "Name and role", "Email", "Phone", "People who would use it", "Message"]
    }
  }[lang];

  /* 1. Mobile menu */
  var menu = document.querySelector(".menu");
  if (menu) {
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) menu.open = false;
    });
    document.addEventListener("click", function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.open) {
        menu.open = false;
        var s = menu.querySelector("summary");
        if (s) s.focus();
      }
    });
  }

  /* 2. App Store link: put it in <meta name="app-store-url" content="https://..."> */
  var meta = document.querySelector('meta[name="app-store-url"]');
  var storeUrl = meta && meta.content.trim();
  if (storeUrl && /^https:\/\//.test(storeUrl)) {
    document.querySelectorAll("[data-store]").forEach(function (el) {
      var a = document.createElement("a");
      a.href = storeUrl;
      a.className = el.className.replace("btn--soon", "").trim();
      a.textContent = T.store;
      el.replaceWith(a);
    });
  }

  /* 3. Contact form */
  var form = document.getElementById("contacto");
  if (!form) return;
  var status = form.querySelector(".form__status");
  var submitBtn = form.querySelector("button[type=submit]");

  function field(name) { return form.elements[name]; }
  function box(input) { return input.closest(".field"); }

  function setError(input, errId, bad) {
    var err = document.getElementById(errId);
    var wrap = box(input);
    if (err) err.hidden = !bad;
    if (wrap) wrap.classList.toggle("field--bad", bad);
    input.setAttribute("aria-invalid", bad ? "true" : "false");
  }

  var rules = [
    { name: "centro", err: "e-centro", ok: function (v) { return v.trim().length > 1; } },
    { name: "nombre", err: "e-nombre", ok: function (v) { return v.trim().length > 1; } },
    { name: "email", err: "e-email", ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
    { name: "personas", err: "e-personas", ok: function (v) { v = v.trim(); return v === "" || (/^\d+$/.test(v) && Number(v) >= 1); } }
  ];

  function validate() {
    var first = null;
    rules.forEach(function (r) {
      var input = field(r.name);
      var good = r.ok(input.value);
      setError(input, r.err, !good);
      if (!good && !first) first = input;
    });
    var consent = field("consentimiento");
    var errC = document.getElementById("e-consent");
    var okC = consent.checked;
    errC.hidden = okC;
    consent.setAttribute("aria-invalid", okC ? "false" : "true");
    if (!okC && !first) first = consent;
    return first;
  }

  rules.forEach(function (r) {
    field(r.name).addEventListener("input", function () {
      if (!box(this).classList.contains("field--bad")) return;
      if (r.ok(this.value)) setError(this, r.err, false);
    });
  });
  field("consentimiento").addEventListener("change", function () {
    if (this.checked) { document.getElementById("e-consent").hidden = true; this.setAttribute("aria-invalid", "false"); }
  });

  function say(state, text) {
    status.dataset.state = state;
    status.textContent = text;
  }

  function payload() {
    return {
      centro: field("centro").value.trim(),
      nombre: field("nombre").value.trim(),
      email: field("email").value.trim(),
      telefono: field("telefono").value.trim(),
      personas: field("personas").value.trim(),
      mensaje: field("mensaje").value.trim(),
      idioma: lang
    };
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    say("", "");
    var firstBad = validate();
    if (firstBad) { firstBad.focus(); return; }
    if (field("web").value) { say("ok", T.ok); form.reset(); return; } // honeypot: pretend it worked

    var data = payload();
    var endpoint = (form.dataset.endpoint || "").trim();
    var mailto = (form.dataset.mailto || "").trim();

    if (endpoint) {
      say("", T.sending);
      submitBtn.disabled = true;
      form.setAttribute("aria-busy", "true");
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        say("ok", T.ok);
        form.reset();
      }).catch(function () { say("error", T.fail); })
        .then(function () { submitBtn.disabled = false; form.removeAttribute("aria-busy"); });
    } else if (mailto) {
      var lines = [data.centro, data.nombre, data.email, data.telefono, data.personas, data.mensaje]
        .map(function (v, i) { return T.labels[i] + ": " + v; });
      window.location.href = "mailto:" + mailto + "?subject=" + encodeURIComponent(T.subject + data.centro) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      say("ok", T.mail);
    } else {
      say("error", T.unset);
    }
  });
})();
