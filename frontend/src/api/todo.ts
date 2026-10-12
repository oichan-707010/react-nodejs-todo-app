// ToDoの型をインターフェースとして定義する
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
}

const apiUrl = import.meta.env.VITE_API_URL;

// レスポンスのエラーを処理する関数
function handleError(res: Response, msg: string) {
  // 認証トークンが有効期限切れの場合は、フロントエンド側で判別できるように"EXPIRED"というメッセージのエラーを投げる
  if (res.status === 440) throw new Error("EXPIRED");

  if (!res.ok) throw new Error(msg);
}

// APIにリクエストを送信し、ToDo一覧を取得する関数
export async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch(`${apiUrl}/todos`, {
    credentials: "include",
  });

  handleError(res, "ToDo一覧の取得に失敗しました。");

  return res.json();
}

// APIにリクエストを送信し、ToDoを追加する関数
export async function addTodo(title: string) {
  const res = await fetch(`${apiUrl}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
    credentials: "include",
  });

  handleError(res, "ToDoの追加に失敗しました。");
}

// APIにリクエストを送信し、ToDoを更新する関数
export async function updateTodo(
  id: number,
  title: string,
  completed: boolean,
) {
  const res = await fetch(`${apiUrl}/todos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, completed }),
    credentials: "include",
  });

  handleError(res, "ToDoの更新に失敗しました。");
}

// APIにリクエストを送信し、ToDoを削除する関数
export async function deleteTodo(id: number) {
  const res = await fetch(`${apiUrl}/todos/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  handleError(res, "ToDoの削除に失敗しました。");
}
