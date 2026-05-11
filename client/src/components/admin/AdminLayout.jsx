import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FiGrid, FiPackage, FiShoppingBag, FiUsers, FiTag, FiLogOut, FiShoppingCart, FiMessageCircle, FiMenu, FiX } from 'react-icons/fi';
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
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out');
    navigate('/');
  };

  const SidebarContent = () => (
    <>
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
    </>
  );

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-shrink-0 bg-primary-950 text-white flex-col border-r border-primary-900">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`fixed top-0 left-0 h-full w-60 z-50 bg-primary-950 text-white flex flex-col border-r border-primary-900 transform transition-transform duration-300 md:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-primary-400 hover:text-white rounded-lg transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-primary-950 border-b border-primary-900 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-primary-300 hover:text-white rounded-xl transition-colors"
          >
            <FiMenu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded-md flex items-center justify-center">
              <FiShoppingCart size={12} className="text-white" />
            </div>
            <p className="font-bold text-sm text-white" style={{ fontFamily: 'Syne, sans-serif' }}>SmartCart Admin</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-surface-50 dark:bg-surface-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}