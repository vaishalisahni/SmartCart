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
    if (error) {
      toast.error('Google login failed. Please try again.');
      navigate('/login');
      return;
    }
    if (token) {
      localStorage.setItem('accessToken', token);
      dispatch(loadUser()).then(() => {
        toast.success('Signed in with Google! 🎉');
        navigate('/');
      });
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center mx-auto">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
        <div>
          <p className="font-semibold text-surface-700 dark:text-surface-300">Signing you in with Google...</p>
          <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
}