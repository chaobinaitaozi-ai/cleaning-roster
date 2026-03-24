import { useState, useEffect } from 'react';
import StaffManager from './components/StaffManager';
import RosterGenerator from './components/RosterGenerator';
import { db } from './firebase'; // 作成したファイルから読み込む
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('roster');
  const [staffList, setStaffList] = useState([]);

  // ① Firestoreからデータを定期的に読み込む（リアルタイム更新）
  useEffect(() => {
    const staffCollectionRef = collection(db, 'staff');
    const unsubscribe = onSnapshot(staffCollectionRef, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id // Firestoreが自動生成したIDを使う
      }));
      setStaffList(staffData);
    });

    return () => unsubscribe(); // 不要になったら監視を解除
  }, []);

  // ② スタッフ追加（Firestoreに書き込み）
  const handleAddStaff = async (name, department = 'システム部', status = '在籍中') => {
    if (!name.trim()) return;
    try {
      await addDoc(collection(db, 'staff'), {
        name: name.trim(),
        department,
        status,
        createdAt: new Date()
      });
    } catch (error) {
      console.error("追加エラー: ", error);
      alert("追加に失敗しました");
    }
  };

  // ③ スタッフ更新（Firestoreのデータを上書き）
  const handleUpdateStaff = async (id, newName, newDepartment, newStatus) => {
    try {
      const staffDocRef = doc(db, 'staff', id);
      await updateDoc(staffDocRef, {
        name: newName,
        department: newDepartment,
        status: newStatus
      });
    } catch (error) {
      console.error("更新エラー: ", error);
      alert("更新に失敗しました");
    }
  };

  // ④ スタッフ削除（Firestoreからデータを削除）
  const handleDeleteStaff = async (id) => {
    try {
      const staffDocRef = doc(db, 'staff', id);
      await deleteDoc(staffDocRef);
    } catch (error) {
      console.error("削除エラー: ", error);
      alert("削除に失敗しました");
    }
  };

  // ⑤ 一括インポート / 全削除（Firestore上で一括処理）
  const handleImportStaff = async (importedData) => {
    try {
      const batch = writeBatch(db); // 複数の操作をまとめて行う機能
      
      // 今あるデータをすべて削除する
      staffList.forEach(staff => {
        const staffRef = doc(db, 'staff', staff.id);
        batch.delete(staffRef);
      });

      // 新しいデータを追加する（全削除の場合は無視されます）
      importedData.forEach(staff => {
        const newStaffRef = doc(collection(db, 'staff'));
        batch.set(newStaffRef, {
          name: staff.name,
          department: staff.department || 'システム部',
          status: staff.status || '在籍中',
          createdAt: new Date()
        });
      });

      await batch.commit(); // 最後に一括で適用
    } catch (error) {
      console.error("データ処理エラー: ", error);
      alert("データの処理に失敗しました");
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          <span>✨</span> 清掃当番表 作成アプリ
        </h1>
      </header>

      <main className="main-content">
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

        {activeTab === 'staff' && (
          <StaffManager
            staffList={staffList}
            onAddStaff={handleAddStaff}
            onDeleteStaff={handleDeleteStaff}
            onUpdateStaff={handleUpdateStaff}
            onImportStaff={handleImportStaff}
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
