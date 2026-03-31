import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const BOOKING_STATUSES = [
  { key: 'confirmed', label: '確定', color: 'var(--green)' },
  { key: 'cancelled', label: 'キャンセル', color: 'var(--red)' },
  { key: 'completed', label: '完了', color: 'var(--accent)' },
  { key: 'no_show', label: '欠席', color: 'var(--text3)' },
];

const WEEKDAYS = [
  { key: 0, label: '日' },
  { key: 1, label: '月' },
  { key: 2, label: '火' },
  { key: 3, label: '水' },
  { key: 4, label: '木' },
  { key: 5, label: '金' },
  { key: 6, label: '土' },
];

export default function CalendarBooking() {
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('slots');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  // フォーム
  const [slotTitle, setSlotTitle] = useState('');
  const [slotType, setSlotType] = useState('weekday');
  const [weekday, setWeekday] = useState(1);
  const [specificDate, setSpecificDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [maxCapacity, setMaxCapacity] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [slotsData, bookingsData] = await Promise.all([
        api.getCalendarSlots().catch(() => []),
        api.getCalendarBookings().catch(() => []),
      ]);
      setSlots(slotsData || []);
      setBookings(bookingsData || []);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSlotTitle('');
    setSlotType('weekday');
    setWeekday(1);
    setSpecificDate('');
    setStartTime('09:00');
    setEndTime('10:00');
    setMaxCapacity(1);
    setEditingSlot(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!slotTitle.trim()) return;
    setSaving(true);
    try {
      const data = {
        title: slotTitle.trim(),
        slot_type: slotType,
        weekday: slotType === 'weekday' ? weekday : null,
        specific_date: slotType === 'date' ? specificDate : null,
        start_time: startTime,
        end_time: endTime,
        max_capacity: maxCapacity,
      };
      if (editingSlot) {
        const updated = await api.updateCalendarSlot(editingSlot.id, data);
        setSlots(slots.map(s => s.id === editingSlot.id ? { ...s, ...updated } : s));
      } else {
        const created = await api.createCalendarSlot(data);
        setSlots([created, ...slots]);
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSlot = (slot) => {
    setSlotTitle(slot.title || '');
    setSlotType(slot.slot_type || 'weekday');
    setWeekday(slot.weekday ?? 1);
    setSpecificDate(slot.specific_date || '');
    setStartTime(slot.start_time || '09:00');
    setEndTime(slot.end_time || '10:00');
    setMaxCapacity(slot.max_capacity || 1);
    setEditingSlot(slot);
    setShowForm(true);
  };

  const handleDeleteSlot = async (id) => {
    if (!confirm('この予約枠を削除しますか？')) return;
    try {
      await api.deleteCalendarSlot(id);
      setSlots(slots.filter(s => s.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateBookingStatus = async (id, status) => {
    try {
      await api.updateCalendarBookingStatus(id, status);
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (d) => {
    if (!d) return '--';
    const date = new Date(d);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>カレンダー予約</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>予約枠の管理と予約状況の確認</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          + 予約枠作成
        </button>
      </div>

      {/* タブ */}
      <div className="flex gap-1 mb-5">
        <button onClick={() => setActiveTab('slots')}
          className="text-[12px] font-medium px-4 py-2 rounded-lg transition-all"
          style={{
            background: activeTab === 'slots' ? 'var(--text)' : 'var(--surface)',
            color: activeTab === 'slots' ? '#fff' : 'var(--text2)',
          }}>
          予約枠
        </button>
        <button onClick={() => setActiveTab('bookings')}
          className="text-[12px] font-medium px-4 py-2 rounded-lg transition-all"
          style={{
            background: activeTab === 'bookings' ? 'var(--text)' : 'var(--surface)',
            color: activeTab === 'bookings' ? '#fff' : 'var(--text2)',
          }}>
          予約一覧
        </button>
      </div>

      {/* 予約枠作成/編集フォーム */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
            {editingSlot ? '予約枠編集' : '新規予約枠'}
          </h3>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>タイトル</label>
            <input type="text" value={slotTitle} onChange={e => setSlotTitle(e.target.value)} required
              placeholder="例: 個別相談" className="w-full px-3 py-2 rounded-lg text-[12px]"
              style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>枠タイプ</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text)' }}>
                  <input type="radio" name="slotType" value="weekday" checked={slotType === 'weekday'}
                    onChange={e => setSlotType(e.target.value)} />
                  曜日指定
                </label>
                <label className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text)' }}>
                  <input type="radio" name="slotType" value="date" checked={slotType === 'date'}
                    onChange={e => setSlotType(e.target.value)} />
                  日付指定
                </label>
              </div>
            </div>
            <div>
              {slotType === 'weekday' ? (
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>曜日</label>
                  <select value={weekday} onChange={e => setWeekday(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg text-[12px]"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                    {WEEKDAYS.map(w => <option key={w.key} value={w.key}>{w.label}曜日</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>日付</label>
                  <input type="date" value={specificDate} onChange={e => setSpecificDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-[12px]"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>開始時間</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>終了時間</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>最大人数</label>
              <input type="number" value={maxCapacity} onChange={e => setMaxCapacity(Number(e.target.value))} min={1}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {saving ? '保存中...' : editingSlot ? '更新する' : '作成する'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-5 py-2 rounded-lg text-[12px] font-medium"
              style={{ color: 'var(--text2)', border: '1px solid var(--border)' }}>
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* 予約枠一覧 */}
      {activeTab === 'slots' && (
        <>
          {slots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {slots.map(slot => (
                <div key={slot.id} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{slot.title}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditSlot(slot)}
                        className="text-[10px] px-2 py-0.5 rounded"
                        style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}>
                        編集
                      </button>
                      <button onClick={() => handleDeleteSlot(slot.id)}
                        className="text-[10px] px-2 py-0.5 rounded"
                        style={{ color: 'var(--red)' }}>
                        削除
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--surface)', color: 'var(--text2)' }}>
                      {slot.slot_type === 'weekday'
                        ? `${WEEKDAYS.find(w => w.key === slot.weekday)?.label || ''}曜日`
                        : formatDate(slot.specific_date)
                      }
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>
                      {slot.start_time} - {slot.end_time}
                    </span>
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>
                      最大{slot.max_capacity}名
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="text-4xl mb-3">📅</div>
              <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>予約枠がありません</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「+ 予約枠作成」から予約枠を追加しましょう</p>
            </div>
          )}
        </>
      )}

      {/* 予約一覧 */}
      {activeTab === 'bookings' && (
        <>
          {bookings.length > 0 ? (
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr style={{ background: 'var(--surface)' }}>
                    <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>日付</th>
                    <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>予約枠</th>
                    <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>ゲスト名</th>
                    <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>ステータス</th>
                    <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-3 py-2" style={{ color: 'var(--text)' }}>{formatDate(b.booking_date)}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--text)' }}>{b.slot_title || '--'}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--text)' }}>{b.guest_name || '--'}</td>
                      <td className="px-3 py-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                          color: BOOKING_STATUSES.find(s => s.key === b.status)?.color || 'var(--text3)',
                          background: 'var(--surface)',
                        }}>
                          {BOOKING_STATUSES.find(s => s.key === b.status)?.label || b.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <select value={b.status} onChange={e => handleUpdateBookingStatus(b.id, e.target.value)}
                          className="text-[10px] px-1 py-0.5 rounded"
                          style={{ border: '1px solid var(--border2)', color: 'var(--text)' }}>
                          {BOOKING_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="text-4xl mb-3">📋</div>
              <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>予約がありません</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
