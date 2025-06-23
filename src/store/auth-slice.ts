import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
    isAuthenticated: boolean;
}

const getInitialState = (): boolean => {
    if(typeof window !== 'undefined') {
        return localStorage.getItem("auth") === "true";
    }
    return false;
};

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        isAuthenticated: getInitialState(),
    } as AuthState,
    reducers: {
        login: (state) => {
            state.isAuthenticated = true;
            if(typeof window !== 'undefined') {
                localStorage.setItem("auth", "true");
            }
        },
        logout: (state) => {
            state.isAuthenticated = false;
            if(typeof window !== 'undefined') {
                localStorage.removeItem("auth");
            }
        },
    },
});

export const {login, logout} = authSlice.actions;
export default authSlice.reducer;