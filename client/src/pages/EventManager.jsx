import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

const BOOKING_STATUSES = [
  { key: 'confirmed', label: '確定', color: 'var(--green)' },
  { key: 'pending', label: '保留', color: 'var(--text3)' },
  { key: 'cancelled', label: 'キャンセル', color: 'var(--red)' },
];

export default function EventManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // フォーム
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState(0);
  const [reminderHours, setReminderHours] = useState(24);

  // 予約者
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // 予約追加
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [creatingBooking, setCreatingBooking] = useState(false);

  useEffect(() => {
    api.getEvents().then(setEvents).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;
    setCreating(true);
    try {
      const created = await api.createEvent({
        title: title.trim(),
        description: description.trim(),
        event_date: eventDate,
        location: location.trim(),
        capacity: capacity ? Number(capacity) : null,
        price,
        reminder_hours: reminderHours,
      });
      setEvents([created, ...events]);
      setTitle('');
      setDescription('');
      setEventDate('');
      setLocation('');
      setCapacity('');
      setPrice(0);
      setShowForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const openBookings = async (event) => {
    if (selectedEvent?.id === event.id) { setSelectedEvent(null); return; }
    setSelectedEvent(event);
    setLoadingBookings(true);
    try {
      const b = await api.getEventBookings(event.id);
      setBookings(b || []);
    } catch {} finally { setLoadingBookings(false); }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!bookingName.trim() || !bookingEmail.trim()) return;
    setCreatingBooking(true);
    try {
      const created = await api.createBooking(selectedEvent.id, {
        name: bookingName.trim(),
        email: bookingEmail.trim(),
      });
      setBookings([...bookings, created]);
      setBookingName('');
      setBookingEmail('');
      setShowBookingForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingBooking(false);
    }
  };

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await api.updateBookingStatus(selectedEvent.id, bookingId, status);
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b));
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const date = new Date(d);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (loading) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>イベント・予約管理</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>イベントの作成・予約者管理・リマインド設定</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
          style={{ background: 'var(--text)' }}>
          ＋ イベント作成
        </button>
      </div>

      {/* 作成フォーム */}
      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl p-5 mb-5 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>新規イベント</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>タイトル</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                placeholder="例: LINE活用セミナー" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>日時</label>
              <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} required
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>説明</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="イベントの説明" className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
              style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>場所</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="例: オンライン / 札幌市" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>定員</label>
              <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} min={1}
                placeholder="無制限" className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>価格（円）</label>
              <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} min={0}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>リマインド（時間前）</label>
              <input type="number" value={reminderHours} onChange={e => setReminderHours(Number(e.target.value))} min={0}
                className="w-full px-3 py-2 rounded-lg text-[12px]"
                style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
            </div>
          </div>
          <button type="submit" disabled={creating}
            className="px-5 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}>
            {creating ? '作成中...' : '作成する'}
          </button>
        </form>
      )}

      {/* イベント一覧 */}
      {events.length > 0 ? (
        <div className="space-y-3">
          {events.map(ev => (
            <div key={ev.id} className="rounded-xl p-4" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{ev.title}</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{formatDate(ev.event_date)}</span>
                    {ev.location && <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{ev.location}</span>}
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text3)' }}>
                      {ev.booking_count || 0}{ev.capacity ? `/${ev.capacity}` : ''}名
                    </span>
                    {ev.price > 0 && <span className="text-[11px] font-mono" style={{ color: 'var(--text)' }}>¥{ev.price.toLocaleString()}</span>}
                  </div>
                </div>
                <button onClick={() => openBookings(ev)}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
                  style={{ color: 'var(--accent)', border: '1px solid var(--border)' }}>
                  {selectedEvent?.id === ev.id ? '閉じる' : '予約者'}
                </button>
              </div>
              {ev.description && <p className="text-[11px] mb-2" style={{ color: 'var(--text3)' }}>{ev.description}</p>}
              {ev.reminder_hours > 0 && (
                <p className="text-[10px]" style={{ color: 'var(--text3)' }}>リマインド: {ev.reminder_hours}時間前</p>
              )}

              {/* 予約者パネル */}
              {selectedEvent?.id === ev.id && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>予約者一覧</span>
                    <button onClick={() => setShowBookingForm(!showBookingForm)}
                      className="text-[10px] font-medium px-2 py-1 rounded text-white"
                      style={{ background: 'var(--text)' }}>＋ 予約追加</button>
                  </div>

                  {showBookingForm && (
                    <form onSubmit={handleCreateBooking} className="flex gap-2 mb-3 items-end">
                      <div className="flex-1">
                        <input type="text" value={bookingName} onChange={e => setBookingName(e.target.value)}
                          placeholder="名前" className="w-full px-2 py-1.5 rounded text-[11px]"
                          style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                      </div>
                      <div className="flex-1">
                        <input type="email" value={bookingEmail} onChange={e => setBookingEmail(e.target.value)}
                          placeholder="メールアドレス" className="w-full px-2 py-1.5 rounded text-[11px]"
                          style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                      </div>
                      <button type="submit" disabled={creatingBooking}
                        className="px-3 py-1.5 rounded text-[11px] text-white disabled:opacity-50"
                        style={{ background: 'var(--accent)' }}>
                        {creatingBooking ? '...' : '追加'}
                      </button>
                    </form>
                  )}

                  {loadingBookings ? (
                    <div className="text-center py-4" style={{ color: 'var(--text3)' }}>読み込み中...</div>
                  ) : bookings.length > 0 ? (
                    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr style={{ background: 'var(--surface)' }}>
                            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>名前</th>
                            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>メール</th>
                            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>ステータス</th>
                            <th className="text-left px-3 py-2 font-medium" style={{ color: 'var(--text2)' }}>操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map(b => (
                            <tr key={b.id} style={{ borderTop: '1px solid var(--border)' }}>
                              <td className="px-3 py-2" style={{ color: 'var(--text)' }}>{b.name}</td>
                              <td className="px-3 py-2" style={{ color: 'var(--text)' }}>{b.email}</td>
                              <td className="px-3 py-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                                  color: BOOKING_STATUSES.find(s => s.key === b.status)?.color || 'var(--text3)',
                                  background: 'var(--surface)',
                                }}>{BOOKING_STATUSES.find(s => s.key === b.status)?.label || b.status}</span>
                              </td>
                              <td className="px-3 py-2">
                                <select value={b.status} onChange={e => handleUpdateStatus(b.id, e.target.value)}
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
                    <p className="text-[11px] text-center py-3" style={{ color: 'var(--text3)' }}>予約者がいません</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          <div className="text-4xl mb-3">📅</div>
          <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>イベントがありません</p>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ イベント作成」から作成しましょう</p>
        </div>
      )}
    </div>
  );
}
