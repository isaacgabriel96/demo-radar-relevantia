# Surface Map — Radar Relevantia MVP

> Mapa completo da superfície de teste para QA multi-agente.
> Consolida tudo descoberto na fase de discovery: stack, rotas, auth, RLS, schemas, Edge Functions, validações e limitações conhecidas.

**Gerado em:** 2026-04-18
**Fonte:** `specs/ARCHITECTURE.md` + `specs/features/*.spec.md` + `specs/data-models/*.schema.md` + `js/core.js` + `js/sanitize.js` + inspeção direta do Supabase (project `bzckerazidgrkbpgqqee`)

---

## 1. Stack & Infraestrutura

| Camada | Tecnologia |
|--------|------------|
| Frontend | HTML5 + JavaScript vanilla + Tailwind CSS (via CDN) |
| Backend | Supabase BaaS (`bzckerazidgrkbpgqqee.supabase.co`) — Postgres + Auth + Storage + Edge Functions (Deno) |
| Hospedagem | Vercel (team `team_tJHyW9fsaxVfnvpanwadwDPU`) |
| SDK Supabase | `@supabase/supabase-js` v2 via CDN (`esm.sh`) |
| Email | SMTP configurado no Supabase (templates no Dashboard) |

### Arquivos-raiz do MVP

```
/MVP/
├── index.html                     # Landing pública
├── login.html                     # Login unificado (3 perfis)
├── esqueci-senha.html             # Solicita reset de senha
├── nova-senha.html                # Redefine senha via token do hash
├── cadastro-marca.html            # Waitlist (4 steps)
├── cadastro-detentor.html         # Waitlist (single-page)
├── dashboard-marca.html           # Home marca
├── dashboard-detentor.html        # Home detentor
├── admin.html                     # Painel Relevantia Admin
├── criar-oportunidade.html        # Criação/edição de oportunidade
├── oportunidade.html              # Visualização pública (?@slug/opp-slug)
├── negociar.html                  # Negociação marca ↔ detentor
├── catalogo.html                  # Listagem de oportunidades públicas
├── js/
│   ├── core.js                    # Supabase client, session API, negociações helpers
│   ├── sanitize.js                # Validações e sanitização (email, CNPJ, tel, URL, arquivos)
│   └── shared-state.js            # Helpers cross-tab/localStorage
└── logos/
    ├── 5.png                      # Wordmark branca (fundo escuro)
    ├── logo-dark.svg, logo-light.svg
```

### Credenciais no frontend (by design)

- `SUPABASE_URL` e `SUPABASE_KEY` (anon JWT) são **públicos**, embutidos em `js/core.js:15-16`.
- Segurança depende 100% de **RLS no Postgres** — não há proxy/backend custom além das Edge Functions.
- **Service role key** NUNCA está no frontend — só dentro de Edge Functions.

---

## 2. Rotas / Páginas

### Públicas (sem auth)

| Rota | Finalidade | Observações |
|------|------------|-------------|
| `index.html` | Landing | Links para cadastros e login |
| `login.html` | Login unificado 3-perfis | Rate limiter localStorage (5 tentativas / 30s) |
| `esqueci-senha.html` | Solicita reset | Chama Edge Function `send-password-reset` |
| `nova-senha.html` | Redefine senha | Lê `#access_token` do hash; PUT `/auth/v1/user` |
| `cadastro-marca.html` | Waitlist marca | 4 steps, FREE_DOMAINS bloqueados |
| `cadastro-detentor.html` | Waitlist detentor | Single-page, codigo_acesso obrigatório |
| `oportunidade.html` | View pública | URL `?@perfil-slug/opp-slug` |
| `catalogo.html` | Lista pública | `ativo=true AND visibilidade != 'convidadas'` |

### Autenticadas

| Rota | Perfil exigido | Fonte de verdade |
|------|----------------|-------------------|
| `dashboard-marca.html` | `user_metadata.tipo === 'brand'` | `requireAuth('brand')` em `core.js` |
| `dashboard-detentor.html` | `user_metadata.tipo === 'rightsholder'` | `requireAuth('rightsholder')` |
| `admin.html` | `user_metadata.tipo === 'admin'` | `requireAuth('admin')` |
| `criar-oportunidade.html` | `rightsholder` | Edição via `sessionStorage.edit_opp` |
| `negociar.html` | `brand` ou `rightsholder` (participante) | Validação por `negociacoes.marca_id / detentor_id` |

---

## 3. Modelo de Auth (3 perfis)

### 3.1 Storage por perfil (localStorage)

```js
SESSION_KEYS = {
  rightsholder: 'sb_detentor_session',
  brand:        'sb_marca_session',
  admin:        'sb_admin_session',
}
```

**Consequência:** 3 perfis podem estar logados simultaneamente no mesmo browser (abas paralelas), com sessões isoladas.

### 3.2 Dual Auth Pattern

- **Marca/Detentor:** SDK-first (`supabase.auth.signInWithPassword`) → fallback para fetch manual se SDK falhar.
- **Admin:** APENAS fetch manual (`POST /auth/v1/token?grant_type=password`) — nunca passa pelo SDK.

### 3.3 Cascade de session (3 níveis)

Definido em `core.js`:

1. **SDK session** (in-memory, `supabase.auth.getSession()`)
2. **Legacy localStorage** (`sb_<role>_session`) — síncrono via `getSession(role)`
3. **Async refresh** (`getSessionAsync` com AbortController 5s timeout, linhas 88-95)

### 3.4 `restoreSessionToSDK()`

Auto-invocado no load de `core.js:256`. Pega sessão legacy do localStorage e injeta no SDK para queries RLS-protected funcionarem.

### 3.5 `requireAuth(role, redirectTo)`

Valida:
- Token válido e não expirado
- `user.user_metadata.tipo === role`
- Se falhar → redireciona para `redirectTo` (geralmente `login.html`)

### 3.6 Demo mode

**PERMANENTEMENTE DESABILITADO** — não existe bypass em produção.

---

## 4. Fluxos de cadastro

### 4.1 Cadastro Marca (4 steps)

| Step | Campos | Validação chave |
|------|--------|-----------------|
| 1 | firstName, lastName, email, phone, cargo, invite-code | `validateEmail` + **FREE_DOMAINS blocklist** + `validatePhone` (10-13 dígitos) + valida `codigos_convite` se preenchido |
| 2 | company (search-or-create), cnpj, setor | `validateCNPJ` (checksum completo mod-11) |
| 3 | perfil_consumo, objetivos (1-3), orcamento | Hard limit 3 objetivos |
| 4 | categorias (≥1) | — |

**FREE_DOMAINS (17 domínios bloqueados):** gmail.com, hotmail.com, yahoo.com, yahoo.com.br, outlook.com, live.com, aol.com, icloud.com, mail.com, protonmail.com, zoho.com, yandex.com, gmx.com, uol.com.br, bol.com.br, terra.com.br, ig.com.br, globo.com, r7.com.

**Submissão:** `INSERT marcas_waitlist ... status='pendente'`. Conta Auth criada depois pelo admin via Edge Function `create-user-and-send-access`.

### 4.2 Cadastro Detentor (single-page)

Divergências-chave vs marca:

| Aspecto | Marca | Detentor |
|---------|-------|----------|
| Steps | 4 | 1 (single-page) |
| FREE_DOMAINS | Bloqueia | **NÃO bloqueia** |
| Código convite/acesso | Opcional (`codigos_convite`) | **Obrigatório** (`codigo_acesso`) |
| Validação código | On-submit | Real-time com `throttle(800ms)` |
| Telefone | BR-only | **14 países** (seletor) |
| Cidade/Estado | Texto livre | **Dropdown cidade dinâmico por estado** |

**Submissão:** `INSERT detentores_waitlist ... status='pendente'`.

---

## 5. Recuperação de senha

### 5.1 Solicitação (`esqueci-senha.html`)

```
POST {SUPABASE_URL}/functions/v1/send-password-reset
Headers: Authorization: Bearer {SUPABASE_KEY}
Body: { email }
```

**Security by design:** SEMPRE retorna sucesso ao usuário (mesmo se 4xx/email inexistente) → previne enumeração de emails.

### 5.2 Email enviado

Link no formato:
```
{APP_URL}/nova-senha.html#access_token={JWT}&type=recovery&refresh_token={RT}
```

- Token no **hash** (não query string) → não vaza em logs/referrers.
- Expiração: 1 hora.

### 5.3 Redefinição (`nova-senha.html`)

```
PUT {SUPABASE_URL}/auth/v1/user
Headers:
  apikey: {SUPABASE_KEY}
  Authorization: Bearer {access_token_do_hash}
Body: { password: novaSenha }
```

Após sucesso: redirect para `login.html` em 2500ms.

### 5.4 Gaps conhecidos

- **Sem rate limiting no frontend** na solicitação de reset (depende da Edge Function).
- **Senha mínima 6 caracteres** — sem requisitos de complexidade (maiúscula/número/símbolo).

---

## 6. Tabelas Supabase (project `bzckerazidgrkbpgqqee`)

### 6.1 Core (3 perfis)

| Tabela | Propósito |
|--------|-----------|
| `auth.users` | Usuários (Supabase Auth) — `user_metadata.tipo` define perfil |
| `perfis` | Perfil estendido por usuário (slug, bio, avatar, banner) |
| `marcas_waitlist` | Cadastros pendentes de marca |
| `detentores_waitlist` | Cadastros pendentes de detentor |
| `codigos_convite` | Códigos opcionais para marca |
| `codigos_acesso` | Códigos obrigatórios para detentor |
| `embaixadores` | Programa de embaixadores |

### 6.2 Oportunidades & Negociação

| Tabela | Propósito |
|--------|-----------|
| `oportunidades` | Deals criados pelos detentores |
| `negociacoes` | Negociações marca ↔ detentor (21 cols) |
| `contrapartidas` | Itens de troca dentro da negociação |
| `rodadas_negociacao` | **Imutável** — histórico com snapshot JSONB |
| `mensagens` | Chat dentro da negociação |
| `contratos` | Contratos vinculados à negociação |
| `dados_juridicos` | Dados fiscais/jurídicos para contratos |

### 6.3 Financeiro

| Tabela | Propósito |
|--------|-----------|
| `pagamentos` | Registros de pagamento |
| `stripe_accounts` | Contas Stripe vinculadas |

### 6.4 Estados (enums)

**`oportunidades.status`:** `rascunho`, `publicada`
**`oportunidades.visibilidade`:** `publica`, `aprovacao`, `convidadas`
**`negociacoes.status`:** `pendente`, `analise`, `aceita`, `recusada`, `cancelada`
**`negociacoes.valor_deal_status`:** `proposto`, `aceito`, `recusado`

### 6.5 JSONB — `oportunidades`

| Campo | Estrutura |
|-------|-----------|
| `cotas_data` | Array de cotas `{nome, valor, beneficios[]}` |
| `incentivo_data` | `{lei, percentual, observacoes}` — leis: `rouanet`, `lie`, `paulo_gustavo`, `iss`, `icms`, `pronac`, `outras` |
| `redes_sociais` | `{instagram, tiktok, youtube, ...}` |
| `datas_evento` | Array `{data, horario_inicio, horario_fim}` |

---

## 7. RLS — Diff atual vs esperado

### 7.1 Vulnerabilidades críticas (4)

| Tabela | Problema | Impacto |
|--------|----------|---------|
| `embaixadores` | RLS permissivo ou inexistente | Vazamento de dados do programa |
| `perfis` | Leitura ampla | Perfis privados acessíveis |
| `marcas_waitlist` / `detentores_waitlist` | PII (email, tel, CNPJ) acessível sem role admin | **Enumeração de PII** |
| `pagamentos` | Sem restrição por participante | **Dados financeiros expostos** |

### 7.2 RLS corretos (padrão-referência)

- `negociacoes` — SELECT/UPDATE apenas por `marca_id = auth.uid()` OR `detentor_id = auth.uid()` OR role=`admin`
- `mensagens` — mesma lógica via JOIN com `negociacoes`
- `contrapartidas` — mesma lógica
- `oportunidades` — SELECT público se `ativo=true AND visibilidade != 'convidadas'`; INSERT/UPDATE apenas pelo `detentor_id`
- `contratos`, `dados_juridicos`, `stripe_accounts` — restritos ao dono

---

## 8. Edge Functions

### 8.1 `admin-actions`

Autenticada (JWT admin). Sub-actions via body:

| Action | Descrição |
|--------|-----------|
| `update-status` | Aprova/rejeita waitlist (`marcas_waitlist` ou `detentores_waitlist`) |
| `create-user-and-send-access` | Cria `auth.users` + envia email de boas-vindas após aprovação |

### 8.2 `send-password-reset`

Pública (anon key). Recebe `{email}`, dispara email via SMTP Supabase. Retorna 200/4xx mas frontend trata tudo como sucesso.

---

## 9. Oportunidades — 6 templates

Mapeamento categoria → template:

```js
CAT_TO_TPL = {
  'Celebridade':    'personalidade',
  'Evento':         'evento',
  'Esporte':        'esporte',
  'Midia Digital':  'midia',
  'Cultura':        'local',
  'Tecnologia':     'projeto',
}
```

### 9.1 Fluxos

| Ação | Status resultante | Validação |
|------|-------------------|-----------|
| `saveDraft` | `status='rascunho'`, `ativo=false` | Mínima |
| `publishOpportunity` | `status='publicada'`, `ativo=true` | Título + localização + ≥1 foto |

### 9.2 Upload post-save

Fotos e PDF enviados **após** INSERT/PATCH (precisam do `oppId`).

- **Fotos:** `oportunidades/{oppId}/{timestamp}-{index}.{ext}`
- **PDF:** `oportunidades/opp-{oppId}-midia-kit-{safeName}` (max 20MB)

### 9.3 Edição

Via `sessionStorage.edit_opp` — página `criar-oportunidade.html` detecta e pré-preenche.

---

## 10. Negociação — modelo 4-tabelas

### 10.1 Query canônica (`_negSelectQuery` em core.js:385-393)

```
*,
marca:marca_id(nome, empresa),
detentor:detentor_id(nome),
oportunidade:oportunidade_id(titulo, categoria),
contrapartidas(*),
mensagens(*)
```

**Para view do detentor:** substitui `marca:marca_id(nome,empresa),` por `detentor:detentor_id(nome,empresa),` (linha 449).

### 10.2 Rodadas imutáveis

Cada rodada de negociação grava **snapshot JSONB completo** do estado da proposta. Nunca sofre UPDATE — sempre INSERT.

### 10.3 Deals administrativos

`admin.html` filtra `negociacoes` por `contrato_url IS NOT NULL` para aba "Deals".

---

## 11. Baseline de segurança (`js/sanitize.js`)

| Função | Propósito |
|--------|-----------|
| `validateEmail(email)` | Formato RFC-simplificado |
| `validateCNPJ(cnpj)` | Checksum mod-11 completo (rejeita todos-iguais) |
| `validatePhone(phone)` | 10-13 dígitos |
| `validateURL(url)` | http(s) válida |
| `validateFileUpload(file, {maxSize, types})` | Tamanho + MIME |
| `escapeHtml(str)` | XSS básico |
| `rateLimiter(key, max, windowMs)` | localStorage-based (ex: `rr_rl_login` 5 tentativas / 30s) |

### 11.1 Rate limits existentes

| Chave | Escopo | Limite |
|-------|--------|--------|
| `rr_rl_login` | Login (todos perfis) | 5 tentativas / 30s |

### 11.2 Rate limits FALTANDO

- Solicitação de reset de senha (`esqueci-senha.html`)
- Submissão de waitlist (`cadastro-marca` e `cadastro-detentor`)
- Criação de oportunidade
- Envio de mensagem na negociação

---

## 12. Limitações conhecidas (de `ARCHITECTURE.md §Limitacoes`)

- **Sem realtime** — nenhuma subscription ativa
- **Sem sistema de notificações** in-app ou push
- **Sem paginação** em listas (dashboards, catálogo, admin)
- **Sem edição de perfil** após criação da conta
- **Sem CI/CD** configurado (deploy manual via Vercel)
- **Sem testes automatizados** pré-existentes
- **Sem i18n** (pt-BR hard-coded)
- **Sem modo escuro** consistente

---

## 13. Superfície de teste para QA multi-agente

### 13.1 Personas a simular

| Persona | Entry point | Happy path mínimo |
|---------|-------------|-------------------|
| **Marca** | `cadastro-marca.html` | Waitlist → aprovação admin → login → buscar oportunidade → negociar → aceitar contrato |
| **Detentor** | `cadastro-detentor.html` | Waitlist → aprovação admin → login → criar oportunidade (6 templates) → receber proposta → fechar deal |
| **Admin** | login direto | Revisar waitlists → aprovar → monitorar deals → rejeitar casos |

### 13.2 Cross-perfil

- Dados criados pelo detentor aparecem corretamente para marca no catálogo
- Mensagens bidirecionais na negociação
- Admin vê transações de ambos
- Isolamento RLS: marca A não vê negociações da marca B

### 13.3 Segurança / injeção

- Tentar SELECT direto em `marcas_waitlist` com token de outra marca (deve falhar por RLS — hoje passa por bug)
- Tentar UPDATE em `negociacoes` alheia
- Tentar acessar `pagamentos` de outro usuário
- Forjar `user_metadata.tipo` no JWT (deve ser rejeitado — metadata é do servidor)

### 13.4 UX / validações

- Email com domínio gratuito em cadastro-marca → bloqueado
- CNPJ inválido → rejeitado com checksum
- Publicar oportunidade sem foto → rejeita
- Reset de senha 3x em 10s → sem rate limiter, passa (gap)

---

## 14. Áreas de alto risco (priorizar testes)

1. **RLS de waitlists** — PII exposto (crítico)
2. **RLS de pagamentos** — dado financeiro (crítico)
3. **Edge Function `admin-actions`** — criação indevida de user com tipo manipulado
4. **Token de recovery** — reutilização, expiração, replay
5. **Upload de arquivos** — bypass de `validateFileUpload` (executáveis, SVG com script, tamanho)
6. **Injection em campos livres** — `bio`, `titulo`, `mensagens.texto` (escapeHtml aplicado?)
7. **State machine de negociação** — transições ilegais (`aceita` → `pendente`?)
8. **Rodadas_negociacao imutável** — conferir se há UPDATE possível

---

## 15. Convenções & IDs úteis

- **Supabase Project Ref:** `bzckerazidgrkbpgqqee`
- **Vercel Team:** `team_tJHyW9fsaxVfnvpanwadwDPU`
- **Storage bucket:** `oportunidades` (fotos e PDFs)
- **Auth user metadata canônico:**
  ```json
  { "tipo": "brand" | "rightsholder" | "admin", "nome": "...", "perfil_id": "..." }
  ```

---

## Próximos artefatos

1. `specs/qa/test-scenarios.yaml` — cenários executáveis por persona (+ cross-perfil + security)
2. `.claude/agents/orchestrator.md` + 7 sub-agentes especializados
3. `specs/qa/run-log/` — relatórios das passadas
