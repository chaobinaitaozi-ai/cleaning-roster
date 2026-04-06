import { useState, useEffect } from 'react';
import StaffManager from './components/StaffManager';
import RosterGenerator from './components/RosterGenerator';
import { db } from './firebase'; // 作成したファイルから読み込む
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import './index.css';

// ローカル起動時は 'dev_staff', 本番ビルド時は 'staff' に分ける
const STAFF_COLLECTION_NAME = import.meta.env.DEV ? 'dev_staff' : 'staff';

function App() {
  const [activeTab, setActiveTab] = useState('roster');
  const [staffList, setStaffList] = useState([]);

  // ① Firestoreからデータを定期的に読み込む（リアルタイム更新）
  useEffect(() => {
    const staffCollectionRef = collection(db, STAFF_COLLECTION_NAME);
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
  const handleAddStaff = async (name, department = 'システム部', status = '在籍中', rotationAnchors = []) => {
    if (!name.trim()) return;
    try {
      await addDoc(collection(db, STAFF_COLLECTION_NAME), {
        name: name.trim(),
        department,
        status,
        rotationAnchors,
        createdAt: new Date()
      });
    } catch (error) {
      console.error("追加エラー: ", error);
      alert("追加に失敗しました");
    }
  };

  // ③ スタッフ更新（Firestoreのデータを上書き）
  const handleUpdateStaff = async (id, newName, newDepartment, newStatus, rotationAnchors = []) => {
    try {
      const staffDocRef = doc(db, STAFF_COLLECTION_NAME, id);
      await updateDoc(staffDocRef, {
        name: newName,
        department: newDepartment,
        status: newStatus,
        rotationAnchors
      });
    } catch (error) {
      console.error("更新エラー: ", error);
      alert("更新に失敗しました");
    }
  };

  // ④ スタッフ削除（Firestoreからデータを削除）
  const handleDeleteStaff = async (id) => {
    try {
      const staffDocRef = doc(db, STAFF_COLLECTION_NAME, id);
      await deleteDoc(staffDocRef);
    } catch (error) {
      console.error("削除エラー: ", error);
      alert("削除に失敗しました");
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
