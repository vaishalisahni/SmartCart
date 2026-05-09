import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    darkMode: localStorage.getItem('darkMode') === 'true',
    sidebarOpen: false,
  },
  reducers: {
    toggleDarkMode: s => {
      s.darkMode = !s.darkMode;
      localStorage.setItem('darkMode', s.darkMode);
      document.documentElement.classList.toggle('dark', s.darkMode);
    },
    setSidebar: (s, a) => { s.sidebarOpen = a.payload; },
  },
});

export const { toggleDarkMode, setSidebar } = uiSlice.actions;
export default uiSlice.reducer;