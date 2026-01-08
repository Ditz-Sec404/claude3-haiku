export const config = {
    runtime: 'edge',
};

// Secret key for token validation
const SECRET_KEY = 'c3h1r0k0_cl4ud3_s3cr3t_k3y_2026';

// Token validation function
const validateToken = (token, requestTime) => {
    try {
        if (!token || !requestTime) return false;

        const decoded = atob(token);
        const [timestamp, hash] = decoded.split(':');
        const ts = parseInt(timestamp);
        const rt = parseInt(requestTime);

        // Check if timestamp is within 5 minutes
        const now = Date.now();
        if (Math.abs(now - ts) > 5 * 60 * 1000) return false;
        if (Math.abs(now - rt) > 5 * 60 * 1000) return false;

        // Verify hash
        const raw = `${timestamp}_${SECRET_KEY}`;
        let expectedHash = 0;
        for (let i = 0; i < raw.length; i++) {
            const char = raw.charCodeAt(i);
            expectedHash = ((expectedHash << 5) - expectedHash) + char;
            expectedHash = expectedHash & expectedHash;
        }

        return hash === Math.abs(expectedHash).toString(36);
    } catch {
        return false;
    }
};

export default async function handler(request) {
    const corsHeaders = {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Auth-Token, X-Request-Time',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    // Validate token
    const authToken = request.headers.get('x-auth-token');
    const requestTime = request.headers.get('x-request-time');

    if (!validateToken(authToken, requestTime)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }

    try {
        const { message, instruction } = await request.json();
        const result = await claude3({ question: message, instruction });

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    } catch (error) {
        console.error('Edge API Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}

async function claude3({ question, instruction = '' }) {
    // Get current date/time in Indonesian timezone
    const now = new Date();
    const options = {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    const currentDateTime = now.toLocaleString('id-ID', options);

    const BASE_SYSTEM_PROMPT = `Anda adalah asisten AI profesional yang cerdas dan membantu. Berikan jawaban yang jelas, akurat, informatif, dan mudah dipahami. Gunakan bahasa Indonesia yang baik dan formal.

[KONTEKS WAKTU - HANYA UNTUK REFERENSI INTERNAL]
Waktu saat ini: ${currentDateTime} WIB
PENTING: Informasi waktu HANYA digunakan jika pengguna SPESIFIK bertanya tentang waktu/tanggal.

[CARA MEMBUAT CHART/GRAFIK]
Jika pengguna meminta chart, grafik, atau diagram data, gunakan format JSON dengan language "json-chart" seperti berikut:

\`\`\`json-chart
{
  "type": "bar",
  "title": "Judul Chart",
  "data": [
    {"label": "Item 1", "value": 100},
    {"label": "Item 2", "value": 200}
  ]
}
\`\`\`

Tipe chart yang tersedia: "bar", "line", "area", "pie", "donut"
JANGAN gunakan ASCII art untuk chart. SELALU gunakan format json-chart di atas.

[CARA MEMBUAT FLOWCHART/DIAGRAM]
Untuk flowchart atau diagram alur, gunakan format Mermaid:

\`\`\`mermaid
flowchart TD
    A[Mulai] --> B{Kondisi?}
    B -->|Ya| C[Aksi 1]
    B -->|Tidak| D[Aksi 2]
    C --> E[Selesai]
    D --> E
\`\`\`

JANGAN gunakan ASCII art untuk flowchart. SELALU gunakan format mermaid di atas.`;

    if (!question) throw new Error('Question is required.');

    let finalInstruction = instruction
        ? `${BASE_SYSTEM_PROMPT}\n\nInstruksi tambahan dari pengguna:\n${instruction}`
        : BASE_SYSTEM_PROMPT;

    const fullMessage = `[Instruksi Sistem: ${finalInstruction}]\n\n${question}`;

    // Step 1: Get the page to extract utoken and cookies
    const pageResp = await fetch('https://minitoolai.com/Claude-3/', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
        }
    });

    const html = await pageResp.text();
    const cookies = pageResp.headers.get('set-cookie') || '';

    // Step 2: Get Cloudflare turnstile bypass token
    const cfResp = await fetch('https://api.nekolabs.web.id/tls/bypass/cf-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: 'https://minitoolai.com/Claude-3/',
            siteKey: '0x4AAAAAABjI2cBIeVpBYEFi'
        })
    });

    const cf = await cfResp.json();
    if (!cf?.result) throw new Error('Failed to get cf token.');

    // Step 3: Extract utoken from HTML
    const utokenMatch = html.match(/var\s+utoken\s*=\s*"([^"]*)"/);
    if (!utokenMatch) throw new Error('Failed to get utoken.');
    const utoken = utokenMatch[1];

    // Step 4: Submit the message to get stream token
    const requestHeaders = {
        'accept': '*/*',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'cookie': cookies,
        'origin': 'https://minitoolai.com',
        'referer': 'https://minitoolai.com/Claude-3/',
        'sec-ch-ua': '"Chromium";v="137", "Not(A)Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
        'x-requested-with': 'XMLHttpRequest'
    };

    const taskResp = await fetch('https://minitoolai.com/Claude-3/claude3_stream.php', {
        method: 'POST',
        headers: requestHeaders,
        body: new URLSearchParams({
            messagebase64img1: '',
            messagebase64img0: '',
            select_model: 'claude-3-haiku-20240307',
            temperature: '0.7',
            utoken: utoken,
            message: fullMessage,
            umes1a: '',
            bres1a: '',
            umes2a: '',
            bres2a: '',
            cft: encodeURIComponent(cf.result)
        }).toString()
    });

    const task = await taskResp.text();

    // Step 5: Get the streaming response
    const streamUrl = `https://minitoolai.com/Claude-3/claude3_stream.php?streamtoken=${encodeURIComponent(task)}`;
    const streamResp = await fetch(streamUrl, {
        headers: {
            'accept': '*/*',
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'cookie': cookies,
            'origin': 'https://minitoolai.com',
            'referer': 'https://minitoolai.com/Claude-3/',
            'sec-ch-ua': '"Chromium";v="137", "Not(A)Brand";v="24"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
            'x-requested-with': 'XMLHttpRequest'
        }
    });

    const data = await streamResp.text();

    // Step 6: Parse the SSE response
    const result = data.split('\n')
        .filter(line => line && line.startsWith('data: {'))
        .map(line => {
            try {
                return JSON.parse(line.substring(6));
            } catch {
                return null;
            }
        })
        .filter(line => line && line.type === 'content_block_delta')
        .map(line => line.delta?.text || '')
        .join('');

    if (!result) throw new Error('No result found from Claude.');

    return {
        text: result,
        sessionId: null
    };
}
