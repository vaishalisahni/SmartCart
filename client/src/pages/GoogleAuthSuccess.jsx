import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

export default function GoogleAuthSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');
    if (error) { toast.error('Google login failed'); navigate('/login'); return; }
    if (token) {
      localStorage.setItem('accessToken', token);
      dispatch(loadUser()).then(() => {
        toast.success('Logged in with Google! 🎉');
        navigate('/');
      });
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Signing you in with Google...</p>
      </div>
    </div>
  );
}