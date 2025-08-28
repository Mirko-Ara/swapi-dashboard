import type { User,  UserCreateUpdate, PasswordChangeRequest, UserProfileUpdate  } from '@/types/user';

const API_BASE_URL = 'http://localhost:8080/api/users' as const;
const API_BASE_URL_AUTH = 'http://localhost:8080/api/auth' as const;
const API_BASE_URL_PROFILE = 'http://localhost:8080/api/users/profile' as const;


async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    if(options.headers) {
        if(options.headers instanceof Headers) {
            options.headers.forEach((value, key) => {
                headers[key] = value;
            });
        } else if(Array.isArray(options.headers)) {
            options.headers.forEach(([key, value]) => {
                headers[key] = value;
            })
        } else {
            Object.assign(headers, options.headers)
        }
    }
    if(token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, {
        ...options,
        headers: headers,
    });

    if(response.status === 401 || response.status === 403) {
        console.warn('Authentication error (401/403) detected in API call. Clearing session.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        throw new Error('Unauthorized or Forbidden access. Please log in again.');
    }

    return response;
}

export const realUserApi = {
    async fetchUsers(): Promise<User[]> {
        const response = await authenticatedFetch(API_BASE_URL);
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch users from backend');
        }
        return await response.json();
    },

    async fetchUserById(id: string): Promise<User | null> {
        const response = await authenticatedFetch(API_BASE_URL + '/' + id);
        if(response .status === 404) {
            return null; // User not found
        }
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to fetch user ${id} from backend`);
        }
        return await response.json();
    },
    async createUser(userData: UserCreateUpdate): Promise<User> {
        const response = await authenticatedFetch(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create user on backend');
        }
        return await response.json();
    },
    async updateUserProfile(updates: Partial<UserProfileUpdate>): Promise<User> {
        const response = await authenticatedFetch(API_BASE_URL_PROFILE, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to update user profile on backend`);
        }
        return await response.json();
    },
    async updateUser(id: string, updates: Partial<UserCreateUpdate>): Promise<User> {
        const response = await authenticatedFetch(API_BASE_URL + '/' + id, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to update user ${id} on backend`);
        }
        return await response.json();
    },
    async deleteUser(id: string): Promise<void> {
        const response = await authenticatedFetch(API_BASE_URL + '/' + id, {
            method: 'DELETE',
        });
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to delete user ${id} on backend`);
        }
    },
    async changePassword(data: PasswordChangeRequest): Promise<void> {
        const response = await authenticatedFetch(`${API_BASE_URL_AUTH}/change-password`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to change password on backend`);
        }
    }
}