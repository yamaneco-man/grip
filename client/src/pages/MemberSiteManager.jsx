import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

export default function MemberSiteManager() {
  const [view, setView] = useState('sites'); // sites / courses / lessons / members
  const [loading, setLoading] = useState(true);

  // サイト
  const [sites, setSites] = useState([]);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteDesc, setSiteDesc] = useState('');
  const [creatingSite, setCreatingSite] = useState(false);

  // コース
  const [selectedSite, setSelectedSite] = useState(null);
  const [courses, setCourses] = useState([]);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [coursePrice, setCoursePrice] = useState(0);
  const [creatingCourse, setCreatingCourse] = useState(false);

  // レッスン
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [creatingLesson, setCreatingLesson] = useState(false);
  const [generatingLesson, setGeneratingLesson] = useState(false);

  // 会員
  const [members, setMembers] = useState([]);

  useEffect(() => {
    api.getMemberSites().then(setSites).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreateSite = async (e) => {
    e.preventDefault();
    if (!siteName.trim()) return;
    setCreatingSite(true);
    try {
      const created = await api.createMemberSite({ name: siteName.trim(), description: siteDesc.trim() });
      setSites([created, ...sites]);
      setSiteName('');
      setSiteDesc('');
      setShowSiteForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingSite(false);
    }
  };

  const openCourses = async (site) => {
    setSelectedSite(site);
    setView('courses');
    setLoading(true);
    try {
      const c = await api.getCourses(site.id);
      setCourses(c || []);
    } catch {} finally { setLoading(false); }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseName.trim()) return;
    setCreatingCourse(true);
    try {
      const created = await api.createCourse(selectedSite.id, {
        name: courseName.trim(),
        description: courseDesc.trim(),
        price: coursePrice,
      });
      setCourses([created, ...courses]);
      setCourseName('');
      setCourseDesc('');
      setCoursePrice(0);
      setShowCourseForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingCourse(false);
    }
  };

  const openLessons = async (course) => {
    setSelectedCourse(course);
    setView('lessons');
    setLoading(true);
    try {
      const l = await api.getLessons(course.id);
      setLessons(l || []);
    } catch {} finally { setLoading(false); }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    if (!lessonTitle.trim()) return;
    setCreatingLesson(true);
    try {
      const created = await api.createLesson(selectedCourse.id, {
        title: lessonTitle.trim(),
        content: lessonContent.trim(),
      });
      setLessons([...lessons, created]);
      setLessonTitle('');
      setLessonContent('');
      setShowLessonForm(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreatingLesson(false);
    }
  };

  const handleAiGenerateLesson = async () => {
    if (!lessonTitle.trim()) { alert('レッスンタイトルを入力してください'); return; }
    setGeneratingLesson(true);
    try {
      const result = await api.aiGenerateLesson({
        course_id: selectedCourse.id,
        title: lessonTitle.trim(),
      });
      setLessonContent(result.content || '');
    } catch (err) {
      alert(err.message);
    } finally {
      setGeneratingLesson(false);
    }
  };

  const openMembers = async () => {
    setView('members');
    setLoading(true);
    try {
      const m = await api.getMemberSiteMembers?.() || [];
      setMembers(m);
    } catch {} finally { setLoading(false); }
  };

  const goBack = () => {
    if (view === 'lessons') { setView('courses'); setSelectedCourse(null); }
    else if (view === 'courses' || view === 'members') { setView('sites'); setSelectedSite(null); }
  };

  if (loading && view === 'sites' && sites.length === 0) return <div className="text-center py-20" style={{ color: 'var(--text3)' }}>読み込み中...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            {view !== 'sites' && (
              <button onClick={goBack} className="text-[12px] font-medium px-2 py-1 rounded" style={{ color: 'var(--accent)' }}>← 戻る</button>
            )}
            <h2 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>
              {view === 'sites' && '会員サイト管理'}
              {view === 'courses' && `${selectedSite?.name} — コース一覧`}
              {view === 'lessons' && `${selectedCourse?.name} — レッスン管理`}
              {view === 'members' && '会員一覧'}
            </h2>
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>
            {view === 'sites' && '会員サイト・コース・レッスンの作成と管理'}
            {view === 'courses' && 'コースの作成・編集'}
            {view === 'lessons' && 'レッスンの追加・AI生成'}
            {view === 'members' && '会員のアクセス権管理'}
          </p>
        </div>
        <div className="flex gap-2">
          {view === 'sites' && (
            <>
              <button onClick={openMembers}
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
                style={{ background: 'var(--green)' }}>会員一覧</button>
              <button onClick={() => setShowSiteForm(!showSiteForm)}
                className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
                style={{ background: 'var(--text)' }}>＋ サイト作成</button>
            </>
          )}
          {view === 'courses' && (
            <button onClick={() => setShowCourseForm(!showCourseForm)}
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
              style={{ background: 'var(--text)' }}>＋ コース作成</button>
          )}
          {view === 'lessons' && (
            <button onClick={() => setShowLessonForm(!showLessonForm)}
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:-translate-y-px"
              style={{ background: 'var(--text)' }}>＋ レッスン追加</button>
          )}
        </div>
      </div>

      {loading && <div className="text-center py-10" style={{ color: 'var(--text3)' }}>読み込み中...</div>}

      {/* サイト一覧 */}
      {!loading && view === 'sites' && (
        <>
          {showSiteForm && (
            <form onSubmit={handleCreateSite} className="rounded-xl p-4 mb-4 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>サイト名</label>
                  <input type="text" value={siteName} onChange={e => setSiteName(e.target.value)} required
                    placeholder="例: プレミアム会員サイト" className="w-full px-3 py-2 rounded-lg text-[12px]"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>説明</label>
                  <input type="text" value={siteDesc} onChange={e => setSiteDesc(e.target.value)}
                    placeholder="サイトの説明" className="w-full px-3 py-2 rounded-lg text-[12px]"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                </div>
              </div>
              <button type="submit" disabled={creatingSite}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--accent)' }}>
                {creatingSite ? '作成中...' : '作成する'}
              </button>
            </form>
          )}

          {sites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sites.map(site => (
                <div key={site.id} className="rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-px"
                  style={{ background: 'var(--white)', border: '1px solid var(--border)' }}
                  onClick={() => openCourses(site)}>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{site.name}</span>
                  {site.description && <p className="text-[11px] mt-1" style={{ color: 'var(--text3)' }}>{site.description}</p>}
                  <p className="text-[11px] mt-2 font-mono" style={{ color: 'var(--text3)' }}>{site.course_count || 0}コース</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="text-4xl mb-3">🎓</div>
              <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>会員サイトがありません</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ サイト作成」から作成しましょう</p>
            </div>
          )}
        </>
      )}

      {/* コース一覧 */}
      {!loading && view === 'courses' && (
        <>
          {showCourseForm && (
            <form onSubmit={handleCreateCourse} className="rounded-xl p-4 mb-4 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>コース名</label>
                  <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} required
                    placeholder="例: 入門コース" className="w-full px-3 py-2 rounded-lg text-[12px]"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>説明</label>
                  <input type="text" value={courseDesc} onChange={e => setCourseDesc(e.target.value)}
                    placeholder="コースの説明" className="w-full px-3 py-2 rounded-lg text-[12px]"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>価格（円）</label>
                  <input type="number" value={coursePrice} onChange={e => setCoursePrice(Number(e.target.value))} min={0}
                    className="w-full px-3 py-2 rounded-lg text-[12px]"
                    style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
                </div>
              </div>
              <button type="submit" disabled={creatingCourse}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--accent)' }}>
                {creatingCourse ? '作成中...' : '作成する'}
              </button>
            </form>
          )}

          {courses.length > 0 ? (
            <div className="space-y-2">
              {courses.map(course => (
                <div key={course.id} className="rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all hover:-translate-y-px"
                  style={{ background: 'var(--white)', border: '1px solid var(--border)' }}
                  onClick={() => openLessons(course)}>
                  <div>
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{course.name}</span>
                    {course.description && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>{course.description}</p>}
                  </div>
                  <div className="text-right">
                    <span className="text-[12px] font-mono" style={{ color: 'var(--text)' }}>¥{(course.price || 0).toLocaleString()}</span>
                    <p className="text-[10px]" style={{ color: 'var(--text3)' }}>{course.lesson_count || 0}レッスン</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="text-4xl mb-3">📚</div>
              <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>コースがありません</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ コース作成」から作成しましょう</p>
            </div>
          )}
        </>
      )}

      {/* レッスン管理 */}
      {!loading && view === 'lessons' && (
        <>
          {showLessonForm && (
            <form onSubmit={handleCreateLesson} className="rounded-xl p-4 mb-4 space-y-3" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div>
                <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text2)' }}>レッスンタイトル</label>
                <input type="text" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} required
                  placeholder="例: はじめに" className="w-full px-3 py-2 rounded-lg text-[12px]"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>コンテンツ</label>
                  <button type="button" onClick={handleAiGenerateLesson} disabled={generatingLesson}
                    className="text-[10px] font-medium px-2 py-1 rounded text-white disabled:opacity-50"
                    style={{ background: 'var(--accent)' }}>
                    {generatingLesson ? 'AI生成中...' : 'AIで生成'}
                  </button>
                </div>
                <textarea value={lessonContent} onChange={e => setLessonContent(e.target.value)} rows={8}
                  placeholder="レッスン内容を入力（またはAIで生成）..." className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
                  style={{ border: '1px solid var(--border2)', color: 'var(--text)' }} />
              </div>
              <button type="submit" disabled={creatingLesson}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--accent)' }}>
                {creatingLesson ? '追加中...' : 'レッスンを追加'}
              </button>
            </form>
          )}

          {lessons.length > 0 ? (
            <div className="space-y-2">
              {lessons.map((lesson, i) => (
                <div key={lesson.id} className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                    style={{ background: 'var(--accent)' }}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{lesson.title}</span>
                    {lesson.content && <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text3)' }}>{lesson.content.substring(0, 80)}...</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
              <div className="text-4xl mb-3">📝</div>
              <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>レッスンがありません</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>「＋ レッスン追加」から追加しましょう</p>
            </div>
          )}
        </>
      )}

      {/* 会員一覧 */}
      {!loading && view === 'members' && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--border)' }}>
          {members.length > 0 ? (
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: 'var(--surface)' }}>
                  <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>名前</th>
                  <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>メール</th>
                  <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>アクセス権</th>
                  <th className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text2)' }}>登録日</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{m.name || '—'}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{m.email}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(m.courses || []).map(c => (
                          <span key={c} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text2)' }}>{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--text3)' }}>{m.created_at?.substring(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-[14px] font-medium" style={{ color: 'var(--text2)' }}>会員がいません</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
