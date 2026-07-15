// src/App.tsx
import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://task-manager-api-951q.onrender.com';

type Task = {
  id: number;
  title: string;
  deadline: string;
  importance: number;
  time_required: number;
  completed: boolean;
};

// ユーザーIDをローカルストレージから取得、なければ新規作成する関数
const getOrCreateUserId = () => {
  let userId = localStorage.getItem('task_manager_user_id');
  if (!userId) {
    userId = crypto.randomUUID(); // ランダムな一意のIDを生成
    localStorage.setItem('task_manager_user_id', userId);
  }
  return userId;
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [motivation, setMotivation] = useState('');
  const [advice, setAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newImportance, setNewImportance] = useState(3);
  const [newTimeRequired, setNewTimeRequired] = useState(30);

  // 起動時に取得したユーザーID
  const currentUserId = getOrCreateUserId();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        headers: { 'X-User-Id': currentUserId }
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
      alert('タスクの取得に失敗しました');
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId
        },
        body: JSON.stringify({
          title: newTitle,
          deadline: newDeadline,
          importance: newImportance,
          time_required: newTimeRequired,
        }),
      });

      if (!response.ok) throw new Error('Failed to create task');
      
      setNewTitle('');
      setNewDeadline('');
      setNewImportance(3);
      setNewTimeRequired(30);
      fetchTasks();
    } catch (error) {
      console.error(error);
      alert('タスクの作成に失敗しました');
    }
  };

  const toggleComplete = async (id: number, currentStatus: boolean) => {
    try {
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));

      const response = await fetch(`${API_BASE_URL}/tasks/${id}/complete`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId
        },
        body: JSON.stringify({ completed: !currentStatus }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      fetchTasks();
    } catch (error) {
      console.error(error);
      alert('タスクの更新に失敗しました');
      fetchTasks();
    }
  };

  const getAdvice = async () => {
    if (!motivation) {
      alert('現在のやる気を入力してください！');
      return;
    }
    
    setLoadingAdvice(true);
    setAdvice('');

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/advice`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId
        },
        body: JSON.stringify({ motivation }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get advice');
      }

      setAdvice(data.advice);
    } catch (error: any) {
      console.error(error);
      setAdvice(error.message || 'アドバイスの取得に失敗しました。');
    } finally {
      setLoadingAdvice(false);
    }
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 5) return 'bg-red-100 text-red-700 border-red-200';
    if (importance >= 4) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (importance >= 3) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <header className="text-center space-y-2">
          {/* ★ タイトルを「ナニスルくん」に変更 */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">ナニスルくん</h1>
          <p className="text-slate-500">あなたのタスクとモチベーションを管理します</p>
          <p className="text-xs text-slate-400 font-mono mt-2">User ID: {currentUserId.slice(0, 8)}...</p>
        </header>

        {/* --- AIアシスタント セクション --- */}
        <section className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl shadow-sm border border-emerald-100">
          <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-2 mb-4">
            <span>🤖</span> AIにタスク順を相談する
          </h2>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="今の気分は？（例：疲れているのでサクッと終わるものがいい）"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              className="flex-grow px-4 py-3 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
            <button
              onClick={getAdvice}
              disabled={loadingAdvice}
              className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loadingAdvice ? '考え中...' : '提案してもらう'}
            </button>
          </div>
          
          {advice && (
            <div className="mt-4 p-5 bg-white/80 backdrop-blur-sm rounded-xl border border-emerald-200 text-emerald-900 leading-relaxed whitespace-pre-wrap shadow-inner">
              {advice}
            </div>
          )}
        </section>

        {/* --- 新規タスク追加 セクション --- */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-5">📝 新しいタスクを追加</h2>
          <form onSubmit={createTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">タスク名</label>
              <input
                type="text"
                placeholder="例: フロントエンドのUIを改善する"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">期限</label>
              <input
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-600 mb-1">重要度 (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newImportance}
                  onChange={(e) => setNewImportance(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-600 mb-1">時間 (分)</label>
                <input
                  type="number"
                  min="1"
                  step="5"
                  value={newTimeRequired}
                  onChange={(e) => setNewTimeRequired(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="md:col-span-2 pt-2">
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm">
                タスクを登録する
              </button>
            </div>
          </form>
        </section>

        {/* --- タスク一覧 セクション --- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800">📋 タスク一覧</h2>
            <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
              計 {tasks.length} 件
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
              <p>現在登録されているタスクはありません。</p>
              <p className="text-sm mt-1">上のフォームから最初のタスクを追加しましょう！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`flex items-start md:items-center gap-4 p-4 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md
                    ${task.completed ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200'}`}
                >
                  <div className="pt-1 md:pt-0 shrink-0">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task.id, task.completed)}
                      className="w-6 h-6 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-colors"
                    />
                  </div>

                  <div className="flex-grow min-w-0">
                    <h3 className={`text-lg font-bold truncate transition-colors ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                      {task.title}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        📅 {formatDate(task.deadline)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getImportanceColor(task.importance)}`}>
                        🔥 重要度 {task.importance}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        ⏱️ {task.time_required}分
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default App;