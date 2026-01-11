import axios from 'axios';

interface ClaudeResponse {
    text: string;
    sessionId: string | null;
}

interface ClaudeRequest {
    message: string;
    instruction?: string;
    sessionId?: string | null;
    signal?: AbortSignal;
}

const generateToken = (): string => {
    const timestamp = Date.now();
    const secret = 'c3h1r0k0_cl4ud3_s3cr3t_k3y_2026';
    const raw = `${timestamp}_${secret}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return btoa(`${timestamp}:${Math.abs(hash).toString(36)}`);
};

const API_ENDPOINT = atob('L2FwaS9jMw==');

export const claude = async (data: ClaudeRequest): Promise<ClaudeResponse> => {
    const { signal, ...rest } = data;
    const response = await axios.post(API_ENDPOINT, rest, {
        signal,
        headers: {
            'X-Auth-Token': generateToken(),
            'X-Request-Time': Date.now().toString()
        }
    });
    return response.data;
};
