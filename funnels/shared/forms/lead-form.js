/* ==========================================================================
   LEAD FORM BEHAVIOUR
   --------------------------------------------------------------------------
   You shouldn't need to edit this file. All the settings you'd want to change
   live in form-config.js next door.

   What it does:
     - checks the answers before sending (name, phone, email, consent)
     - sends them to your GoHighLevel webhook
     - shows a thank-you message, or redirects
     - in preview mode (no webhook set) it shows what WOULD have been sent
   ========================================================================== */
(function () {
  "use strict";

  var CONFIG = window.RPV_FORM_CONFIG || {};

  function ready(fn) {
    if (document.readyState !== "loading") { fn(); }
    else { document.addEventListener("DOMContentLoaded", fn); }
  }

  /* ---- validation helpers ------------------------------------------- */

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
  }

  function isPhone(value) {
    var digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  }

  function fieldError(field, message) {
    var wrap = field.closest(".rpv-field");
    if (!wrap) { return; }
    wrap.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
    var slot = wrap.querySelector(".rpv-field__error");
    if (slot) { slot.textContent = message; }
  }

  function clearError(field) {
    var wrap = field.closest(".rpv-field");
    if (!wrap) { return; }
    wrap.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    var slot = wrap.querySelector(".rpv-field__error");
    if (slot) { slot.textContent = ""; }
  }

  function validate(form) {
    var firstBad = null;

    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || field.type === "hidden" || field.type === "submit") { return; }
      clearError(field);

      var value = (field.value || "").trim();
      var label = field.getAttribute("data-label") || "This";
      var bad = "";

      if (field.type === "checkbox" && field.required && !field.checked) {
        bad = "Please tick this box so we're allowed to contact you.";
      } else if (field.required && !value && field.type !== "checkbox") {
        bad = label + " is required.";
      } else if (value && field.type === "email" && !isEmail(value)) {
        bad = "That email address doesn't look right.";
      } else if (value && field.type === "tel" && !isPhone(value)) {
        bad = "Please enter a full phone number with area code.";
      }

      if (bad) {
        fieldError(field, bad);
        if (!firstBad) { firstBad = field; }
      }
    });

    if (firstBad) { firstBad.focus(); }
    return !firstBad;
  }

  /* ---- gather the answers ------------------------------------------- */

  function collect(form) {
    var payload = {};

    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name) { return; }
      if (field.type === "checkbox") {
        payload[field.name] = field.checked ? "yes" : "no";
      } else if (field.type !== "submit") {
        payload[field.name] = (field.value || "").trim();
      }
    });

    /* Extra context GoHighLevel is handy to have on the contact record. */
    payload.page_url = window.location.href;
    payload.submitted_at = new Date().toISOString();
    if (document.referrer) { payload.referrer = document.referrer; }

    /* Carry ad tracking through from the URL, e.g. ?utm_source=tiktok */
    var params = new URLSearchParams(window.location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ad_id"]
      .forEach(function (key) {
        var val = params.get(key);
        if (val) { payload[key] = val; }
      });

    return payload;
  }

  /* ---- outcome screens ----------------------------------------------- */

  function showSuccess(form, payload, previewMode) {
    var panel = document.createElement("div");
    panel.className = "rpv-form__done";
    panel.setAttribute("role", "status");

    var title = CONFIG.successTitle || "Thank you.";
    var body = CONFIG.successBody || "We'll be in touch shortly.";

    panel.innerHTML =
      '<svg class="rpv-form__tick" viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".35"/>' +
      '<path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      "<h3>" + title + "</h3><p>" + body + "</p>";

    if (previewMode) {
      var note = document.createElement("div");
      note.className = "rpv-form__preview-note";
      note.innerHTML =
        "<strong>Preview mode — nothing was sent.</strong>" +
        "<span>Add your GoHighLevel webhook URL in <code>shared/forms/form-config.js</code> to go live. " +
        "Here's what would have been sent:</span>" +
        "<pre>" + JSON.stringify(payload, null, 2) + "</pre>";
      panel.appendChild(note);
    }

    form.replaceWith(panel);
    panel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function showError(form) {
    var slot = form.querySelector(".rpv-form__status");
    if (!slot) { return; }
    slot.className = "rpv-form__status is-error";
    slot.textContent = CONFIG.errorBody || "Something went wrong. Please try again.";
  }

  /* ---- send ----------------------------------------------------------- */

  function send(form, payload) {
    var button = form.querySelector(".rpv-form__submit");
    var original = button ? button.innerHTML : "";

    if (button) {
      button.disabled = true;
      button.innerHTML = '<span class="rpv-form__spinner" aria-hidden="true"></span> Sending…';
    }

    /* text/plain avoids a browser pre-flight check that some webhook
       endpoints reject. GoHighLevel reads the JSON body either way. */
    fetch(CONFIG.endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload)
    })
      .then(function () {
        if (CONFIG.redirectTo) {
          window.location.href = CONFIG.redirectTo;
        } else {
          showSuccess(form, payload, false);
        }
      })
      .catch(function () {
        if (button) { button.disabled = false; button.innerHTML = original; }
        showError(form);
      });
  }

  /* ---- wire it up ------------------------------------------------------ */

  ready(function () {
    var forms = document.querySelectorAll("[data-rpv-form]");

    Array.prototype.forEach.call(forms, function (form) {
      /* Clear the red warning as soon as someone fixes a field. */
      form.addEventListener("input", function (event) {
        if (event.target.name) { clearError(event.target); }
      });

      form.addEventListener("submit", function (event) {
        event.preventDefault();

        var slot = form.querySelector(".rpv-form__status");
        if (slot) { slot.className = "rpv-form__status"; slot.textContent = ""; }

        if (!validate(form)) { return; }

        var payload = collect(form);

        if (!CONFIG.endpoint) {
          showSuccess(form, payload, true);   /* preview mode */
          return;
        }

        send(form, payload);
      });
    });
  });
})();
