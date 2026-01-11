import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export interface SharedChat {
    title: string;
    messages: {
        role: 'user' | 'assistant';
        content: string;
    }[];
    sharedAt: number;
}

export const encodeChat = (chat: SharedChat): string => {
    const json = JSON.stringify(chat);
    return compressToEncodedURIComponent(json);
};

export const decodeChat = (encoded: string): SharedChat | null => {
    try {
        const json = decompressFromEncodedURIComponent(encoded);
        if (!json) return null;
        return JSON.parse(json);
    } catch {
        return null;
    }
};

export const generateShareUrl = (chat: SharedChat): string => {
    const encoded = encodeChat(chat);
    const baseUrl = window.location.origin;
    return `${baseUrl}/share?data=${encoded}`;
};

export const copyShareLink = async (chat: SharedChat): Promise<boolean> => {
    try {
        const url = generateShareUrl(chat);
        await navigator.clipboard.writeText(url);
        return true;
    } catch {
        return false;
    }
};
