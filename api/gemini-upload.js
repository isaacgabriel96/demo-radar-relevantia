/**
 * Vercel Function — Proxy de upload para a Gemini Files API
 * Radar Relevantia · /api/gemini-upload
 *
 * Recebe: POST multipart/form-data com campo "file" (PDF, até 100MB)
 * Retorna: { fileUri, mimeType, name } — fileUri usado em contents do Gemini
 *
 * Variável de ambiente necessária no painel da Vercel:
 *   GEMINI_API_KEY = AIza...
 *
 * Gemini Files API:
 *   - Suporta PDFs de até 2GB (via upload resumível) / 20MB (inline)
 *   - Arquivos ficam disponíveis por 48h
 *   - Limite de 20GB armazenado por projeto
 */

export const config = {
  api: { bodyParser: false },
};

// Aumenta o timeout — uploads grandes podem demorar
export const maxDuration = 60;

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
    // Lê o body como buffer (bodyParser desabilitado)
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const fileBuffer = Buffer.concat(chunks);

    if (fileBuffer.length === 0) {
      return res.status(400).json({ error: 'Arquivo vazio.' });
    }

    const mimeType  = req.headers['x-mime-type']  || 'application/pdf';
    const fileName  = req.headers['x-file-name']  || 'documento.pdf';
    const fileSize  = fileBuffer.length;

    // Upload para a Gemini Files API (multipart upload)
    const boundary = '----GeminiUploadBoundary' + Date.now();
    const metadataPart =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=utf-8\r\n\r\n` +
      JSON.stringify({ file: { display_name: fileName } }) +
      `\r\n`;
    const filePart =
      `--${boundary}\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`;
    const closing = `\r\n--${boundary}--`;

    const metaBuf  = Buffer.from(metadataPart, 'utf8');
    const fileHdr  = Buffer.from(filePart, 'utf8');
    const closeBuf = Buffer.from(closing, 'utf8');
    const body     = Buffer.concat([metaBuf, fileHdr, fileBuffer, closeBuf]);

    const uploadRes = await fetch(`${UPLOAD_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': body.length,
        'X-Goog-Upload-Protocol': 'multipart',
      },
      body,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      console.error('Gemini Files API error:', err);
      return res.status(502).json({ error: 'Erro ao fazer upload do PDF para a IA.', detail: err?.error?.message });
    }

    const data = await uploadRes.json();
    const fileUri  = data.file?.uri;
    const fileMime = data.file?.mimeType || mimeType;
    const name     = data.file?.name;

    if (!fileUri) {
      return res.status(502).json({ error: 'Gemini não retornou URI do arquivo.' });
    }

    return res.status(200).json({ fileUri, mimeType: fileMime, name, displayName: fileName });
  } catch (err) {
    console.error('Erro interno upload:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}
