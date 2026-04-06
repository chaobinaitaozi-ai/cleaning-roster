import { useState } from 'react';

import { LOCATIONS, ANCHOR_CHOICES } from '../utils/rosterLogic';

const StaffManager = ({ staffList, onAddStaff, onDeleteStaff, onUpdateStaff }) => {
    const [newName, setNewName] = useState('');
    const [newDepartment, setNewDepartment] = useState('システム部');
    const [newStatus, setNewStatus] = useState('在籍中');
    const [newAnchors, setNewAnchors] = useState([]);

    // Add anchor form state
    const [tempNewAnchorDate, setTempNewAnchorDate] = useState('');
    const [tempNewAnchorLoc, setTempNewAnchorLoc] = useState('');

    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDepartment, setEditDepartment] = useState('システム部');
    const [editStatus, setEditStatus] = useState('在籍中');
    const [editAnchors, setEditAnchors] = useState([]);

    // Edit anchor form state
    const [tempEditAnchorDate, setTempEditAnchorDate] = useState('');
    const [tempEditAnchorLoc, setTempEditAnchorLoc] = useState('');



    const handleSubmit = (e) => {
        e.preventDefault();
        if (newName.trim()) {
            onAddStaff(newName, newDepartment, newStatus, newAnchors);
            setNewName('');
            setNewDepartment('システム部');
            setNewStatus('在籍中');
            setNewAnchors([]);
            setTempNewAnchorDate('');
            setTempNewAnchorLoc('');
        }
    };

    const handleAddNewAnchor = () => {
        if (tempNewAnchorDate && tempNewAnchorLoc) {
            setNewAnchors([...newAnchors, { startDate: tempNewAnchorDate, location: tempNewAnchorLoc }]);
            setTempNewAnchorDate('');
            setTempNewAnchorLoc('');
        }
    };

    const handleAddEditAnchor = () => {
        if (tempEditAnchorDate && tempEditAnchorLoc) {
            setEditAnchors([...editAnchors, { startDate: tempEditAnchorDate, location: tempEditAnchorLoc }]);
            setTempEditAnchorDate('');
            setTempEditAnchorLoc('');
        }
    };

    const startEdit = (staff) => {
        setEditingId(staff.id);
        setEditName(staff.name);
        setEditDepartment(staff.department || 'システム部');
        setEditStatus(staff.status || '在籍中');
        setEditAnchors(staff.rotationAnchors || []);
        setTempEditAnchorDate('');
        setTempEditAnchorLoc('');
    };

    const saveEdit = (id) => {
        if (editName.trim()) {
            onUpdateStaff(id, editName, editDepartment, editStatus, editAnchors);
            setEditingId(null);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    return (
        <div className="card">
            <h2 className="card-title">👥 担当者の登録・管理</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px' }}>
                    清掃当番のローテーションに参加するメンバーを登録・削除します。<br />
                    特定の週から場所を切り替えたい（アンカーとして指定し、以後はそこから自然に順繰り回したい）場合は、「ローテーション切り替え指定」を追加してください。<br />
                    ※ 過去のアンカー履歴を削除すると、現在のローテーション順番が狂う可能性があるため、過去の分も消さずに残しておくことを推奨します。
                </p>

            </div>

            {/* 追加フォーム */}
            <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', marginTop: 0, marginBottom: '1rem' }}>新規担当者の追加</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="text" className="form-input" style={{ flex: '1 1 200px' }} placeholder="名前（例：山田 太郎）" value={newName} onChange={(e) => setNewName(e.target.value)} />
                    <select className="form-input" style={{ flex: '0 0 auto', minWidth: '110px' }} value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)}>
                        <option value="総務部">総務部</option>
                        <option value="営業部">営業部</option>
                        <option value="システム部">システム部</option>
                    </select>
                    <select className="form-input" style={{ flex: '0 0 auto', minWidth: '120px' }} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                        <option value="在籍中">在籍中（当番あり）</option>
                        <option value="休職中">休職中（当番なし）</option>
                        <option value="時短勤務">時短勤務（当番なし）</option>
                    </select>
                </div>

                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>📍 ローテーションの切り替え地点（任意）</div>

                    {newAnchors.length > 0 && (
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '0.5rem' }}>
                            {newAnchors.map((anchor, idx) => (
                                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                    <span>・ {anchor.startDate} の週から</span>
                                    <strong style={{ color: 'var(--primary)' }}>{anchor.location}</strong>
                                    <button type="button" onClick={() => setNewAnchors(newAnchors.filter((_, i) => i !== idx))} className="btn btn-danger" style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>削除</button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem' }} value={tempNewAnchorDate} onChange={(e) => setTempNewAnchorDate(e.target.value)} />
                        <span style={{ fontSize: '0.85rem' }}>から</span>
                        <select className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', width: '130px' }} value={tempNewAnchorLoc} onChange={(e) => setTempNewAnchorLoc(e.target.value)}>
                            <option value="">- 場所を選択 -</option>
                            {ANCHOR_CHOICES.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                        <button type="button" onClick={handleAddNewAnchor} className="btn" style={{ background: 'var(--border)', padding: '0.3rem 0.75rem', fontSize: '0.85rem' }} disabled={!tempNewAnchorDate || !tempNewAnchorLoc}>アンカーを追加</button>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={!newName.trim()}>追加する</button>
                </div>
            </form>

            {/* 担当者リスト */}
            <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>登録済みの担当者 ({staffList.length}名)</h3>
                {staffList.length === 0 ? (
                    <div className="empty-state">まだ担当者が登録されていません。「追加する」ボタンからメンバーを登録してください。</div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
                        {staffList.map(staff => (
                            <li key={staff.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                                {editingId === staff.id ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <input type="text" className="form-input" style={{ flex: 1, padding: '0.4rem 0.75rem' }} value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="名前" />
                                            <select className="form-input" style={{ padding: '0.4rem 0.75rem' }} value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)}>
                                                <option value="総務部">総務部</option>
                                                <option value="営業部">営業部</option>
                                                <option value="システム部">システム部</option>
                                            </select>
                                            <select className="form-input" style={{ padding: '0.4rem 0.75rem' }} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                                                <option value="在籍中">在籍中</option>
                                                <option value="休職中">休職中</option>
                                                <option value="時短勤務">時短勤務</option>
                                            </select>
                                        </div>

                                        {/* アンカー編集部分 */}
                                        <div style={{ padding: '0.75rem', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>📍 ローテーションの切り替え地点 (アンカー)</div>

                                            {editAnchors.length > 0 && (
                                                <ul style={{ listStyle: 'none', padding: 0, marginBottom: '0.5rem' }}>
                                                    {editAnchors.map((anchor, idx) => (
                                                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                                            <span>・ {anchor.startDate} の週から</span>
                                                            <strong style={{ color: 'var(--primary)' }}>{anchor.location}</strong>
                                                            <button type="button" onClick={() => setEditAnchors(editAnchors.filter((_, i) => i !== idx))} className="btn btn-danger" style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>削除</button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <input type="date" className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem' }} value={tempEditAnchorDate} onChange={(e) => setTempEditAnchorDate(e.target.value)} />
                                                <span style={{ fontSize: '0.85rem' }}>から</span>
                                                <select className="form-input" style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem', width: '130px' }} value={tempEditAnchorLoc} onChange={(e) => setTempEditAnchorLoc(e.target.value)}>
                                                    <option value="">- 場所を選択 -</option>
                                                    {ANCHOR_CHOICES.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                                </select>
                                                <button type="button" onClick={handleAddEditAnchor} className="btn" style={{ background: 'var(--border)', padding: '0.3rem 0.75rem', fontSize: '0.85rem' }} disabled={!tempEditAnchorDate || !tempEditAnchorLoc}>リストに追加</button>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
                                                ※ リストに追加・削除した後は、必ず下の「保存」を押して確定してください。
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button onClick={cancelEdit} className="btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', background: 'var(--border)' }}>キャンセル</button>
                                            <button onClick={() => saveEdit(staff.id)} className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}>保存する</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{staff.name}</span>
                                                <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }}>{staff.department || 'システム部'}</span>
                                                <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', background: (staff.status || '在籍中') === '在籍中' ? 'var(--success-light)' : 'var(--danger-light)', color: (staff.status || '在籍中') === '在籍中' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{staff.status || '在籍中'}</span>
                                            </div>
                                            {(staff.rotationAnchors && staff.rotationAnchors.length > 0) && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                                                    {staff.rotationAnchors.map((ac, idx) => (
                                                        <span key={idx} style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                                            📍 {ac.startDate}〜 {ac.location}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => startEdit(staff)} className="btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', background: 'var(--border)' }}>編集</button>
                                            <button onClick={() => onDeleteStaff(staff.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }} title="担当者を削除">削除</button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default StaffManager;
