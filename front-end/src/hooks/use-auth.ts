"use client"
import { useSelector, useDispatch} from "react-redux";
import { type RootState, type AppDispatch } from "@/store/store-index";
import { login as reduxLogin, logout as reduxLogout, selectCurrentUser, selectAuthToken } from "@/store/auth-slice";
import type {UserRole} from "@/types/user";
import type { AuthenticatedUser} from "@/store/auth-slice";

export const useAuth = () => {
    const dispatch = useDispatch<AppDispatch>();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const currentUser = useSelector(selectCurrentUser);
    const token = useSelector(selectAuthToken);

    const checkRole = (roles: UserRole[]) => {
        if(!currentUser) return false;
        return roles.includes(currentUser.role);
    }
    return {
        isAuthenticated,
        currentUser,
        token,
        login: (payload: { user: AuthenticatedUser; token: string }) => dispatch(reduxLogin(payload)),
        logout: () => dispatch(reduxLogout()),
        hasRole: checkRole,
    }
}