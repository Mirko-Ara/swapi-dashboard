import { createSlice, type PayloadAction} from '@reduxjs/toolkit';

type Theme = 'dark' | 'light' | 'system';

interface ThemeState {
    theme: Theme;
}

const getInitialTheme = (storageKey: string, defaultTheme: Theme): Theme => {
    if(typeof window !== 'undefined') {
        return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
    return defaultTheme;
};


const themeSlice = createSlice({
    name: 'theme',
    initialState: {
        theme: getInitialTheme("vite-ui-theme", "light"),
    } as ThemeState,
    reducers: {
        setTheme: (state, action: PayloadAction<Theme>) => {
            state.theme = action.payload;
            if(typeof window !== 'undefined') {
                localStorage.setItem("vite-ui-theme", action.payload);
            }
        },
    },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;