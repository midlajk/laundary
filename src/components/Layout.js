// src/layout/Layout.js
import { Link, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'Dashboard', path: '/' },
  { name: 'Customers', path: '/customers' },
  { name: 'Orders', path: '/orders' },
  { name: 'Services', path: '/services' },
  { name: 'Reports', path: '/reports' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg hidden md:block">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">LaundryPro</h1>
          <p className="text-sm text-gray-500">Management System</p>
        </div>
        <nav className="mt-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-6 py-3 text-sm font-medium transition ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white shadow px-4 py-3 flex items-center justify-between md:hidden">
          <h1 className="text-lg font-semibold text-blue-600">LaundryPro</h1>
          {/* You can add a mobile menu button here */}
        </header>

        <main className="p-4 md:p-6 overflow-y-auto flex-grow">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
