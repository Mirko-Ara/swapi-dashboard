import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { realUserApi } from '@/api/real-user-api';
import {type User, type UserCreateUpdate, type PasswordChangeRequest} from '@/types/user';
import {toast} from "sonner";
import { useTranslation } from 'react-i18next';

const USER_QUERY_KEY = 'users'

export const useUsers = () => {
    return useQuery<User[], Error>({
        queryKey: [USER_QUERY_KEY],
        queryFn: realUserApi.fetchUsers,
    });
};

export const useUser = (id: string | undefined) => {
    return useQuery<User | null, Error>({
        queryKey: [USER_QUERY_KEY, id],
        queryFn: () => (id ? realUserApi.fetchUserById(id) : Promise.resolve(null)),
        enabled: !!id,
    })
};

export const useCreateUser = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();
    return useMutation<User, Error, UserCreateUpdate>({
        mutationFn: async (userData: UserCreateUpdate) => {
            const result = await realUserApi.createUser(userData);
            if(!result) {
                throw new Error("Failed to create user");
            }
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] })
                .catch((error) => console.error('Failed to invalidate queries: ', error));
            if(onSuccessCallback) {
                onSuccessCallback();
            }
        },
        onError: (error) => {
            console.error('Error creating user: ', error);
            toast.error(error.message);
        }
    });
};

export const useUpdateUser = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();
    return useMutation<User, Error, {id: string; updates: Partial<UserCreateUpdate>}>({
        mutationFn: async ({ id, updates}) => {
            const result = await realUserApi.updateUser(id, updates);
            if(!result) {
                throw new Error("Failed to update user");
            }
            return result;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY]}).catch((error) => console.error('Failed to invalidate queries: ', error));
            queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY, variables.id] }).catch((error) => console.error('Failed to invalidate user query: ', error));
            if(onSuccessCallback) {
                onSuccessCallback();
            }
        },
        onError: (error) => {
            console.error("Error updating user:", error.message);
            toast.error(error.message);
        }
    });
};

export const useDeleteUser = () => {
     const queryClient = useQueryClient();
     return useMutation<void, Error, string>({
         mutationFn: async (id: string) => {
             return await realUserApi.deleteUser(id);
         },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] }).catch((error) => console.error('Failed to invalidate queries: ', error));
        },
         onError: (error) => {
             console.error("Error deleting user:", error.message);
             toast.error(error.message);
         }
     });
}

export const useUpdatePassword = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    return useMutation<void, Error, PasswordChangeRequest>({
        mutationFn: async (data: PasswordChangeRequest) => {
            return await realUserApi.changePassword(data);
        },
        onSuccess: () => {
            toast.success(t('passwordUpdatedSuccessfully'));
            queryClient.invalidateQueries({ queryKey: [USER_QUERY_KEY] }).catch((error) => console.error('Failed to invalidate queries: ', error));
            onSuccessCallback?.()
        },
        onError: (error) => {
            console.error("Error updating password: ", error.message);
            toast.error(t('errorUpdatingPassword') + ` ${error.message}`);
        }
    });
};