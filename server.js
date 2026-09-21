/**
 * LOGAN TECHNOLOGY - SERVER & LEAD RECEIVER
 * Servidor HTTP de alta performance (sem dependências externas obrigatórias),
 * com validação no backend, persistência segura de leads (data/leads.jsonl)
 * e encaminhamento para Webhook/CRM configurável.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.env.PORT || '3055', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.jsonl');
const WEBHOOK_URL = process.env.LEAD_WEBHOOK_URL || '';

// Garante que o diretório de dados exista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=UTF-8',
  '.txt': 'text/plain; charset=UTF-8'
};

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

function handleStaticFile(req, res, parsedUrl) {
  let reqPath = parsedUrl.pathname;
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  // Previne Directory Traversal
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Cache-control inteligente: 1 dia para estáticos com versão, no-cache para html
    const cacheHeader = ext === '.html' ? 'no-cache' : 'public, max-age=86400';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': cacheHeader,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

async function forwardToWebhook(leadRecord) {
  if (!WEBHOOK_URL) return;

  try {
    const parsed = new URL(WEBHOOK_URL);
    const client = parsed.protocol === 'https:' ? require('https') : require('http');
    const postData = JSON.stringify(leadRecord);

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };

    const webhookReq = client.request(options, (webhookRes) => {
      console.log(`[Webhook] Resposta recebida: status ${webhookRes.statusCode}`);
    });

    webhookReq.on('error', (err) => {
      console.error('[Webhook Error] Falha ao enviar para o CRM:', err.message);
    });

    webhookReq.write(postData);
    webhookReq.end();
  } catch (err) {
    console.error('[Webhook Error] URL inválida ou falha na requisição:', err.message);
  }
}

function handleLeadSubmission(req, res) {
  let body = '';

  req.on('data', chunk => {
    body += chunk;
    if (body.length > 1e6) { // Proteção contra payload gigante (1MB)
      req.destroy();
    }
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);

      // Validação sanitizada no Backend
      const nome = (data.nome || '').trim();
      const escritorio = (data.escritorio || '').trim();
      const email = (data.email || '').trim();
      const whatsapp = (data.whatsapp || '').trim();
      const usuarios = (data.usuarios || '').trim();
      const necessidade = (data.necessidade || '').trim();
      const observacoes = (data.observacoes || '').trim();
      const lgpd = !!data.lgpd_consentimento;

      if (!nome || !escritorio || !email || !whatsapp || !usuarios || !necessidade || !lgpd) {
        return sendJsonResponse(res, 400, {
          success: false,
          message: 'Todos os campos obrigatórios e o aceite da LGPD devem ser preenchidos.'
        });
      }

      // Validação de formato de e-mail
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendJsonResponse(res, 400, {
          success: false,
          message: 'Endereço de e-mail corporativo inválido.'
        });
      }

      // Validação de dígitos de WhatsApp
      const phoneDigits = whatsapp.replace(/\D/g, '');
      if (phoneDigits.length < 10 || phoneDigits.length > 11) {
        return sendJsonResponse(res, 400, {
          success: false,
          message: 'Número de WhatsApp inválido. Inclua DDD.'
        });
      }

      const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      const leadRecord = {
        leadId,
        nome,
        escritorio,
        email,
        whatsapp,
        usuarios,
        necessidade,
        observacoes,
        lgpd_consentimento: lgpd,
        attribution: data.attribution || {},
        metadata: {
          clientIp,
          userAgent,
          serverTimestamp: new Date().toISOString()
        }
      };

      // Persistência em arquivo JSONL local (garantia de retenção segura)
      fs.appendFile(LEADS_FILE, JSON.stringify(leadRecord) + '\n', (fsErr) => {
        if (fsErr) {
          console.error('[Leads Storage Error]:', fsErr);
        }
      });

      // Encaminha para Webhook/CRM se configurado
      forwardToWebhook(leadRecord);

      console.log(`[Lead Registrado] ID: ${leadId} | Escritório: ${escritorio} | Usuários: ${usuarios}`);

      return sendJsonResponse(res, 201, {
        success: true,
        leadId,
        message: 'Solicitação de diagnóstico recebida com sucesso pela equipe Logan.'
      });
    } catch (err) {
      console.error('[Lead Parse Error]:', err);
      return sendJsonResponse(res, 400, {
        success: false,
        message: 'Formato de requisição inválido.'
      });
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // Healthcheck endpoint
  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    return sendJsonResponse(res, 200, {
      status: 'ok',
      service: 'logan-lp-advocacia',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }

  // API Endpoint para captação de leads
  if (req.method === 'POST' && parsedUrl.pathname === '/api/lead') {
    return handleLeadSubmission(req, res);
  }

  // Arquivos estáticos
  if (req.method === 'GET' || req.method === 'HEAD') {
    return handleStaticFile(req, res, parsedUrl);
  }

  // Método não suportado
  res.writeHead(405, { 'Content-Type': 'text/plain; charset=UTF-8' });
  res.end('405 Method Not Allowed');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(` Logan Technology - Landing Page TI para Advocacia`);
  console.log(` Servidor rodando em http://0.0.0.0:${PORT}`);
  console.log(` Healthcheck: http://0.0.0.0:${PORT}/health`);
  console.log(` Armazenamento de leads: ${LEADS_FILE}`);
  console.log(` Webhook CRM configurado: ${WEBHOOK_URL ? 'SIM' : 'NENHUM (modo local ativo)'}`);
  console.log(`====================================================`);
});

// Encerramento limpo
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Servidor encerrado gracefully.');
    process.exit(0);
  });
});
