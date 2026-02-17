import { openDB } from 'idb';

const DB_NAME = 'donor-hub-offline-db';
const STORE_NAME = 'offline-requests';

export const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        },
    });
};

export const saveOfflineRequest = async (request) => {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await store.add({
        ...request,
        timestamp: Date.now()
    });
    await tx.done;
};

export const getOfflineRequests = async () => {
    const db = await initDB();
    return db.getAll(STORE_NAME);
};

export const deleteOfflineRequest = async (id) => {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
};
