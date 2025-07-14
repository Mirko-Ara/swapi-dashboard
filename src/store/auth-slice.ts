import { createSlice, type PayloadAction} from '@reduxjs/toolkit';
import type { User, UserRole } from "@/types/user";

interface AuthState {
    isAuthenticated: boolean;
    currentUser: User | null;
}

const getInitialState = (): AuthState => {
    if(typeof window !== 'undefined') {
        const storedAuth = localStorage.getItem("auth");
        const storedUser = localStorage.getItem("currentUser");
        return {
            isAuthenticated: storedAuth === "true",
            currentUser: storedUser ? JSON.parse(storedUser) : null,
        };
    }
    return { isAuthenticated: false, currentUser: null};
};

const authSlice = createSlice({
    name: 'auth',
    initialState: getInitialState(),
    reducers: {
        login: (state, action: PayloadAction<User>) => {
            state.isAuthenticated = true;
            state.currentUser = action.payload;
            if(typeof window !== 'undefined') {
                localStorage.setItem("auth", "true");
                localStorage.setItem("currentUser", JSON.stringify(action.payload))
            }
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.currentUser = null;
            if(typeof window !== 'undefined') {
                localStorage.removeItem("auth");
                localStorage.removeItem("currentUser");
            }
        },
    },
});

export const {login, logout} = authSlice.actions;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.currentUser;

export const hasRole = (roles: UserRole[]) => (state: { auth: AuthState}) => {
    const currentUser = selectCurrentUser(state);
    if(!currentUser) return false;
    return roles.includes(currentUser.role);
};

export default authSlice.reducer;