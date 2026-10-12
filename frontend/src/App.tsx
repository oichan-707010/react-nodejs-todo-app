import { useEffect, useState } from "react";
import TodoForm from "./components/TodoForm";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Header from "./components/Header";
import { fetchTodos, addTodo, updateTodo, deleteTodo } from "./api/todo";
import { register, login, logout, fetchLoginSattus } from "./api/auth";
import { CircleCheckBig, Circle, SquarePen, Trash2 } from "lucide-react";

// ToDoの型をインターフェースとして定義する
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // ToDo一覧を取得し、状態変数を更新する関数
  async function syncTodos() {
    const todos = await fetchTodos();
    setTodos(todos);
  }

  // 認証トークンの有効期限切れエラーを処理する関数
  function handleExpired(err: unknown) {
    if ((err as Error).message === "EXPIRED") {
      setIsLoggedIn(false);
      setTodos([]);
      setEditingId(null);
      alert("セッションの有効期限が切れました。再度ログインしてください。");
      return true;
    }
    return false;
  }

  // コンポーネントがマウントされたときの初期化処理
  useEffect(() => {
    async function initApp() {
      // ログイン状態を取得し、状態変数を更新する。
      const status = await fetchLoginSattus();
      setIsLoggedIn(status);

      // ログイン済みであればToDo一覧を取得し、状態変数を更新する。
      if (status) {
        try {
          await syncTodos();
        } catch (err) {
          console.error(err);
          alert("ToDo一覧の取得に失敗しました。");
        }
      }
    }

    initApp();
  }, []);

  return (
    <>
      <Header
        isLoggedIn={isLoggedIn}
        onClickLogout={async () => {
          try {
            await logout();
            setIsLoggedIn(false);
            setTodos([]);
            setEditingId(null);
            alert("ログアウトしました。");
          } catch (err) {
            alert((err as Error).message);
          }
        }}
        onClickLogin={() => setShowRegister(false)}
        onClickRegister={() => setShowRegister(true)}
      />

      <main>
        {isLoggedIn ? (
          <>
            <section className="todo-add-from-wrapper">
              <TodoForm
                onSubmit={async (title) => {
                  try {
                    await addTodo(title);
                    await syncTodos();
                  } catch (err) {
                    if (handleExpired(err)) return;
                    alert((err as Error).message);
                  }
                }}
              />
            </section>

            <section className="todo-list-wrapper">
              <ul>
                {todos.map((todo) => (
                  <li key={todo.id}>
                    {editingId === todo.id ? (
                      <div className="todo-edit-form-wrapper">
                        <TodoForm
                          onSubmit={async (title) => {
                            try {
                              await updateTodo(todo.id, title, todo.completed);
                              setEditingId(null);
                              await syncTodos();
                            } catch (err) {
                              if (handleExpired(err)) return;
                              alert((err as Error).message);
                            }
                          }}
                          initialTitle={todo.title}
                          submitLabel="更新"
                        />
                        <div className="cancel-btn-wrapper">
                          <button onClick={() => setEditingId(null)}>
                            キャンセル
                          </button>
                        </div>
                      </div>
                    ) : (
                      // 編集ボタンが押されていない得は、通常通り表示する
                      <>
                        <div className="todo-text">
                          <strong className="todo-title">{todo.title}</strong>
                          <span className="todo-created-at">
                            作成日時:{" "}
                            {new Date(todo.createdAt).toLocaleString("ja-JP")}
                          </span>
                        </div>
                        <div className="todo-btns">
                          <button
                            onClick={async () => {
                              try {
                                await updateTodo(
                                  todo.id,
                                  todo.title,
                                  !todo.completed,
                                );
                                await syncTodos();
                              } catch (err) {
                                if (handleExpired(err)) return;
                                alert((err as Error).message);
                              }
                            }}
                            style={{ marginRight: "0.5em" }}
                          >
                            {todo.completed ? (
                              <CircleCheckBig size={16} color="#10b981" />
                            ) : (
                              <Circle size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingId(todo.id)}
                            style={{ marginRight: "0.5em" }}
                          >
                            <SquarePen size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm("本当に削除しますか？")) return;

                              try {
                                await deleteTodo(todo.id);
                                await syncTodos();
                              } catch (err) {
                                if (handleExpired(err)) return;
                                alert((err as Error).message);
                              }
                            }}
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <section className="auth-wrapper">
            <div className="auth-card">
              <h2>{showRegister ? "会員登録" : "ログイン"}</h2>

              {showRegister ? (
                <>
                  <RegisterForm
                    onSubmit={async (email, password) => {
                      try {
                        await register(email, password);
                        setShowRegister(false);
                        alert("会員登録が完了しました。");
                      } catch (err) {
                        alert((err as Error).message);
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <LoginForm
                    onSubmit={async (email, password) => {
                      try {
                        await login(email, password);
                        setIsLoggedIn(true);
                        alert("ログインしました。");
                        await syncTodos();
                      } catch (err) {
                        alert((err as Error).message);
                      }
                    }}
                  />
                </>
              )}

              <div className="auth-toggle">
                {showRegister ? (
                  <>
                    <span>すでにアカウントをお持ちですか？</span>
                    <button onClick={() => setShowRegister(false)}>
                      ログイン
                    </button>
                  </>
                ) : (
                  <>
                    <span>アカウントをお持ちではありませんか？</span>
                    <button onClick={() => setShowRegister(true)}>
                      会員登録
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

export default App;
