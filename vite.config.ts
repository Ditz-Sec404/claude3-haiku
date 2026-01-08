import { defineConfig, ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { claude } from './claude-core.js'
import { IncomingMessage, ServerResponse } from 'http'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Secret key for token validation
const SECRET_KEY = 'c3h1r0k0_cl4ud3_s3cr3t_k3y_2026';

// Token validation function
const validateToken = (token: string, requestTime: string): boolean => {
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

// Custom body parser for JSON
const parseJsonBody = (req: IncomingMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
};

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        {
            name: 'claude-api-middleware',
            configureServer(server: ViteDevServer) {
                // New obfuscated endpoint: /api/c3
                server.middlewares.use('/api/c3', async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
                    if (req.method !== 'POST') {
                        res.statusCode = 405;
                        res.end('Method Not Allowed');
                        return;
                    }

                    // Validate token
                    const authToken = req.headers['x-auth-token'] as string;
                    const requestTime = req.headers['x-request-time'] as string;

                    if (!validateToken(authToken, requestTime)) {
                        res.statusCode = 401;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Unauthorized' }));
                        return;
                    }

                    try {
                        const body = await parseJsonBody(req);
                        const { message, instruction, sessionId } = body;
                        const result = await claude({ message, instruction, sessionId });
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(result));
                    } catch (err: unknown) {
                        console.error(err);
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
                        res.end(JSON.stringify({ error: errorMessage }));
                    }
                });

                // Keep old endpoint for backwards compatibility (can be removed later)
                server.middlewares.use('/api/chat', async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
                    res.statusCode = 404;
                    res.end('Not Found');
                });
            },
        },
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: true,
        port: 5173,
    },
})
