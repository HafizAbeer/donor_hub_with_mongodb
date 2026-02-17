import { saveOfflineRequest } from './offline-store';

export const apiFetch = async (url, options = {}) => {
    try {
        const response = await fetch(url, options);
        return response;
    } catch (error) {
        if (!navigator.onLine || error.message === 'Failed to fetch') {
            console.warn('Offline detected. Saving request for later sync...');

            if (['POST', 'PUT', 'DELETE'].includes(options.method)) {
                await saveOfflineRequest({
                    url,
                    method: options.method,
                    body: options.body ? JSON.parse(options.body) : null,
                    headers: options.headers
                });

                return {
                    ok: true,
                    json: async () => ({ message: 'Saved offline. Will sync when online.', offline: true })
                };
            }
        }
        throw error;
    }
};
