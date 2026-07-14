// src/App.tsx
import { useState, useEffect } from 'react';

// ★ 先ほどRenderにデプロイしたあなたのAPIのURLを指定します
// 末尾にスラッシュ(/)は含めないでください
const API_BASE_URL = 'https://task-manager-api-951q.onrender.com';

// タスクの型定義
type Task = {
  id: number;
  title: string;
  deadline: string;
  importance: number;
  time_required: number;
  completed: boolean;
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [motivation, setMotivation] = useState('');
  const [advice, setAdvice] = useState('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // 新規タスク用のステート
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newImportance, setNewImportance] = useState(3);
  const [newTimeRequired, setNewTimeRequired] = useState(30);

  // 初期読み込み時にタスク一覧を取得
  useEffect(() => {
    fetchTasks();
  }, []);

  // タスク一覧を取得する関数 (GET /tasks)
  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error(error);
      alert('タスクの取得に失敗しました');
    }
  };

  // タスクを作成する関数 (POST /tasks)
  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          deadline: newDeadline,
          importance: newImportance,
          time_required: newTimeRequired,
        }),
      });

      if (!response.ok) throw new Error('Failed to create task');
      
      // 作成成功後、入力をクリアして一覧を再取得
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

  // タスクの完了状態を切り替える関数 (PATCH /tasks/:id/complete)
  const toggleComplete = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      fetchTasks(); // 成功したら一覧を再取得
    } catch (error) {
      console.error(error);
      alert('タスクの更新に失敗しました');
    }
  };

  // AIにアドバイスをもらう関数 (POST /tasks/advice)
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
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>タスク管理アプリ</h1>

      <section style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>📝 新しいタスクを追加</h2>
        <form onSubmit={createTask} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            placeholder="タスク名"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
          <input
            type="datetime-local"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            required
            style={{ padding: '8px' }}
          />
          <label>
            重要度 (1-5):
            <input
              type="number"
              min="1"
              max="5"
              value={newImportance}
              onChange={(e) => setNewImportance(Number(e.target.value))}
              style={{ marginLeft: '10px', padding: '8px' }}
            />
          </label>
          <label>
            所要時間 (分):
            <input
              type="number"
              min="1"
              value={newTimeRequired}
              onChange={(e) => setNewTimeRequired(Number(e.target.value))}
              style={{ marginLeft: '10px', padding: '8px' }}
            />
          </label>
          <button type="submit" style={{ padding: '10px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            タスクを追加
          </button>
        </form>
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>📋 タスク一覧</h2>
        {tasks.length === 0 ? (
          <p>タスクはありません。</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasks.map((task) => (
              <li key={task.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleComplete(task.id, task.completed)}
                  style={{ transform: 'scale(1.5)' }}
                />
                <span style={{ textDecoration: task.completed ? 'line-through' : 'none', flexGrow: 1 }}>
                  <strong>{task.title}</strong> - {new Date(task.deadline).toLocaleString()} (重要度: {task.importance}, 所要時間: {task.time_required}分)
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h2>🤖 AIアシスタントに相談</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="今の気分や「やる気」を教えてください（例：疲れているので軽い作業がしたい）"
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            style={{ flexGrow: 1, padding: '10px' }}
          />
          <button
            onClick={getAdvice}
            disabled={loadingAdvice}
            style={{ padding: '10px 20px', backgroundColor: '#28A745', color: 'white', border: 'none', borderRadius: '4px', cursor: loadingAdvice ? 'not-allowed' : 'pointer' }}
          >
            {loadingAdvice ? '考え中...' : '提案してもらう'}
          </button>
        </div>
        
        {advice && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9f7ef', borderLeft: '5px solid #28A745', whiteSpace: 'pre-wrap' }}>
            {advice}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;