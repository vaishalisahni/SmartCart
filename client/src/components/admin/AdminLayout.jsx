import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiGrid, FiPackage, FiShoppingBag, FiUsers, FiTag, FiLogOut, FiShoppingCart, FiMessageCircle } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const links = [
  { to: '/admin', label: 'Dashboard', icon: <FiGrid size={18} />, end: true },
  { to: '/admin/products', label: 'Products', icon: <FiShoppingBag size={18} /> },
  { to: '/admin/orders', label: 'Orders', icon: <FiPackage size={18} /> },
  { to: '/admin/users', label: 'Users', icon: <FiUsers size={18} /> },
  { to: '/admin/coupons', label: 'Coupons', icon: <FiTag size={18} /> },
  { to: '/admin/chat', label: 'Live Chat', icon: <FiMessageCircle size={18} /> },
];

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-gray-900 text-white flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <FiShoppingCart size={16} />
            </div>
            <div>
              <p className="font-bold text-sm">SmartCart</p>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              {l.icon} {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800 space-y-1">
          <NavLink to="/" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition">
            <FiShoppingCart size={16} /> View Store
          </NavLink>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-gray-800 rounded-lg transition">
            <FiLogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}