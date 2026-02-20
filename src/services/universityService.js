/**
 * Service to handle university-related API calls
 */

export const fetchUniversities = async () => {
    try {
        const response = await fetch('/api/universities');
        if (!response.ok) {
            throw new Error('Failed to fetch universities');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching universities:', error);
        return [];
    }
};

export const addUniversity = async (name, token) => {
    try {
        const response = await fetch('/api/universities', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add university');
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding university:', error);
        throw error;
    }
};
