import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ChatDB extends DBSchema {
    sessions: {
        key: string;
        value: any;
    };
}

const DB_NAME = 'shiroko-chat-db';
const STORE_NAME = 'sessions';

export const initDB = async (): Promise<IDBPDatabase<ChatDB>> => {
    return openDB<ChatDB>(DB_NAME, 1, {
        upgrade(db: IDBPDatabase<ChatDB>) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        },
    });
};

export const saveSessionToDB = async (session: any): Promise<void> => {
    const db = await initDB();
    await db.put(STORE_NAME, session);
};

export const saveAllSessionsToDB = async (sessions: any[]): Promise<void> => {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await Promise.all(sessions.map(s => tx.store.put(s)));
    await tx.done;
};

export const getAllSessionsFromDB = async (): Promise<any[]> => {
    const db = await initDB();
    return db.getAll(STORE_NAME);
};

export const deleteSessionFromDB = async (id: string): Promise<void> => {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
};

export const clearDB = async (): Promise<void> => {
    const db = await initDB();
    await db.clear(STORE_NAME);
};
