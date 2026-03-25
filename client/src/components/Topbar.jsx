import React from 'react';

export default function Topbar({ title, subtitle, actions, systemStatus }) {
  return (
    <header className="fixed top-0 right-0 h-[58px] flex items-center px-7 gap-3.5 z-40 border-b"
      style={{ left: '232px', background: 'var(--white)', borderColor: 'var(--border)' }}>
      <div className="text-[16px] font-semibold" style={{ color: 'var(--text)', letterSpacing: '-0.2px' }}>
        {title}
      </div>
      {subtitle && (
        <div className="text-[12px] font-mono ml-1" style={{ color: 'var(--text3)' }}>{subtitle}</div>
      )}
      <div className="ml-auto flex items-center gap-2.5">
        {systemStatus && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-mono font-medium"
            style={{ background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--text2)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--green)' }} />
            {systemStatus}
          </div>
        )}
        {actions}
      </div>
    </header>
  );
}
