import { useState, useMemo, useEffect } from 'react';
import { generateDailyRoster, LOCATIONS } from '../utils/rosterLogic';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

const OVERRIDES_COLLECTION_NAME = import.meta.env.DEV ? 'dev_overrides' : 'overrides';

const RosterGenerator = ({ staffList }) => {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);

    // Firestore からの上書きデータ
    const [overrides, setOverrides] = useState({});

    useEffect(() => {
        const collRef = collection(db, OVERRIDES_COLLECTION_NAME);
        const unsub = onSnapshot(collRef, (snapshot) => {
            const data = {};
            snapshot.docs.forEach(d => {
                data[d.id] = d.data();
            });
            setOverrides(data);
        });
        return () => unsub();
    }, []);

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    // 年月・担当者・上書きデータが変更されるたびに当番表を再計算
    const dailyRoster = useMemo(() => {
        return generateDailyRoster(staffList, year, month, overrides);
    }, [staffList, year, month, overrides]);

    // カレンダー用のパディング作成（月の1日の曜日から計算、平日のみ考慮）
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0(日) 〜 6(土)
    let paddingCount = 0;
    if (firstDayOfWeek >= 1 && firstDayOfWeek <= 5) {
        paddingCount = firstDayOfWeek - 1; // 月=0, 火=1...
    } else {
        paddingCount = 0; // 土日の場合は次の月曜が最初の枠に来るのでパディング不要
    }
    const paddingDays = Array.from({ length: paddingCount });

    // モーダル管理
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDateStr, setSelectedDateStr] = useState('');
    const [selectedLoc, setSelectedLoc] = useState('');
    const [overrideStaffId, setOverrideStaffId] = useState('');

    const handleOpenModal = (dateStr, loc, currentAssignee) => {
        setSelectedDateStr(dateStr);
        setSelectedLoc(loc);
        setOverrideStaffId(currentAssignee ? currentAssignee.id : 'clear');
        setModalOpen(true);
    };

    const handleSaveOverride = async () => {
        const docRef = doc(db, OVERRIDES_COLLECTION_NAME, selectedDateStr);
        const dayData = overrides[selectedDateStr] || {};

        try {
            await setDoc(docRef, {
                ...dayData,
                [selectedLoc]: overrideStaffId === 'clear' ? null : overrideStaffId
            }, { merge: true });
            setModalOpen(false);
        } catch (e) {
            console.error("Failed to save override", e);
            alert("保存に失敗しました");
        }
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4">
                <h2 className="card-title" style={{ marginBottom: 0 }}>🗓️ 月間清掃当番カレンダー</h2>

                {/* 月選択ナビゲーション */}
                <div className="flex items-center gap-4">
                    <button className="btn" style={{ background: 'var(--border)' }} onClick={handlePrevMonth}>
                        ◀ 前月
                    </button>
                    <span style={{ fontSize: '1.25rem', fontWeight: 600, minWidth: '100px', textAlign: 'center' }}>
                        {year}年 {month}月
                    </span>
                    <button className="btn" style={{ background: 'var(--border)' }} onClick={handleNextMonth}>
                        次月 ▶
                    </button>
                </div>
            </div>

            {staffList.length < 4 ? (
                <div className="empty-state" style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                    ⚠️ 当番を構成するための担当者が不足しています。（最低4名の登録が必要です）<br />
                    現在の登録数: {staffList.length}名
                </div>
            ) : (
                <div className="calendar-container" style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', background: 'var(--border)', border: '1px solid var(--border)' }}>
                        {['月', '火', '水', '木', '金'].map(d => (
                            <div key={d} style={{ background: 'var(--primary-light)', padding: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
                                {d}
                            </div>
                        ))}

                        {/* 1日より前の空白 */}
                        {paddingDays.map((_, i) => (
                            <div key={`pad-${i}`} style={{ background: 'var(--surface)', padding: '0.5rem', minHeight: '120px' }}></div>
                        ))}

                        {/* 日付の描画（土日を除外） */}
                        {dailyRoster.filter(d => d.dayOfWeek !== 0 && d.dayOfWeek !== 6).map(dayInfo => (
                            <div key={dayInfo.dateStr} style={{
                                background: 'var(--surface)',
                                padding: '0.5rem',
                                minHeight: '120px',
                                display: 'flex', flexDirection: 'column',
                                borderTop: dayInfo.isOverride ? '2px solid var(--primary)' : '1px solid transparent'
                            }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: dayInfo.dayOfWeek === 0 ? 'red' : dayInfo.dayOfWeek === 6 ? 'blue' : 'inherit' }}>
                                    {dayInfo.date.getDate()}
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {LOCATIONS.map(loc => {
                                        const assignee = dayInfo.assignments[loc];
                                        return (
                                            <div
                                                key={loc}
                                                title="クリックして担当者を変更"
                                                onClick={() => handleOpenModal(dayInfo.dateStr, loc, assignee)}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '4px',
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '2px'
                                                }}>
                                                <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{loc}</span>
                                                <span style={{ fontWeight: 'bold' }}>{assignee ? assignee.name : '-'}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 上書き用モーダル */}
            {modalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '400px' }}>
                        <h3 style={{ marginTop: 0 }}>担当者の変更</h3>
                        <p style={{ color: 'var(--text-muted)' }}>{selectedDateStr} の <strong>{selectedLoc}</strong> の担当を設定します</p>

                        <div style={{ margin: '1.5rem 0' }}>
                            <select
                                value={overrideStaffId}
                                onChange={(e) => setOverrideStaffId(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                            >
                                <option value="clear">（担当なし / 元のローテーションに戻す）</option>
                                {staffList.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.department})</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button className="btn" style={{ background: 'var(--border)' }} onClick={() => setModalOpen(false)}>キャンセル</button>
                            <button className="btn btn-primary" onClick={handleSaveOverride}>保存</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RosterGenerator;
