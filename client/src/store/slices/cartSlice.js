// cartSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchCart = createAsyncThunk('cart/fetch', async () => { const { data } = await API.get('/cart'); return data.cart; });
export const addToCart = createAsyncThunk('cart/add', async (payload, { rejectWithValue }) => {
  try { const { data } = await API.post('/cart/add', payload); return data.cart; }
  catch (err) { return rejectWithValue(err.response?.data?.message); }
});
export const updateCartItem = createAsyncThunk('cart/update', async (payload) => { const { data } = await API.put('/cart/update', payload); return data.cart; });
export const removeFromCart = createAsyncThunk('cart/remove', async (productId) => { const { data } = await API.delete(`/cart/remove/${productId}`); return data.cart; });
export const clearCart = createAsyncThunk('cart/clear', async () => { await API.delete('/cart/clear'); return { items: [] }; });

const cartSlice = createSlice({
  name: 'cart',
  initialState: { cart: null, loading: false },
  reducers: {},
  extraReducers: b => {
    [fetchCart, addToCart, updateCartItem, removeFromCart, clearCart].forEach(thunk => {
      b.addCase(thunk.pending, s => { s.loading = true; })
       .addCase(thunk.fulfilled, (s, a) => { s.loading = false; s.cart = a.payload; })
       .addCase(thunk.rejected, s => { s.loading = false; });
    });
  },
});
export default cartSlice.reducer;