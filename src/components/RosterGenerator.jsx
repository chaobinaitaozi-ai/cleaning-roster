import { useState, useMemo } from 'react';
import { generateRoster, LOCATIONS } from '../utils/rosterLogic';

const RosterGenerator = ({ staffList }) => {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);

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

    // 年月または担当者リストが変更されるたびに当番表を再計算
    const rosterWeeks = useMemo(() => {
        return generateRoster(staffList, year, month);
    }, [staffList, year, month]);

    const handleCopyToClipboard = () => {
        let text = `【清掃当番表】 ${year}年 ${month}月\n\n`;
        text += `期間 | 1Fトイレ | 1F給湯室 | 2Fトイレ | 2F給湯室 | 休み\n`;
        text += `---|---|---|---|---|---\n`;

        rosterWeeks.forEach(week => {
            const t1 = week.assignments['1Fトイレ']?.name || '-';
            const k1 = week.assignments['1F給湯室']?.name || '-';
            const t2 = week.assignments['2Fトイレ']?.name || '-';
            const k2 = week.assignments['2F給湯室']?.name || '-';
            const off = week.assignments['休み'].map(s => s.name).join(', ') || '-';
            text += `${week.label} | ${t1} | ${k1} | ${t2} | ${k2} | ${off}\n`;
        });

        navigator.clipboard.writeText(text).then(() => {
            alert('当番表をクリップボードにコピーしました（Markdown形式）');
        }).catch(err => {
            console.error('Failed to copy', err);
        });
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-4">
                <h2 className="card-title" style={{ marginBottom: 0 }}>🗓️ 清掃当番表</h2>

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
                    <button className="btn btn-primary" style={{ marginLeft: '1rem', fontSize: '0.85rem' }} onClick={handleCopyToClipboard}>
                        📋 表をコピー
                    </button>
                </div>
            </div>

            {staffList.length < 4 ? (
                <div className="empty-state" style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                    ⚠️ 当番を構成するための担当者が不足しています。（最低4名の登録が必要です）<br />
                    現在の登録数: {staffList.length}名
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', background: 'var(--surface)' }}>
                        <thead>
                            <tr style={{ background: 'var(--primary-light)' }}>
                                <th style={{ padding: '1rem', border: '1px solid var(--border)', textAlign: 'left', color: 'var(--primary-hover)' }}>対象週 (月〜日)</th>
                                {LOCATIONS.map(loc => (
                                    <th key={loc} style={{ padding: '1rem', border: '1px solid var(--border)', textAlign: 'center', width: '15%' }}>{loc}</th>
                                ))}
                                <th style={{ padding: '1rem', border: '1px solid var(--border)', textAlign: 'left' }}>休み🎌</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rosterWeeks.map((week, idx) => (
                                <tr key={idx} style={{ transition: 'background 0.2s', ':hover': { background: 'var(--background)' } }}>
                                    <td style={{ padding: '1rem', border: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-muted)' }}>
                                        {week.label}
                                    </td>
                                    {LOCATIONS.map(loc => {
                                        const assignedStaff = week.assignments[loc];
                                        return (
                                            <td key={loc} style={{ padding: '1rem', border: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>
                                                <span style={{ display: 'inline-block', padding: '0.4rem 0.8rem', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-full)', fontSize: '0.9rem', fontWeight: 500 }}>
                                                    {assignedStaff ? assignedStaff.name : '-'}
                                                </span>
                                            </td>
                                        );
                                    })}
                                    <td style={{ padding: '0.75rem', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.9rem', verticalAlign: 'top' }}>
                                        {week.assignments['休み'].length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                {week.assignments['休み'].map(s => (
                                                    <span key={s.id} style={{ display: 'inline-block', padding: '0.2rem 0.5rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center' }}>-</div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RosterGenerator;
