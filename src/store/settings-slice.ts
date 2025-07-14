import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    funFactWidgetEnabled: typeof window !== "undefined" ? localStorage.getItem("funFactWidgetEnabled") !== "false" : true
};

export const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        toggleFunFactWidget: (state, action) => {
            state.funFactWidgetEnabled = action.payload;
            if(typeof window !== "undefined") {
                localStorage.setItem("funFactWidgetEnabled", String(action.payload));

            }
        }
    },
});


export const {
    toggleFunFactWidget,
} = settingsSlice.actions;

export default settingsSlice.reducer;