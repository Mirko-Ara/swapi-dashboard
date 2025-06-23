"use client"
import { useSelector, useDispatch} from "react-redux";
import { type RootState, type AppDispatch } from "@/store/store-index";
import { login as reduxLogin, logout as reduxLogout } from "@/store/auth-slice";

export const useAuth = () => {
    const dispatch = useDispatch<AppDispatch>();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    return {
        isAuthenticated,
        login: () => dispatch(reduxLogin()),
        logout: () => dispatch(reduxLogout()),
    }
}