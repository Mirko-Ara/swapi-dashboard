import { createSlice, type PayloadAction} from '@reduxjs/toolkit';
import type { User, UserRole } from "@/types/user";

export type AuthenticatedUser = Omit<User, 'password'> & { token: string };

interface AuthState {
    isAuthenticated: boolean;
    currentUser: AuthenticatedUser | null; // Usa il nuovo tipo qui
    token: string | null;
}

const getInitialState = (): AuthState => {
    if(typeof window !== 'undefined') {
        const storedToken = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("authUser");
        try {
            const userFromStorage = storedUser ? JSON.parse(storedUser) : null;
            if (userFromStorage && storedToken) {
                const safeUser: AuthenticatedUser = {
                    id: userFromStorage.id,
                    username: userFromStorage.username,
                    email: userFromStorage.email,
                    role: userFromStorage.role,
                    isActive: userFromStorage.isActive,
                    createdAt: userFromStorage.createdAt,
                    updatedAt: userFromStorage.updatedAt,
                    token: storedToken,
                };
                return {
                    isAuthenticated: true,
                    currentUser: safeUser,
                    token: storedToken,
                };
            }
        } catch (error) {
            console.error("Failed to parse user or token from localStorage:", error);
            localStorage.removeItem("authToken");
            localStorage.removeItem("authUser");
        }
    }
    return { isAuthenticated: false, currentUser: null, token: null};
};

const authSlice = createSlice({
    name: 'auth',
    initialState: getInitialState(),
    reducers: {
        login: (state, action: PayloadAction<{ user: AuthenticatedUser; token: string }>) => {
            state.isAuthenticated = true;
            state.currentUser = action.payload.user; // Memorizza l'utente senza password
            state.token = action.payload.token;
            if(typeof window !== 'undefined') {
                localStorage.setItem("authToken", action.payload.token);
                localStorage.setItem("authUser", JSON.stringify(action.payload.user)); // Salva l'utente senza password
            }
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.currentUser = null;
            state.token = null;
            if(typeof window !== 'undefined') {
                localStorage.removeItem("authToken");
                localStorage.removeItem("authUser");
            }
        },
    },
});

export const {login, logout} = authSlice.actions;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.currentUser;
export const selectAuthToken = (state: { auth: AuthState }) => state.auth.token;

export const hasRole = (roles: UserRole[]) => (state: { auth: AuthState}) => {
    const currentUser = selectCurrentUser(state);
    if(!currentUser) return false;
    return roles.includes(currentUser.role);
};

export default authSlice.reducer;