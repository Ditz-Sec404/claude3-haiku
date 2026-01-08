import axios from 'axios';

export async function claude({ message, instruction = '', sessionId = null, signal = null }) {
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

    try {
        if (!message) throw new Error('Message is required.');

        // Gabungkan base prompt dengan user instruction
        let finalInstruction = instruction
            ? `${BASE_SYSTEM_PROMPT}\n\nInstruksi tambahan dari pengguna:\n${instruction}`
            : BASE_SYSTEM_PROMPT;

        // Tambahkan instruksi ke pesan jika ada
        const fullMessage = finalInstruction
            ? `[Instruksi Sistem: ${finalInstruction}]\n\n${message}`
            : message;

        const { data: html, headers } = await axios.get('https://minitoolai.com/Claude-3/', { signal });

        const { data: cf } = await axios.post('https://api.nekolabs.web.id/tls/bypass/cf-turnstile', {
            url: 'https://minitoolai.com/Claude-3/',
            siteKey: '0x4AAAAAABjI2cBIeVpBYEFi'
        }, { signal });

        if (!cf?.result) throw new Error('Failed to get cf token.');

        const utoken = html.match(/var\s+utoken\s*=\s*"([^"]*)"/)?.[1];
        if (!utoken) throw new Error('Failed to get utoken.');

        const cookies = headers['set-cookie']?.join('; ') || '';

        const { data: task } = await axios.post('https://minitoolai.com/Claude-3/claude3_stream.php', new URLSearchParams({
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
        }).toString(), {
            headers: {
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                cookie: cookies,
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
            },
            signal
        });

        const { data } = await axios.get('https://minitoolai.com/Claude-3/claude3_stream.php', {
            headers: {
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                cookie: cookies,
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
            },
            params: {
                streamtoken: task
            },
            signal
        });

        const result = data.split('\n')
            .filter(line => line && line.startsWith('data: {'))
            .map(line => JSON.parse(line.substring(6)))
            .filter(line => line.type === 'content_block_delta')
            .map(line => line.delta.text)
            .join('');

        if (!result) throw new Error('No result found.');

        return {
            text: result,
            sessionId: null
        };
    } catch (error) {
        console.error("Claude Error:", error.message);
        throw new Error(error.message);
    }
}
