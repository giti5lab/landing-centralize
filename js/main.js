(function () {
  "use strict";

  var config = window.CENTRALIZE_CONFIG || {};
  var root = document.documentElement;
  root.classList.add("js");

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var num = new Intl.NumberFormat("pt-BR");
  var brl = function (v) { return "R$ " + num.format(v); };

  /* ------------------------------------------------------------------
     Analytics: eventos vão para o dataLayer (GTM) e para gtag, se existir
     ------------------------------------------------------------------ */
  window.dataLayer = window.dataLayer || [];
  function track(event, params) {
    var payload = Object.assign({ event: event }, params || {});
    window.dataLayer.push(payload);
    if (typeof window.gtag === "function") window.gtag("event", event, params || {});
  }
  track("page_view_landing", { page: location.pathname });

  /* ------------------------------------------------------------------
     Conteúdo comercial a partir do config.js
     ------------------------------------------------------------------ */
  (function applyConfig() {
    var pricing = config.pricing;
    if (pricing) {
      Object.keys(pricing.plans).forEach(function (key) {
        var plan = pricing.plans[key];
        $$('[data-price="' + key + '"]').forEach(function (el) { el.textContent = num.format(plan.base); });
        $$('[data-extra="' + key + '"]').forEach(function (el) {
          el.textContent = "+ " + brl(plan.perBlock) + " a cada bloco de " + num.format(pricing.blockSize) + " clientes acima disso";
        });
      });
      $$("[data-tier-limit]").forEach(function (el) { el.textContent = num.format(pricing.tierLimit); });
    }
    if (config.setupPrice != null) $$("[data-setup-price]").forEach(function (el) { el.textContent = brl(config.setupPrice); });
    if (config.integration) {
      $$("[data-included-assets]").forEach(function (el) { el.textContent = config.integration.includedAssetsPerMonth; });
      $$("[data-asset-fee]").forEach(function (el) { el.textContent = brl(config.integration.extraAssetFee); });
    }
    if (config.consultingHoursPerMonth) $$("[data-consulting-hours]").forEach(function (el) { el.textContent = config.consultingHoursPerMonth; });

    var banner = $("[data-founder-banner]");
    if (banner) {
      var offer = config.founderOffer;
      if (offer && offer.enabled) {
        $("[data-founder-text]", banner).textContent = "os " + offer.slots + " primeiros provedores ficam isentos do setup.";
      } else {
        banner.hidden = true;
      }
    }

    if (config.contactEmail) {
      $$("[data-contact-email]").forEach(function (a) {
        a.href = "mailto:" + config.contactEmail;
        a.textContent = config.contactEmail;
      });
    }
    if (config.whatsapp) {
      var item = $("[data-whatsapp-item]");
      $("[data-whatsapp-link]").href = "https://wa.me/" + config.whatsapp.replace(/\D/g, "");
      if (item) item.hidden = false;
    }

    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  })();

  /* ------------------------------------------------------------------
     Cabeçalho e menu mobile
     ------------------------------------------------------------------ */
  var header = $(".site-header");
  var nav = $("#nav");
  var toggle = $(".nav-toggle");

  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }
  toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
  });

  /* ------------------------------------------------------------------
     Captura do sistema: mostra placeholder enquanto não houver imagem real
     ------------------------------------------------------------------ */
  $$("[data-screenshot]").forEach(function (frame) {
    var img = $("img", frame);
    var missing = function () { frame.classList.add("is-missing"); };
    img.addEventListener("error", missing);
    if (img.complete && img.naturalWidth === 0) missing();
  });

  /* ------------------------------------------------------------------
     CTAs: rastreio e plano de interesse
     ------------------------------------------------------------------ */
  var planField = $("#f-plano");
  $$("[data-cta]").forEach(function (el) {
    el.addEventListener("click", function () {
      track("cta_click", { cta_location: el.getAttribute("data-cta"), cta_text: el.textContent.trim() });
      var plan = el.getAttribute("data-plan");
      if (plan && planField) planField.value = plan;
    });
  });

  /* ------------------------------------------------------------------
     CTA fixo no mobile: aparece após o hero e some perto do formulário
     ------------------------------------------------------------------ */
  var mobileCta = $(".mobile-cta");
  if ("IntersectionObserver" in window && mobileCta) {
    var heroOut = false, formIn = false;
    var mobileLink = $("a", mobileCta);
    var updateMobileCta = function () {
      var show = heroOut && !formIn;
      mobileCta.classList.toggle("is-visible", show);
      mobileCta.setAttribute("aria-hidden", String(!show));
      mobileLink.tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(function (entries) {
      heroOut = !entries[0].isIntersecting; updateMobileCta();
    }).observe($(".hero-actions"));
    new IntersectionObserver(function (entries) {
      formIn = entries[0].isIntersecting; updateMobileCta();
    }, { threshold: 0.05 }).observe($("#demonstracao"));
  }

  /* ------------------------------------------------------------------
     Animação de entrada
     ------------------------------------------------------------------ */
  var revealTargets = $$(".section-head, .pain, .feature, .stat, .diff, .step, .plan, .hub, .patchwork, .essence");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); revealer.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealTargets.forEach(function (el) { el.classList.add("reveal"); revealer.observe(el); });
  }

  /* ------------------------------------------------------------------
     Parâmetros de campanha (UTM) preservados durante a sessão
     ------------------------------------------------------------------ */
  var CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];
  var campaign = {};
  try { campaign = JSON.parse(sessionStorage.getItem("centralize_campaign") || "{}"); } catch (e) { campaign = {}; }
  var params = new URLSearchParams(location.search);
  CAMPAIGN_KEYS.forEach(function (k) { if (params.get(k)) campaign[k] = params.get(k); });
  try { sessionStorage.setItem("centralize_campaign", JSON.stringify(campaign)); } catch (e) { /* armazenamento indisponível */ }

  /* ------------------------------------------------------------------
     Formulário de demonstração
     ------------------------------------------------------------------ */
  var form = $("#lead-form");
  if (!form) return;
  var success = $("#form-success");
  var status = $(".form-status", form);
  var submitBtn = $('button[type="submit"]', form);
  var started = false;

  var FREE_EMAIL = /@(gmail|hotmail|outlook|live|yahoo|bol|uol|icloud)\./i;

  var rules = {
    nome: function (v) { return v.trim().length >= 2 ? "" : "Informe seu nome."; },
    empresa: function (v) { return v.trim().length >= 2 ? "" : "Informe o nome do provedor ou empresa."; },
    email: function (v) {
      if (!v.trim()) return "Informe seu e-mail.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Informe um e-mail válido.";
    },
    whatsapp: function (v) {
      var d = v.replace(/\D/g, "");
      return d.length === 10 || d.length === 11 ? "" : "Informe o WhatsApp com DDD.";
    },
    clientes: function (v) { return v ? "" : "Selecione a quantidade de clientes ativos."; },
    desafio: function (v) { return v ? "" : "Selecione o principal desafio."; },
    privacidade: function (_, el) { return el.checked ? "" : "É necessário concordar para enviarmos o contato."; }
  };

  function setError(el, message) {
    var field = el.closest(".field");
    var errorEl = $("#" + el.id + "-err");
    field.classList.toggle("has-error", !!message);
    el.setAttribute("aria-invalid", message ? "true" : "false");
    if (errorEl) {
      errorEl.textContent = message;
      if (message) el.setAttribute("aria-describedby", errorEl.id); else el.removeAttribute("aria-describedby");
    }
  }

  function validateField(el) {
    var rule = rules[el.name];
    if (!rule) return true;
    var message = rule(el.value, el);
    setError(el, message);
    return !message;
  }

  // Máscara simples para telefone brasileiro
  var phone = form.elements.whatsapp;
  phone.addEventListener("input", function () {
    var d = phone.value.replace(/\D/g, "").slice(0, 11);
    var out = d;
    if (d.length > 2) out = "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length > 6) out = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4);
    phone.value = out;
  });

  Object.keys(rules).forEach(function (name) {
    var el = form.elements[name];
    el.addEventListener("blur", function () { if (el.value || el.type === "checkbox") validateField(el); });
    el.addEventListener("change", function () { if (el.closest(".has-error")) validateField(el); });
    el.addEventListener("input", function () { if (el.closest(".has-error")) validateField(el); });
  });

  form.addEventListener("input", function () {
    if (!started) { started = true; track("form_start", { form: "demonstracao" }); }
  });

  function collect() {
    var data = {};
    ["nome", "empresa", "email", "whatsapp", "clientes", "desafio", "plano_interesse"].forEach(function (k) {
      data[k] = (form.elements[k].value || "").trim();
    });
    data.email_corporativo = !FREE_EMAIL.test(data.email);
    data.consentimento_privacidade = form.elements.privacidade.checked;
    data.origem = "landing_page";
    data.pagina = location.href.split("#")[0];
    data.referrer = document.referrer || "";
    data.enviado_em = new Date().toISOString();
    Object.assign(data, campaign);
    return data;
  }

  function sendByEmail(data) {
    var labels = {
      nome: "Nome", empresa: "Provedor/empresa", email: "E-mail", whatsapp: "WhatsApp",
      clientes: "Clientes ativos", desafio: "Principal desafio", plano_interesse: "Plano de interesse"
    };
    var lines = Object.keys(labels).filter(function (k) { return data[k]; }).map(function (k) { return labels[k] + ": " + data[k]; });
    CAMPAIGN_KEYS.forEach(function (k) { if (data[k]) lines.push(k + ": " + data[k]); });
    var subject = "Solicitação de demonstração — " + data.empresa;
    location.href = "mailto:" + (config.contactEmail || "") +
      "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(lines.join("\n"));
    return Promise.resolve();
  }

  function sendToEndpoint(data) {
    return fetch(config.leadEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
    });
  }

  function showSuccess(data) {
    form.hidden = true;
    success.hidden = false;
    success.focus();
    track("form_submit", { form: "demonstracao", clientes: data.clientes, desafio: data.desafio, plano: data.plano_interesse || "" });
    if (data.email_corporativo) track("lead_qualificado", { clientes: data.clientes });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "";
    status.classList.remove("is-error");

    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      if (!validateField(el) && !firstInvalid) firstInvalid = el;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      track("form_error", { form: "demonstracao", campo: firstInvalid.name, tipo: "validacao" });
      return;
    }

    var data = collect();

    // Honeypot preenchido: provável bot — finge sucesso sem enviar
    if (form.elements.site.value) { form.hidden = true; success.hidden = false; return; }

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando…";

    var send = config.leadEndpoint ? sendToEndpoint : sendByEmail;
    send(data)
      .then(function () { showSuccess(data); })
      .catch(function (err) {
        status.textContent = "Não foi possível enviar agora. Tente novamente ou escreva para " + (config.contactEmail || "nossa equipe") + ".";
        status.classList.add("is-error");
        track("form_error", { form: "demonstracao", tipo: "envio", detalhe: String(err && err.message) });
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Solicitar demonstração";
      });
  });
})();
