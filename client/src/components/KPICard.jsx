import React from 'react';

const COLOR_MAP = {
  green: { border: 'var(--green)', val: 'var(--green)', ico: 'var(--green-l)' },
  red: { border: 'var(--red)', val: 'var(--red)', ico: 'var(--red-l)' },
  blue: { border: 'var(--blue)', val: 'var(--blue)', ico: 'var(--blue-l)' },
  amber: { border: 'var(--border2)', val: 'var(--text2)', ico: 'var(--bg)' },
  purple: { border: 'var(--purple)', val: 'var(--purple)', ico: 'var(--purple-l)' },
};

export default function KPICard({ label, value, icon, color = 'blue', delta, deltaDir, deltaText }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <div className="rounded-xl p-[18px] cursor-default transition-all hover:shadow-lg hover:-translate-y-px"
      style={{
        background: 'var(--white)', border: '1px solid var(--border)',
        borderTop: `3px solid ${c.border}`,
      }}>
      <div className="flex items-start justify-between mb-3.5">
        <div className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>{label}</div>
        <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[16px]"
          style={{ background: c.ico }}>{icon}</div>
      </div>
      <div className="text-[30px] font-bold leading-none mb-2" style={{ color: c.val, letterSpacing: '-1px' }}>
        {value}
      </div>
      {(delta || deltaText) && (
        <div className="flex items-center gap-1.5 text-[12px]">
          {delta && (
            <span className="font-semibold" style={{ color: deltaDir === 'up' ? 'var(--green)' : 'var(--red)' }}>
              {deltaDir === 'up' ? '↑' : '↓'} {delta}
            </span>
          )}
          {deltaText && <span style={{ color: 'var(--text3)' }}>{deltaText}</span>}
        </div>
      )}
    </div>
  );
}
