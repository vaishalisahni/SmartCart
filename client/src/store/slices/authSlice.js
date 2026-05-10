// authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const loginUser = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/auth/login', creds);
    localStorage.setItem('accessToken', data.accessToken);
    return data.user;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Login failed'); }
});

export const registerUser = createAsyncThunk('auth/register', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await API.post('/auth/register', creds);
    localStorage.setItem('accessToken', data.accessToken);
    return data.user;
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Register failed'); }
});

export const loadUser = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.get('/auth/me');
    return data.user;
  } catch {
    return rejectWithValue(null); // silent — user just isn't logged in
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await API.post('/auth/logout');
  localStorage.removeItem('accessToken');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, loading: false, error: null, initialized: false },
  reducers: { clearError: s => { s.error = null; } },
  extraReducers: b => {
    b.addCase(loginUser.pending, s => { s.loading = true; s.error = null; })
     .addCase(loginUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; })
     .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(registerUser.pending, s => { s.loading = true; s.error = null; })
     .addCase(registerUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; })
     .addCase(registerUser.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
     .addCase(loadUser.fulfilled, (s, a) => { s.user = a.payload; s.initialized = true; })
     .addCase(loadUser.rejected, s => { s.user = null; s.initialized = true; })
     .addCase(logoutUser.fulfilled, s => { s.user = null; });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;