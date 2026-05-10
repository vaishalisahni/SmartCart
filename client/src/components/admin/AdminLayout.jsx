import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiGrid, FiPackage, FiShoppingBag, FiUsers, FiTag, FiLogOut, FiShoppingCart, FiMessageCircle } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const links = [
  { to: '/admin',           label: 'Dashboard', icon: <FiGrid size={17} />,          end: true },
  { to: '/admin/products',  label: 'Products',  icon: <FiShoppingBag size={17} /> },
  { to: '/admin/orders',    label: 'Orders',    icon: <FiPackage size={17} /> },
  { to: '/admin/users',     label: 'Users',     icon: <FiUsers size={17} /> },
  { to: '/admin/coupons',   label: 'Coupons',   icon: <FiTag size={17} /> },
  { to: '/admin/chat',      label: 'Live Chat', icon: <FiMessageCircle size={17} /> },
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
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-primary-950 text-white flex flex-col border-r border-primary-900">
        {/* Logo */}
        <div className="p-5 border-b border-primary-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
              <FiShoppingCart size={15} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-white" style={{ fontFamily: 'Syne, sans-serif' }}>SmartCart</p>
              <p className="text-xs text-primary-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-primary-300 hover:bg-primary-900/60 hover:text-white'
                }`
              }>
              {l.icon} {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-primary-900/80 space-y-0.5">
          <NavLink to="/" className="flex items-center gap-3 px-3 py-2.5 text-sm text-primary-300 hover:text-white hover:bg-primary-900/60 rounded-xl transition-all">
            <FiShoppingCart size={16} /> View Store
          </NavLink>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-xl transition-all">
            <FiLogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-surface-50 dark:bg-surface-950">
        <Outlet />
      </main>
    </div>
  );
}