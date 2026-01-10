// Share chat utilities
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

export interface SharedChat {
    title: string;
    messages: {
        role: 'user' | 'assistant';
        content: string;
    }[];
    sharedAt: number;
}

// Encode chat data to shareable string
export const encodeChat = (chat: SharedChat): string => {
    const json = JSON.stringify(chat);
    return compressToEncodedURIComponent(json);
};

// Decode chat data from shareable string
export const decodeChat = (encoded: string): SharedChat | null => {
    try {
        const json = decompressFromEncodedURIComponent(encoded);
        if (!json) return null;
        return JSON.parse(json);
    } catch {
        return null;
    }
};

// Generate share URL
export const generateShareUrl = (chat: SharedChat): string => {
    const encoded = encodeChat(chat);
    const baseUrl = window.location.origin;
    return `${baseUrl}/share?data=${encoded}`;
};

// Copy to clipboard and return success
export const copyShareLink = async (chat: SharedChat): Promise<boolean> => {
    try {
        const url = generateShareUrl(chat);
        await navigator.clipboard.writeText(url);
        return true;
    } catch {
        return false;
    }
};
