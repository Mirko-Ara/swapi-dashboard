"use client"
import { useSelector, useDispatch} from "react-redux";
import { type RootState, type AppDispatch } from "@/store/store-index";
import { login as reduxLogin, logout as reduxLogout, selectCurrentUser } from "@/store/auth-slice";
import type { User, UserRole} from "@/types/user";

export const useAuth = () => {
    const dispatch = useDispatch<AppDispatch>();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const currentUser = useSelector(selectCurrentUser);

    const checkRole = (roles: UserRole[]) => {
        if(!currentUser) return false;
        return roles.includes(currentUser.role);
    }
    return {
        isAuthenticated,
        currentUser,
        login: (user: User) => dispatch(reduxLogin(user)),
        logout: () => dispatch(reduxLogout()),
        hasRole: checkRole,
    }
}