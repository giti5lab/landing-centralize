/*
 * Configuração comercial da landing page.
 * PENDENTE: todos os valores abaixo precisam de confirmação comercial/jurídica antes da publicação.
 */
window.CENTRALIZE_CONFIG = {
  // Canais oficiais
  contactEmail: "comercial@centralize.net.br",
  whatsapp: "", // ex.: "5511999999999" — vazio esconde o link no rodapé

  // Destino dos leads (CRM, webhook, Formspree etc.). Recebe POST JSON.
  // Vazio: o formulário abre o e-mail do visitante já preenchido para contactEmail.
  leadEndpoint: "",

  // Preços mensais por plano (R$), até tierLimit clientes ativos
  pricing: {
    tierLimit: 1500,
    blockSize: 500,
    plans: {
      essencial: { base: 500, perBlock: 150 },
      integrado: { base: 600, perBlock: 150 },
      parceiro: { base: 980, perBlock: 200 }
    }
  },

  setupPrice: 500,
  founderOffer: { enabled: true, slots: 10 },

  integration: { includedAssetsPerMonth: 3, extraAssetFee: 150 },
  consultingHoursPerMonth: 4
};
