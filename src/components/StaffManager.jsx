import { useState, useRef } from 'react';

const StaffManager = ({ staffList, onAddStaff, onDeleteStaff, onUpdateStaff }) => {
    const [newName, setNewName] = useState('');
    const [newDepartment, setNewDepartment] = useState('システム部');
    const [newStatus, setNewStatus] = useState('在籍中');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editDepartment, setEditDepartment] = useState('システム部');
    const [editStatus, setEditStatus] = useState('在籍中');
    const fileInputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newName.trim()) {
            onAddStaff(newName, newDepartment, newStatus);
            setNewName(''); // 入力フィールドをクリア
            setNewDepartment('システム部');
            setNewStatus('在籍中'); // ステータスを初期値に戻す
        }
    };

    const startEdit = (staff) => {
        setEditingId(staff.id);
        setEditName(staff.name);
        setEditDepartment(staff.department || 'システム部');
        setEditStatus(staff.status || '在籍中');
    };

    const saveEdit = (id) => {
        if (editName.trim()) {
            onUpdateStaff(id, editName, editDepartment, editStatus);
            setEditingId(null);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    // --- インポート / エクスポート機能 ---
    const handleExport = () => {
        const dataStr = JSON.stringify(staffList, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = 'cleaning_staff_list.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (Array.isArray(importedData)) {
                    // 簡易的なバリデーション（IDと名前があるか）
                    const isValid = importedData.every(item => item.id && item.name);
                    if (isValid) {
                        // 重複を避けるために既存のリストを置き換えるか、マージするか
                        // 今回は「置き換え」とする
                        if (window.confirm('現在のスタッフリストを読み込んだファイルの内容で上書きしますか？')) {
                            // 親コンポーネントのステートを更新する関数がないので、App.jsxで定義したsetStaffListを渡す必要がある
                            // 現状はApp.jsxからonAddStaffなどを経由しているので、一括更新用のpropsを追加する必要がある
                            onImportStaff(importedData);
                        }
                    } else {
                        alert('ファイル形式が正しくありません。');
                    }
                }
            } catch (err) {
                alert('ファイルの読み込みに失敗しました。');
            }
            e.target.value = ''; // Reset input
        };
        reader.readAsText(file);
    };

    const handleClearAll = () => {
        if (window.confirm('本当にすべての担当者データを削除しますか？（この操作は取り消せません）')) {
            onImportStaff([]);
        }
    };

    return (
        <div className="card">
            <h2 className="card-title">👥 担当者の登録・管理</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px' }}>
                    清掃当番のローテーションに参加するメンバーを登録・削除します。
                    <br />※ データはブラウザに保存されるため、他の方と共有する場合は「エクスポート」したファイルを共有してください。
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleExport} className="btn" style={{ background: 'var(--success-light)', color: 'var(--success)', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                        📥 エクスポート
                    </button>
                    <button onClick={handleImportClick} className="btn" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                        📤 インポート
                    </button>
                    <button onClick={handleClearAll} className="btn" style={{ background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                        🗑️ 全削除
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".json"
                        onChange={handleFileChange}
                    />
                </div>
            </div>

            {/* 追加フォーム */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    className="form-input"
                    style={{ flex: '1 1 200px' }}
                    placeholder="新しい担当者の名前（例：山田 太郎）"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                />
                <select
                    className="form-input"
                    style={{ flex: '0 0 auto', minWidth: '110px' }}
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                >
                    <option value="総務部">総務部</option>
                    <option value="営業部">営業部</option>
                    <option value="システム部">システム部</option>
                </select>
                <select
                    className="form-input"
                    style={{ flex: '0 0 auto', minWidth: '120px' }}
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                >
                    <option value="在籍中">在籍中（当番あり）</option>
                    <option value="休職中">休職中（当番なし）</option>
                    <option value="時短勤務">時短勤務（当番なし）</option>
                </select>
                <button type="submit" className="btn btn-primary" disabled={!newName.trim()}>
                    追加する
                </button>
            </form>

            {/* 担当者リスト */}
            <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
                    登録済みの担当者 ({staffList.length}名)
                </h3>

                {staffList.length === 0 ? (
                    <div className="empty-state">
                        まだ担当者が登録されていません。「追加する」ボタンからメンバーを登録してください。
                    </div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
                        {staffList.map(staff => (
                            <li
                                key={staff.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    background: 'var(--background)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)',
                                    animation: 'fadeIn 0.2s ease-in-out',
                                    flexWrap: 'wrap',
                                    gap: '1rem'
                                }}
                            >
                                {editingId === staff.id ? (
                                    // ----- 編集モード -----
                                    <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            style={{ flex: 1, padding: '0.4rem 0.75rem' }}
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                        />
                                        <select
                                            className="form-input"
                                            style={{ padding: '0.4rem 0.75rem' }}
                                            value={editDepartment}
                                            onChange={(e) => setEditDepartment(e.target.value)}
                                        >
                                            <option value="総務部">総務部</option>
                                            <option value="営業部">営業部</option>
                                            <option value="システム部">システム部</option>
                                        </select>
                                        <select
                                            className="form-input"
                                            style={{ padding: '0.4rem 0.75rem' }}
                                            value={editStatus}
                                            onChange={(e) => setEditStatus(e.target.value)}
                                        >
                                            <option value="在籍中">在籍中</option>
                                            <option value="休職中">休職中</option>
                                            <option value="時短勤務">時短勤務</option>
                                        </select>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => saveEdit(staff.id)} className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}>保存</button>
                                            <button onClick={cancelEdit} className="btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', background: 'var(--border)' }}>キャンセル</button>
                                        </div>
                                    </div>
                                ) : (
                                    // ----- 表示モード -----
                                    <>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{staff.name}</span>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: 'var(--radius-full)',
                                                background: 'var(--primary-light)',
                                                color: 'var(--primary)',
                                                fontWeight: 600
                                            }}>
                                                {staff.department || 'システム部'}
                                            </span>
                                            <span style={{
                                                fontSize: '0.8rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: 'var(--radius-full)',
                                                background: (staff.status || '在籍中') === '在籍中' ? 'var(--success-light)' : 'var(--danger-light)',
                                                color: (staff.status || '在籍中') === '在籍中' ? 'var(--success)' : 'var(--danger)',
                                                fontWeight: 600
                                            }}>
                                                {staff.status || '在籍中'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => startEdit(staff)}
                                                className="btn"
                                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', background: 'var(--border)' }}
                                            >
                                                編集
                                            </button>
                                            <button
                                                onClick={() => onDeleteStaff(staff.id)}
                                                className="btn btn-danger"
                                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
                                                title="担当者を削除"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </>
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
