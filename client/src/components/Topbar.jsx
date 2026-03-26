import React from 'react';

export default function Topbar({ title, subtitle, actions, systemStatus }) {
  return (
    <header className="fixed top-0 right-0 h-[58px] flex items-center px-4 lg:px-7 gap-2 lg:gap-3.5 z-40 border-b"
      style={{ left: '0', background: 'var(--white)', borderColor: 'var(--border)' }}>
      {/* モバイル: ハンバーガーの余白 */}
      <div className="w-12 lg:hidden" />
      <div className="text-[14px] lg:text-[16px] font-semibold truncate" style={{ color: 'var(--text)', letterSpacing: '-0.2px' }}>
        {title}
      </div>
      {subtitle && (
        <div className="hidden sm:block text-[12px] font-mono ml-1" style={{ color: 'var(--text3)' }}>{subtitle}</div>
      )}
      <div className="ml-auto flex items-center gap-2">
        {systemStatus && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-mono font-medium"
            style={{ background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--text2)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--green)' }} />
            {systemStatus}
          </div>
        )}
        <div className="hidden md:flex items-center gap-2">
          {actions}
        </div>
      </div>
    </header>
  );
}
