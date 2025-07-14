import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockUserApi } from '@/api/mock-user-api';
import {type User, type UserCreateUpdate} from '@/types/user';

const USER_QUERY_KEY = 'users';

export const useUsers = () => {
    return useQuery<User[], Error>({
        queryKey: [USER_QUERY_KEY],
        queryFn: mockUserApi.fetchUsers,
    });
};

export const useUser = (id: string | undefined) => {
    return useQuery<User | null, Error>({
        queryKey: [USER_QUERY_KEY, id],
        queryFn: () => (id ? mockUserApi.fetchUserById(id) : Promise.resolve(null)),
        enabled: !!id,
    })
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();
    return useMutation<User, Error, UserCreateUpdate>({
        mutationFn: async (userData: UserCreateUpdate) => {
            const result = await mockUserApi.createUser(userData);
            if(!result) {
                throw new Error("Failed to create user");
            }
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] })
                .catch((error) => console.error('Failed to invalidate queries: ', error));
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation<User, Error, {id: string; updates: Partial<UserCreateUpdate>}>({
        mutationFn: async ({ id, updates}) => {
            const result = await mockUserApi.updateUser(id, updates);
            if(!result) {
                throw new Error("Failed to update user");
            }
            return result;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY]}).catch((error) => console.error('Failed to invalidate queries: ', error));
            queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY, variables.id] }).catch((error) => console.error('Failed to invalidate user query: ', error));
        }
    });
};

export const useDeleteUser = () => {
     const queryClient = useQueryClient();
     return useMutation<void, Error, string>({
         mutationFn: async (id: string) => {
             return await mockUserApi.deleteUser(id);
         },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] }).catch((error) => console.error('Failed to invalidate queries: ', error));
            },
     });
}