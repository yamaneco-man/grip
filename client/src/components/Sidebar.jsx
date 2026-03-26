import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ brand, badge, badgeClass, navSections, user, onLogout }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-[58px] flex items-center px-5 gap-2.5 border-b"
        style={{ background: 'var(--white)', borderColor: 'var(--border)' }}>
        <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center font-bold text-[13px] text-white"
          style={{ background: 'var(--text)' }}>G</div>
        <span className="font-bold text-[17px]" style={{ color: 'var(--text)' }}>{brand}</span>
        {badge && (
          <span className={`ml-auto text-[9px] font-mono font-medium px-2 py-0.5 rounded-xl ${badgeClass || ''}`}
            style={!badgeClass ? { color: 'var(--text2)', background: 'var(--bg)', border: '1px solid var(--border2)' } : {}}>
            {badge}
          </span>
        )}
        {/* モバイル閉じるボタン */}
        <button onClick={() => setOpen(false)} className="lg:hidden ml-auto text-[20px]" style={{ color: 'var(--text3)' }}>✕</button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2.5 overflow-y-auto">
        {navSections.map((section, si) => (
          <div key={si}>
            <div className="px-[18px] pt-3.5 pb-1 text-[9.5px] font-semibold uppercase tracking-widest font-mono"
              style={{ color: 'var(--text3)' }}>{section.label}</div>
            {section.items.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              return (
                <Link key={item.path} to={item.path} onClick={() => setOpen(false)}
                  className="relative flex items-center gap-2.5 px-[18px] py-2 text-[13.5px] transition-all"
                  style={{
                    color: isActive ? 'var(--text)' : 'var(--text2)',
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? 'var(--white)' : 'transparent',
                    boxShadow: isActive ? 'inset 0 0 0 1px var(--border)' : 'none',
                  }}>
                  <span className="w-4 text-center text-[14px]" style={{ opacity: isActive ? 1 : 0.55 }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span className="ml-auto text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-lg"
                      style={{
                        background: item.countColor === 'red' ? 'var(--red-l)' : item.countColor === 'green' ? 'var(--green-l)' : 'var(--blue-l)',
                        color: item.countColor === 'red' ? 'var(--red)' : item.countColor === 'green' ? 'var(--green)' : 'var(--blue)',
                      }}>
                      {item.count}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute right-0 top-1 bottom-1 w-[3px] rounded-l-sm" style={{ background: 'var(--text)' }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t px-3.5 py-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[13px] text-white shrink-0"
            style={{ background: user?.avatarBg || 'var(--text)' }}>
            {user?.initial || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate" style={{ color: 'var(--text)' }}>{user?.name || 'User'}</div>
            <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{user?.sub || ''}</div>
          </div>
        </div>
        <button onClick={onLogout}
          className="w-full mt-1.5 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all hover:bg-red-50"
          style={{ color: 'var(--red)', border: '1px solid var(--border)' }}>
          ログアウト
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* モバイル: ハンバーガーボタン */}
      <button onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-[60] w-10 h-10 rounded-lg flex items-center justify-center text-[20px]"
        style={{ background: 'var(--white)', border: '1px solid var(--border)', color: 'var(--text)' }}>
        ☰
      </button>

      {/* モバイル: オーバーレイ */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-[55] bg-black/30" onClick={() => setOpen(false)} />
      )}

      {/* モバイル: スライドサイドバー */}
      <aside className={`lg:hidden fixed top-0 left-0 z-[60] w-[280px] min-h-screen flex flex-col border-r transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}>
        {sidebarContent}
      </aside>

      {/* PC: 固定サイドバー */}
      <aside className="hidden lg:flex w-[232px] min-h-screen fixed top-0 left-0 z-50 flex-col border-r"
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}>
        {sidebarContent}
      </aside>
    </>
  );
}
