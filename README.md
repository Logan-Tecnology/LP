# Landing Page — Logan TI para Advocacia

Landing page de alta conversão, rápida, moderna, responsiva e pronta para tráfego qualificado de Google Ads, desenvolvida sob medida para a **Logan Technology** com foco no nicho de **Escritórios de Advocacia**.

---

## 🎯 Proposta de Valor e Posicionamento
- **Empresa:** Logan Technology (29 anos de experiência e inovação tecnológica desde 1997).
- **Conceito:** *"Sua advocacia depende da tecnologia. Sua TI não pode depender da sorte."*
- **Oferta de Entrada:** Diagnóstico de TI para Escritórios de Advocacia.
- **Diferencial de Comunicação:** Domínio das necessidades tecnológicas de bancas jurídicas (Microsoft 365, certificados digitais A1/A3, tokens, navegadores de tribunais, estações de trabalho e suporte a ambientes para PJe, ePROC, Projudi e SAJ sem falsas promessas de controle dos tribunais).
- **Diretriz Visual:** Cores sólidas corporativas (azul marinho, grafite e branco), sem degradês, sem clichês jurídicos (balanças, martelos) e sem provas sociais fictícias.

---

## 🏗️ Estrutura do Projeto

```text
/docker/logan/LP/
├── assets/ -> public/assets/
├── data/
│   └── leads.jsonl           # Armazenamento persistente seguro dos leads recebidos
├── public/
│   ├── assets/
│   │   ├── branding/         # Logomarcas oficiais Logan e favicon SVG
│   │   ├── css/
│   │   │   ├── variables.css # Cores sólidas, espaçamentos, tipografia (Inter)
│   │   │   ├── base.css      # Reset, acessibilidade, container
│   │   │   ├── components.css# Botões, cards, checklist, dashboard simulado, form
│   │   │   └── sections.css  # Hero, Problema, Impacto, Segurança, Soluções, FAQ
│   │   └── js/
│   │       ├── config.js     # Configuração centralizada (WhatsApp, endpoints)
│   │       ├── tracking.js   # Atribuição de UTMs, GCLID e eventos GA4/GTM
│   │       ├── form.js       # Validação, máscara telefônica, estados do form
│   │       ├── accordion.js  # FAQ acessível (ARIA e teclado)
│   │       ├── mobile-bar.js # Barra de conversão mobile inferior pós-hero
│   │       └── main.js       # Inicialização global, modais LGPD e links
│   ├── index.html            # Página HTML5 semântica completa com Schema.org
│   ├── robots.txt            # Diretivas de SEO e indexação
│   └── sitemap.xml           # Sitemap estruturado
├── .env                      # Variáveis de ambiente locais
├── .env.example              # Exemplo de configuração
├── .gitignore
├── Dockerfile                # Build Node.js Alpine seguro (não-root)
├── docker-compose.yml        # Orquestração do container
├── package.json
├── server.js                 # Servidor HTTP, API /api/lead e webhook CRM
└── README.md
```

---

## 🚀 Como Executar

### Opção 1: Execução Direta com Node.js
```bash
# Iniciar o servidor na porta 3055
node server.js

# Ou em modo desenvolvimento com auto-reload (Node 18+)
npm run dev
```

Acesse no navegador: `http://localhost:3055`

### Opção 2: Execução com Docker Compose
```bash
# Subir o container em background
docker compose up -d --build

# Verificar logs
docker compose logs -f

# Parar o serviço
docker compose down
```

---

## 📊 Rastreamento & Google Ads (CRO)

### 1. Captura de Atribuição (UTMs & GCLID)
O motor de tracking armazena automaticamente em `sessionStorage` os parâmetros:
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`
- `gclid`

Estes dados acompanham a navegação do usuário e são enviados anexados à submissão do formulário.

### 2. Eventos de Conversão Configurados
| Evento | Momento do Disparo |
| :--- | :--- |
| `form_start` | Primeiro foco/interação com qualquer campo do formulário |
| `form_submit` | Clique de submissão do formulário (validação) |
| `generate_lead` | **Apenas** após a resposta `201 OK` confirmada pelo servidor |
| `whatsapp_click` | Clique nos botões de WhatsApp (flutuante, header, mobile bar) |
| `diagnostic_click` | Clique nos botões de CTA que direcionam ao diagnóstico |
| `cta_click` | Cliques em botões de contato secundários |

---

## ⚙️ Variáveis de Ambiente (`.env`)

| Variável | Padrão | Descrição |
| :--- | :--- | :--- |
| `PORT` | `3055` | Porta TCP do servidor |
| `NODE_ENV` | `production` | Ambiente de execução |
| `WHATSAPP_NUMBER` | `5511999999999` | Telefone com DDI e DDD para abertura direta de conversa |
| `LEAD_WEBHOOK_URL` | *(vazio)* | URL do Webhook do CRM (ex: n8n, RD Station, HubSpot) |
| `GTM_ID` | *(vazio)* | ID do contêiner Google Tag Manager (ex: `GTM-XXXXXX`) |
| `GA4_ID` | *(vazio)* | ID da propriedade do Google Analytics 4 (ex: `G-XXXXXX`) |

---

## 🔒 Armazenamento de Leads & LGPD
- Todas as solicitações enviadas pelo formulário são gravadas em formato append-only em `data/leads.jsonl`, garantindo que nenhum lead seja perdido mesmo se o CRM ou conexão externa estiver indisponível.
- O formulário conta com checkbox obrigatório de consentimento LGPD e modal acessível com a Política de Privacidade.
