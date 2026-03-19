import { useState, useEffect } from 'react';
import StaffManager from './components/StaffManager';
import RosterGenerator from './components/RosterGenerator';
import './index.css';

// 初期データの読み込みヘルパー
const loadStaffFromStorage = () => {
  const saved = localStorage.getItem('cleaningRosterStaff');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse staff data', e);
    }
  }
  return []; // 初期スタッフリストは空
};

function App() {
  const [activeTab, setActiveTab] = useState('roster');
  const [staffList, setStaffList] = useState(loadStaffFromStorage());

  // スタッフリストが更新されたらLocalStorageに保存
  useEffect(() => {
    localStorage.setItem('cleaningRosterStaff', JSON.stringify(staffList));
  }, [staffList]);

  // スタッフ追加
  const handleAddStaff = (name, department = 'システム部', status = '在籍中') => {
    if (!name.trim()) return;
    const newStaff = { id: Date.now().toString(), name: name.trim(), department, status };
    setStaffList([...staffList, newStaff]);
  };

  // スタッフ内容の更新（名前・部署・ステータス）
  const handleUpdateStaff = (id, newName, newDepartment, newStatus) => {
    setStaffList(staffList.map(staff =>
      staff.id === id ? { ...staff, name: newName, department: newDepartment, status: newStatus } : staff
    ));
  };

  // スタッフ削除
  const handleDeleteStaff = (id) => {
    setStaffList(staffList.filter(staff => staff.id !== id));
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">
          <span>✨</span> 清掃当番表 作成アプリ
        </h1>
      </header>

      {/* Main Content */}
      <main className="main-content">

        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'roster' ? 'active' : ''}`}
            onClick={() => setActiveTab('roster')}
          >
            🗓️ 当番表を作成
          </button>
          <button
            className={`nav-tab ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            👥 担当者マスタ ({staffList.length}人)
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'staff' && (
          <StaffManager
            staffList={staffList}
            onAddStaff={handleAddStaff}
            onDeleteStaff={handleDeleteStaff}
            onUpdateStaff={handleUpdateStaff}
            onImportStaff={setStaffList}
          />
        )}

        {activeTab === 'roster' && (
          <RosterGenerator staffList={staffList} />
        )}

      </main>
    </div>
  );
}

export default App;
