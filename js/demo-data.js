/**
 * demo-data.js — Dados centralizados para o modo demonstração (onboarding interno).
 *
 * MANUTENÇÃO: Ao adicionar uma feature que usa dados do banco,
 * adicione dados de exemplo aqui no objeto DEMO correspondente
 * (DEMO.marca ou DEMO.detentor) com a mesma estrutura que o banco real usará.
 *
 * Include AFTER core.js:
 *   <script src="js/core.js"></script>
 *   <script src="js/demo-data.js"></script>
 */

window.DEMO = {

  // ══════════════════════════════════════
  //  MARCA (Brand) — Perspectiva do patrocinador
  // ══════════════════════════════════════
  marca: {
    user: {
      nome: 'Nike Brasil',
      email: 'contato@nikebrasil.com',
      responsavel: 'Carlos Mendes',
      cnpj: '12.345.678/0001-00',
      segmento: 'Esportes',
      telefone: '(11) 3456-7890',
      site: 'https://nike.com.br',
      descricao: 'Marca líder mundial em artigos esportivos, moda atlética e inovação em performance.',
      cargo: 'Diretor de Marketing'
    },
    propostas: [],
    kpis: {
      oportunidades_ativas: 12,
      propostas_enviadas: 5,
      deals_fechados: 2,
      investimento_total: 130000
    }
  },

  // ══════════════════════════════════════
  //  DETENTOR (Rights Holder) — Perspectiva do organizador
  // ══════════════════════════════════════
  detentor: {
    user: {
      nome: 'Isaac Gabriel',
      email: 'isaac@radar.com',
      telefone: '(11) 98765-4321',
      cargo: 'Diretor Executivo'
    },
    empresa: {
      nome: 'Instituto Esportivo SP',
      cnpj: '12.345.678/0001-90',
      segmento: 'Esporte',
      telefone: '(11) 99999-0000',
      endereco: 'Av. Paulista, 1000 — São Paulo, SP',
      site: 'https://institutoesportivo.com.br',
      descricao: 'Instituto dedicado à promoção do esporte de alto rendimento, organizador de maratonas e eventos esportivos em todo o Brasil.'
    },
    oportunidades: [
      { id:1, titulo:'Maratona Internacional SP 2026', categoria:'Esporte',  status:'publicada', interesses:4, criadaEm:'18 mar 2026', cidade:'São Paulo, SP', data:'Abr 2026' },
      { id:2, titulo:'Naming Rights — Arena Esportiva', categoria:'Esporte',  status:'publicada', interesses:6, criadaEm:'20 mar 2026', cidade:'São Paulo, SP', data:'Jun 2026' },
      { id:3, titulo:'Festival Cultural do Recife',    categoria:'Cultura',  status:'rascunho',  interesses:0, criadaEm:'21 mar 2026', cidade:'Recife, PE',    data:'Jul 2026' }
    ],
    negociacoes: [
      { id:1,  opp_id:1, opp:'Maratona Internacional SP 2026', marca:'Nike Brasil',    cota:'Patrocinador Premium',  assunto:'Quero negociar esta cota',                        enviadaEm:'15/03/2026', status:'pendente',  statusLabel:'Pendente',
        thread: [
          { autor:'marca', nome:'Nike Brasil', texto:'Temos grande interesse em fortalecer nossa presença neste evento. Gostaríamos de entender os entregáveis e condições de pagamento.', data:'15/03 · 10:22' }
        ],
        contrapartidas: [
          { id:1, descricao:'Logo na largada e chegada',  categoria:'branding', valor:18000, prazo:'20/04/2026', status:'proposta', propostoPor:'marca' },
          { id:2, descricao:'Estande de ativação 4m²',    categoria:'ativacao', valor:12000, prazo:'20/04/2026', status:'proposta', propostoPor:'detentor' }
        ]
      },
      { id:2,  opp_id:1, opp:'Maratona Internacional SP 2026', marca:'Adidas Brasil',  cota:'Patrocinador Oficial', assunto:'Gostaria de fazer uma proposta',                   enviadaEm:'14/03/2026', status:'aceita',    statusLabel:'Aceita',
        thread: [
          { autor:'marca',    nome:'Adidas Brasil',          texto:'Podemos oferecer contrapartidas adicionais de mídia digital.', data:'14/03 · 09:00' },
          { autor:'detentor', nome:'Maratona Internacional', texto:'Olá Adidas! Sua proposta foi aceita. Vamos alinhar os detalhes do contrato.', data:'15/03 · 11:30' }
        ],
        contrapartidas: [
          { id:1, descricao:'Branding nas camisetas oficiais', categoria:'branding', valor:25000, prazo:'20/04/2026', status:'aceita',   propostoPor:'marca' },
          { id:2, descricao:'Cobertura digital (5 posts)',     categoria:'digital',  valor:10000, prazo:'01/05/2026', status:'aceita',   propostoPor:'detentor' },
          { id:3, descricao:'Totem 3D no expo center',         categoria:'ativacao', valor: 8000, prazo:'20/04/2026', status:'recusada', propostoPor:'marca' }
        ]
      },
      { id:3,  opp_id:1, opp:'Maratona Internacional SP 2026', marca:'Gatorade',       cota:'Cota Saúde',           assunto:'Tenho interesse, mas preciso de mais informações', enviadaEm:'13/03/2026', status:'analise',   statusLabel:'Em análise',
        thread: [
          { autor:'marca', nome:'Gatorade', texto:'Gostaríamos de entender melhor o perfil de público e as cotas de ativação disponíveis na área de hidratação.', data:'13/03 · 14:10' }
        ],
        contrapartidas: [
          { id:1, descricao:'Posto de hidratação exclusivo', categoria:'ativacao', valor:15000, prazo:'20/04/2026', status:'proposta', propostoPor:'detentor' }
        ]
      },
      { id:4,  opp_id:1, opp:'Maratona Internacional SP 2026', marca:'New Balance',    cota:'Patrocinador Premium', assunto:'Quero negociar esta cota',                        enviadaEm:'12/03/2026', status:'pendente',  statusLabel:'Pendente',
        thread: [
          { autor:'marca', nome:'New Balance', texto:'Somos parceiros históricos de maratonas no Brasil e gostaríamos de manter essa tradição aqui.', data:'12/03 · 08:45' }
        ],
        contrapartidas: []
      },
      { id:5,  opp_id:1, opp:'Maratona Internacional SP 2026', marca:'Under Armour',   cota:'Patrocinador Oficial', assunto:'Gostaria de fazer uma proposta',                   enviadaEm:'11/03/2026', status:'recusada',  statusLabel:'Recusada',
        thread: [
          { autor:'marca',    nome:'Under Armour',           texto:'Gostaríamos de negociar esta cota. Temos flexibilidade em valores e ativações.', data:'11/03 · 16:00' },
          { autor:'detentor', nome:'Maratona Internacional', texto:'Agradecemos o interesse, mas a cota foi reservada para outro parceiro. Entraremos em contato em futuras edições.', data:'12/03 · 09:20' }
        ],
        contrapartidas: []
      },
      { id:6,  opp_id:2, opp:'Festival Cultura Viva 2026', marca:'Natura',        cota:'Patrocínio Cultural', assunto:'Quero entender as possibilidades',                enviadaEm:'10/03/2026', status:'pendente',  statusLabel:'Pendente',
        thread: [
          { autor:'marca', nome:'Natura', texto:'Temos interesse em associar nossa marca a eventos culturais de impacto. Quais são as possibilidades de ativação?', data:'10/03 · 11:55' }
        ],
        contrapartidas: [
          { id:1, descricao:'Logo no cenário principal', categoria:'branding', valor:20000, prazo:'10/06/2026', status:'proposta', propostoPor:'detentor' }
        ]
      },
      { id:7,  opp_id:2, opp:'Festival Cultura Viva 2026', marca:'Itaú Cultural',  cota:'Patrocínio Cultural', assunto:'Gostaria de fazer uma proposta',                  enviadaEm:'09/03/2026', status:'aceita',    statusLabel:'Aceita',
        thread: [
          { autor:'marca',    nome:'Itaú Cultural',         texto:'Buscamos parceiros alinhados ao nosso posicionamento cultural. Podemos conversar sobre o projeto?', data:'09/03 · 14:30' },
          { autor:'detentor', nome:'Festival Cultura Viva', texto:'Com certeza! A proposta do Itaú Cultural está aprovada. Vamos agendar uma reunião de alinhamento.', data:'10/03 · 10:05' }
        ],
        contrapartidas: [
          { id:1, descricao:'Naming rights do palco principal', categoria:'branding', valor:40000, prazo:'10/06/2026', status:'aceita', propostoPor:'detentor' },
          { id:2, descricao:'Cobertura no app do festival',     categoria:'digital',  valor:15000, prazo:'01/06/2026', status:'aceita', propostoPor:'marca' }
        ]
      },
      { id:8,  opp_id:2, opp:'Festival Cultura Viva 2026', marca:'Vivo',          cota:'Naming Rights',       assunto:'Quero entender as possibilidades',                enviadaEm:'08/03/2026', status:'analise',   statusLabel:'Em análise',
        thread: [
          { autor:'marca',    nome:'Vivo',                  texto:'Gostaríamos de explorar o naming rights do festival. Qual o valor e os entregáveis previstos?', data:'08/03 · 15:00' },
          { autor:'detentor', nome:'Festival Cultura Viva', texto:'Olá Vivo! Estamos preparando um dossiê completo sobre o naming rights. Enviaremos em breve.', data:'09/03 · 09:40' }
        ],
        contrapartidas: [
          { id:1, descricao:'Naming rights + cobertura digital', categoria:'midia', valor:60000, prazo:'10/06/2026', status:'proposta', propostoPor:'detentor' }
        ]
      },
      { id:9,  opp_id:2, opp:'Festival Cultura Viva 2026', marca:'Magazine Luiza', cota:'Patrocínio Cultural', assunto:'Tenho interesse, mas preciso de mais informações', enviadaEm:'07/03/2026', status:'pendente',  statusLabel:'Pendente',
        thread: [
          { autor:'marca', nome:'Magazine Luiza', texto:'Precisamos entender o perfil do público e os dados de edições anteriores antes de avançar.', data:'07/03 · 12:20' }
        ],
        contrapartidas: []
      },
      { id:10, opp_id:2, opp:'Festival Cultura Viva 2026', marca:'Ambev',         cota:'Naming Rights',       assunto:'Outro assunto',                                   enviadaEm:'06/03/2026', status:'pendente',  statusLabel:'Pendente',
        thread: [
          { autor:'marca', nome:'Ambev', texto:'Podemos conversar sobre uma parceria diferenciada? Temos interesse em uma ativação exclusiva de bebidas.', data:'06/03 · 17:05' }
        ],
        contrapartidas: []
      }
    ],
    kpis: {
      oportunidades_publicadas: 2,
      negociacoes_ativas: 10,
      deals_fechados: 2,
      receita_total: 95000
    }
  },

  // ══════════════════════════════════════
  //  CATÁLOGO PÚBLICO — usado em oportunidades.html e dashboard-marca.html
  // ══════════════════════════════════════
  catalog: [
    { id: 1,  title: 'Maratona Internacional de Sao Paulo', org: 'SP Marathon Club', orgInitials: 'SM', category: 'Esporte',      city: 'Sao Paulo',      region: 'Sao Paulo',    date: 'Jan 2027', price: 50000, desc: 'Patrocinio oficial da maior maratona da America Latina, com visibilidade para 35 mil atletas e cobertura nacional de midia.',
      images: [
        'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80',
        'https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?w=800&q=80',
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80'
      ]
    },
    { id: 2,  title: 'Festival de Verao Salvador',          org: 'Verao Producoes',  orgInitials: 'VP', category: 'Musica',        city: 'Salvador',       region: 'Bahia',        date: 'Fev 2027', price: 80000, desc: 'Associe sua marca ao maior festival de verao do Brasil. 3 dias de shows com publico de 120 mil pessoas.',
      images: [
        'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
        'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80'
      ]
    },
    { id: 3,  title: 'Expo Tech Brasil',                    org: 'TechConf BR',      orgInitials: 'TB', category: 'Tecnologia',    city: 'Sao Paulo',      region: 'Sao Paulo',    date: 'Mar 2027', price: 35000, desc: 'Feira de tecnologia e inovacao com mais de 50 mil visitantes e 200 expositores. Ideal para marcas de tech.',
      images: [
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
        'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80',
        'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&q=80'
      ]
    },
    { id: 4,  title: 'Campeonato de Surf Floripa',          org: 'Surf SC',          orgInitials: 'SS', category: 'Esporte',       city: 'Florianopolis',  region: 'Parana',       date: 'Dez 2026', price: 25000, desc: 'Campeonato de surf com etapa nacional. Publico jovem e engajado com lifestyle e sustentabilidade.',
      images: [
        'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80',
        'https://images.unsplash.com/photo-1455264745730-cb3b76250dd8?w=800&q=80',
        'https://images.unsplash.com/photo-1519092437468-9c52af2af38c?w=800&q=80'
      ]
    },
    { id: 5,  title: 'Podcast Tech Daily',                  org: 'Media Lab',        orgInitials: 'ML', category: 'Midia Digital', city: 'Online',         region: 'Online',       date: 'Continuo', price: 15000, desc: 'Podcast diario sobre tecnologia com 500 mil ouvintes mensais. Ativacao via branded content e mencoes.',
      images: [
        'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80',
        'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80'
      ]
    },
    { id: 6,  title: 'Arena Music Curitiba',                org: 'Arena Live',       orgInitials: 'AL', category: 'Musica',        city: 'Curitiba',       region: 'Parana',       date: 'Abr 2027', price: 60000, desc: 'Casa de shows com programacao semanal. Naming rights e presenca de marca em 200+ eventos anuais.',
      images: [
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
        'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80',
        'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80'
      ]
    },
    { id: 7,  title: 'Mostra Cultural Recife',              org: 'Cultura PE',       orgInitials: 'CP', category: 'Cultura',       city: 'Recife',         region: 'Bahia',        date: 'Mai 2027', price: 40000, desc: 'Festival cultural com exposicoes, teatro e gastronomia. Publico qualificado de classes A e B.' },
    { id: 8,  title: 'Liga Brasileira de eSports',          org: 'ESL Brasil',       orgInitials: 'EB', category: 'Tecnologia',    city: 'Online',         region: 'Online',       date: 'Continuo', price: 70000, desc: 'Liga profissional de eSports com audiencia de 2 milhoes de views mensais em streaming.' },
    { id: 9,  title: 'Corrida de Rua BH',                   org: 'Run MG',           orgInitials: 'RM', category: 'Esporte',       city: 'Belo Horizonte', region: 'Minas Gerais', date: 'Jun 2027', price: 20000, desc: 'Corrida de rua com 8 mil participantes. Excelente para ativacoes de saude e bem-estar.' },
    { id: 10, title: 'Feira Gastronomica SP',               org: 'Gourmet BR',       orgInitials: 'GB', category: 'Cultura',       city: 'Sao Paulo',      region: 'Sao Paulo',    date: 'Jul 2027', price: 30000, desc: 'Feira gastronomica com chefs renomados. 40 mil visitantes em 5 dias de evento.' }
  ],

  // Taxa padrão da plataforma (20%)
  plataforma_taxa: 0.20
};

// Catálogo público de oportunidades — disponível independente do modo demo.
// Usado em: dashboard-marca.html (Explorar Oportunidades), oportunidades.html
window.CATALOG = window.DEMO.catalog;
