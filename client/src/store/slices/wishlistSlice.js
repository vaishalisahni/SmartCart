// wishlistSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../services/api';

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async () => { const { data } = await API.get('/wishlist'); return data.wishlist; });
export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (productId) => { const { data } = await API.post('/wishlist/toggle', { productId }); return data; });

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { wishlist: null },
  reducers: {},
  extraReducers: b => {
    b.addCase(fetchWishlist.fulfilled, (s, a) => { s.wishlist = a.payload; })
     .addCase(toggleWishlist.fulfilled, (s, a) => {
       if (!s.wishlist) return;
       if (a.payload.added) s.wishlist.products.push({ _id: a.meta.arg });
       else s.wishlist.products = s.wishlist.products.filter(p => (p._id || p) !== a.meta.arg);
     });
  },
});
export default wishlistSlice.reducer;