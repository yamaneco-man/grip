import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'ダッシュボード', icon: '📊' },
  { path: '/lp', label: 'LP管理', icon: '📄' },
  { path: '/followers', label: 'LINE友達', icon: '👥' },
  { path: '/churn', label: '離脱検知', icon: '🔔' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('grip_token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      {/* サイドバー */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6 border-b border-indigo-800">
          <h1 className="text-2xl font-bold">GRIP</h1>
          <p className="text-indigo-300 text-sm mt-1">LINEマーケティング</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                location.pathname === item.path
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-800">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-indigo-300 hover:text-white transition"
          >
            ログアウト
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
