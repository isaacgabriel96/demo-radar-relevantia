/**
 * EMV Calculator — Radar Relevantia
 * Estimated Media Value (Valor Estimado de Mídia)
 *
 * Motor de cálculo puro. Sem DOM, sem Supabase, sem dependências.
 * Recebe dados de oportunidade e retorna { total, breakdown, confidence }.
 */
(function () {
  'use strict';

  // ── CPMs de referência (BRL por 1.000 impressões) ──────────────────
  var CPM = {
    instagram_reels:   25,
    instagram_stories: 18,
    instagram_posts:   15,
    tiktok:            20,
    youtube:           30,
    linkedin:          45,
    twitch:            15,
    facebook:          12,
    twitter:           10,
    tv_aberta:         80,
    tv_fechada:        50,
    streaming:         35,
    presencial:        40
  };

  // ── Reach rates orgânico (fração dos seguidores alcançados) ────────
  var REACH = {
    instagram_reels:   0.30,
    instagram_stories: 0.15,
    instagram_posts:   0.12,
    tiktok:            0.40,
    youtube:           0.25,
    linkedin:          0.10,
    twitch:            0.20,
    facebook:          0.08,
    twitter:           0.05
  };

  // ── Formatos válidos por rede (mapeamento formato → sufixo CPM/REACH) ─
  var FORMAT_MAP = {
    'Reels':   'reels',
    'Stories': 'stories',
    'Posts':   'posts',
    'Lives':   'stories',   // Lives ~ Stories em alcance
    'Videos':  null,        // usa CPM base da rede
    'Shorts':  'reels'      // YouTube Shorts ~ Reels
  };

  // ── Placement factor por categoria ─────────────────────────────────
  var PLACEMENT = {
    'Esporte':     1.15,
    'Música':      1.10,
    'Moda':        1.10,
    'Tech':        1.05,
    'Tecnologia':  1.05,
    'Gastronomia': 1.00,
    'Cultura':     1.00,
    'Educação':    0.95,
    'Social':      0.90
  };

  // ── Engagement factor baseado em tamanho da base ───────────────────
  function engagementFactor(seguidores) {
    if (seguidores < 50000)  return 1.30;
    if (seguidores < 500000) return 1.00;
    if (seguidores < 1000000) return 0.85;
    return 0.70;
  }

  // ── Extrair número de uma string como "35.000 participantes em 2024"
  function extractNumber(str) {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    var cleaned = String(str).replace(/[^\d.,]/g, '');
    // Trata "35.000" (pt-BR) como 35000
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      return parseInt(cleaned.replace(/\./g, ''), 10);
    }
    // Trata "35,000" (en) ou "35000"
    cleaned = cleaned.replace(/,/g, '');
    var n = parseFloat(cleaned);
    return isNaN(n) ? 0 : Math.round(n);
  }

  // ── Resolver CPM e REACH para uma rede + formato ──────────────────
  function resolveKeys(network, formato) {
    var net = (network || '').toLowerCase().trim();
    var suffix = null;

    if (formato && FORMAT_MAP[formato] !== undefined) {
      suffix = FORMAT_MAP[formato];
    }

    var cpmKey = suffix ? net + '_' + suffix : net;
    var reachKey = suffix ? net + '_' + suffix : net;

    return {
      cpm:   CPM[cpmKey]   || CPM[net]   || 15,
      reach: REACH[reachKey] || REACH[net] || 0.10
    };
  }

  // ── EIXO 1: Digital / Social ──────────────────────────────────────
  function calcDigital(publicoCanais, category) {
    if (!publicoCanais || typeof publicoCanais !== 'object') return [];

    var items = [];
    var placement = PLACEMENT[category] || 1.00;
    var keys = Object.keys(publicoCanais);

    for (var i = 0; i < keys.length; i++) {
      var canal = publicoCanais[keys[i]];
      if (!canal || !canal.network) continue;

      var seg = canal.seguidores || 0;
      if (seg <= 0) continue;

      var formatos = canal.formatos && canal.formatos.length > 0
        ? canal.formatos
        : [null];

      var engFactor = engagementFactor(seg);
      var totalCanal = 0;
      var subBreakdown = [];

      for (var f = 0; f < formatos.length; f++) {
        var resolved = resolveKeys(canal.network, formatos[f]);
        var impressions = seg * resolved.reach;
        var value = (impressions * resolved.cpm / 1000) * engFactor * placement;
        totalCanal += value;

        var label = canal.network.charAt(0).toUpperCase() + canal.network.slice(1);
        if (formatos[f]) label += ' ' + formatos[f];

        subBreakdown.push({
          label: label,
          impressions: Math.round(impressions),
          value: Math.round(value)
        });
      }

      items.push({
        axis: 'digital',
        network: canal.network,
        seguidores: seg,
        tipo_dado: canal.tipo_dado || 'estimativa',
        value: Math.round(totalCanal),
        details: subBreakdown
      });
    }

    return items;
  }

  // ── EIXO 2: Presencial ────────────────────────────────────────────
  function calcPresencial(publicoPresencial, facts, category) {
    var publico = 0;
    var tipo_dado = 'estimativa';

    // Tentar extrair de publicoPresencial
    if (publicoPresencial && publicoPresencial.historico) {
      publico = extractNumber(publicoPresencial.historico);
      tipo_dado = publicoPresencial.tipo_dado || 'estimativa';
    }

    // Fallback: facts "Público esperado"
    if (publico === 0 && facts && Array.isArray(facts)) {
      for (var i = 0; i < facts.length; i++) {
        var fact = facts[i];
        if (fact && fact.label && /p[uú]blico\s*esperado/i.test(fact.label)) {
          publico = extractNumber(fact.value);
          break;
        }
      }
    }

    if (publico <= 0) return [];

    var placement = PLACEMENT[category] || 1.00;
    var touchpoints = 3; // exposições médias por participante
    var impressions = publico * touchpoints;
    var value = (impressions * CPM.presencial / 1000) * placement;

    return [{
      axis: 'presencial',
      publico: publico,
      tipo_dado: tipo_dado,
      touchpoints: touchpoints,
      impressions: Math.round(impressions),
      value: Math.round(value)
    }];
  }

  // ── EIXO 3: Broadcast (TV / Streaming) ────────────────────────────
  function calcBroadcast(facts, category) {
    if (!facts || !Array.isArray(facts)) return [];

    var transmissao = null;
    for (var i = 0; i < facts.length; i++) {
      var fact = facts[i];
      if (fact && fact.label && /transmiss[aã]o/i.test(fact.label)) {
        transmissao = fact.value;
        break;
      }
    }

    if (!transmissao) return [];

    var items = [];
    var placement = PLACEMENT[category] || 1.00;
    var val = String(transmissao).toLowerCase();

    // Detectar tipo de transmissão
    if (/tv\s*aberta/i.test(val) || /rede\s*aberta/i.test(val) || /globo|sbt|record|band/i.test(val)) {
      var viewers = 500000; // estimativa conservadora TV aberta
      var imp = viewers;
      items.push({
        axis: 'broadcast',
        tipo: 'TV Aberta',
        viewers: viewers,
        tipo_dado: 'estimativa',
        impressions: imp,
        value: Math.round((imp * CPM.tv_aberta / 1000) * placement)
      });
    }

    if (/tv\s*fechada|cabo|sportv|espn|bandSports/i.test(val)) {
      var viewersCabo = 150000;
      items.push({
        axis: 'broadcast',
        tipo: 'TV Fechada',
        viewers: viewersCabo,
        tipo_dado: 'estimativa',
        impressions: viewersCabo,
        value: Math.round((viewersCabo * CPM.tv_fechada / 1000) * placement)
      });
    }

    if (/stream|youtube|twitch|online|digital/i.test(val)) {
      var viewersStream = 100000;
      items.push({
        axis: 'broadcast',
        tipo: 'Streaming',
        viewers: viewersStream,
        tipo_dado: 'estimativa',
        impressions: viewersStream,
        value: Math.round((viewersStream * CPM.streaming / 1000) * placement)
      });
    }

    // Se mencionou transmissão mas não caiu em nenhuma regex específica
    if (items.length === 0 && transmissao) {
      items.push({
        axis: 'broadcast',
        tipo: 'Transmissão',
        viewers: 100000,
        tipo_dado: 'estimativa',
        impressions: 100000,
        value: Math.round((100000 * CPM.streaming / 1000) * placement)
      });
    }

    return items;
  }

  // ── Calcular confiança ────────────────────────────────────────────
  function calcConfidence(breakdown) {
    var realSources = 0;
    var totalSources = 0;

    for (var i = 0; i < breakdown.length; i++) {
      totalSources++;
      if (breakdown[i].tipo_dado === 'real') {
        realSources++;
      }
    }

    if (totalSources >= 3 && realSources >= 2) return 'alta';
    if (totalSources >= 2) return 'media';
    return 'estimativa';
  }

  // ── Formatar valor em BRL ─────────────────────────────────────────
  function formatBRL(value) {
    if (!value || value <= 0) return 'R$ 0';
    // Formato brasileiro: R$ 125.000
    var str = Math.round(value).toString();
    var parts = [];
    for (var i = str.length; i > 0; i -= 3) {
      parts.unshift(str.slice(Math.max(0, i - 3), i));
    }
    return 'R$ ' + parts.join('.');
  }

  // ── Formatar valor compacto ───────────────────────────────────────
  function formatCompact(value) {
    if (!value || value <= 0) return 'R$ 0';
    if (value >= 1000000) return 'R$ ' + (value / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (value >= 1000) return 'R$ ' + Math.round(value / 1000) + 'K';
    return 'R$ ' + Math.round(value);
  }

  // ══════════════════════════════════════════════════════════════════
  //  API PÚBLICA
  // ══════════════════════════════════════════════════════════════════

  window.EMVCalc = {

    /**
     * Calcula o EMV de uma oportunidade.
     *
     * @param {Object} oppData
     *   - publicoCanais:     {Object} canais digitais (formato Supabase)
     *   - publicoPresencial: {Object} público presencial
     *   - facts:             {Array}  [{ label, value }]
     *   - category:          {string} categoria do evento
     * @returns {{ total: number, breakdown: Array, confidence: string }}
     */
    calculate: function (oppData) {
      if (!oppData) return { total: 0, breakdown: [], confidence: 'estimativa' };

      var cat = oppData.category || '';

      var digital    = calcDigital(oppData.publicoCanais, cat);
      var presencial = calcPresencial(oppData.publicoPresencial, oppData.facts, cat);
      var broadcast  = calcBroadcast(oppData.facts, cat);

      var breakdown = digital.concat(presencial).concat(broadcast);

      var total = 0;
      for (var i = 0; i < breakdown.length; i++) {
        total += breakdown[i].value || 0;
      }

      return {
        total: Math.round(total),
        breakdown: breakdown,
        confidence: calcConfidence(breakdown)
      };
    },

    formatBRL: formatBRL,
    formatCompact: formatCompact
  };

})();
