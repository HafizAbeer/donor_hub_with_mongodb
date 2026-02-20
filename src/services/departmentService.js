export const fetchDepartments = async () => {
    try {
        const response = await fetch('/api/departments');
        if (!response.ok) {
            throw new Error('Failed to fetch departments');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching departments:', error);
        return [];
    }
};

export const addDepartment = async (name, token) => {
    try {
        const response = await fetch('/api/departments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add department');
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding department:', error);
        throw error;
    }
};

export const deleteDepartment = async (id, token) => {
    try {
        const response = await fetch(`/api/departments/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete department');
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting department:', error);
        throw error;
    }
};
