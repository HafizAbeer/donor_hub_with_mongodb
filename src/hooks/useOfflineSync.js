import { useEffect } from 'react';
import { getOfflineRequests, deleteOfflineRequest } from '../lib/offline-store';
import { apiFetch } from '../lib/api-client';

export const useOfflineSync = () => {
    useEffect(() => {
        const syncData = async () => {
            if (!navigator.onLine) return;

            const requests = await getOfflineRequests();
            if (requests.length === 0) return;

            console.log(`Syncing ${requests.length} offline requests...`);

            for (const req of requests) {
                try {
                    const res = await fetch(req.url, {
                        method: req.method,
                        headers: req.headers,
                        body: JSON.stringify(req.body)
                    });

                    if (res.ok) {
                        await deleteOfflineRequest(req.id);
                        console.log(`Successfully synced request: ${req.url}`);
                    }
                } catch (error) {
                    console.error(`Failed to sync request: ${req.url}`, error);
                }
            }
        };

        window.addEventListener('online', syncData);
        syncData();

        return () => window.removeEventListener('online', syncData);
    }, []);
};
