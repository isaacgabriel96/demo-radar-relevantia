/**
 * Vercel Function — Inicia upload resumível para a Gemini Files API
 * Radar Relevantia · /api/gemini-upload
 *
 * Fluxo (evita limite de 4.5MB do Vercel):
 *   1. Frontend POST aqui com { fileName, mimeType, fileSize }
 *   2. Este endpoint inicia o upload resumível na Gemini → devolve { uploadUrl, fileUri? }
 *   3. Frontend faz PUT direto para uploadUrl com o binário do arquivo
 *   4. Frontend aguarda estado ACTIVE e obtém fileUri
 *
 * Alternativa para arquivos ≤ 4MB: POST aqui com body binário (Content-Type: application/pdf)
 * e headers X-File-Name, X-Mime-Type → upload multipart feito aqui mesmo.
 *
 * Variável de ambiente necessária no painel da Vercel:
 *   GEMINI_API_KEY = AIza...
 */

// Aumenta o timeout — apenas para a inicialização do upload resumível
export const maxDuration = 30;

const UPLOAD_URL = 'https://generativelanguage.googleapis.com/upload/v1beta/files';

export default async function handler(req, res) {
  // CORS
  const origin = req.headers.origin || '';
  const allowedOrigins = [
    'https://radar.relevantia.com.br',
    'https://www.radar.relevantia.com.br',
  ];
  if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-File-Name, X-File-Size, X-Mime-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Configuração do servidor incompleta.' });
  }

  try {
    const { fileName, mimeType = 'application/pdf', fileSize } = req.body || {};

    if (!fileName || !fileSize) {
      return res.status(400).json({ error: 'fileName e fileSize são obrigatórios.' });
    }

    // Inicia upload resumível — o Google retorna uma uploadUrl temporária
    // O frontend usará essa URL para fazer o PUT direto com o binário do arquivo
    const initRes = await fetch(`${UPLOAD_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(fileSize),
        'X-Goog-Upload-Header-Content-Type': mimeType,
      },
      body: JSON.stringify({ file: { display_name: fileName } }),
    });

    if (!initRes.ok) {
      const err = await initRes.json().catch(() => ({}));
      console.error('Gemini init upload error:', err);
      return res.status(502).json({ error: 'Erro ao iniciar upload.', detail: err?.error?.message });
    }

    // A uploadUrl está no header X-Goog-Upload-URL
    const uploadUrl = initRes.headers.get('x-goog-upload-url');
    if (!uploadUrl) {
      return res.status(502).json({ error: 'Gemini não retornou upload URL.' });
    }

    return res.status(200).json({ uploadUrl });
  } catch (err) {
    console.error('Erro interno gemini-upload:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}
