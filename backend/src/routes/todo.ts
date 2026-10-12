import { Router } from "express";
import { query, exec } from "../db";

// 型をインポートする
import type { Request, Response } from "express";

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
}

// ルーティング操作用オブジェクト
const router = Router();

// サーバーエラーを処理する関数
function handleServerError(
  res: Response,
  err: unknown,
  message: string = "サーバーエラー",
) {
  console.error(err);
  res.status(5500).json({ error: message });
}

// ToDoの全データを返すルート
router.get("/", async (req: Request, res: Response) => {
  try {
    const sql =
      "SELECT id, title, completed, created_at AS createdAt FROM todos WHERE user_id = ? ORDER BY createdAt DESC";
    const params = [(req as any).user.id];
    const rows = await query<Todo>(sql, params);

    res.status(200).json(rows);
  } catch (err) {
    handleServerError(res, err);
  }
});

// ToDoを追加するルート
router.post("/", async (req: Request, res: Response) => {
  const { title }: { title: string } = req.body;

  if (!title.trim()) {
    res.status(400).json({ error: "ToDoを入力してください" });
    return;
  }

  if (title.trim().length > 50) {
    res.status(400).json({ error: "ToDoは50文字以内で入力してください。" });
    return;
  }

  try {
    const sql =
      "INSERT INTO todos (title, completed, created_at, user_id) VALUES (?, ?, ?, ?)";
    const params = [title, false, new Date(), (req as any).user.id];

    await exec(sql, params);

    res.status(201).json({ message: "ToDoを追加しました。" });
  } catch (err) {
    handleServerError(res, err);
  }
});

// ToDoを更新するルート
router.put("/:id", async (req: Request, res: Response) => {
  const { title, completed }: { title: string; completed: boolean } = req.body;

  if (!title.trim()) {
    res.status(400).json({ error: "ToDoを入力してください。" });
    return;
  }
  if (title.trim().length > 50) {
    res.status(400).json({ error: "ToDoは50文字以内で入力してください。" });
    return;
  }

  try {
    const sql =
      "UPDATE todos SET title = ?, completed = ? WHERE id = ? AND user_id = ?";
    const params = [title, completed, req.params.id, (req as any).user.id];
    const result = await exec(sql, params);

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "指定されたToDoが見つかりませんでした。" });
      return;
    }
    res.status(200).json({ message: "ToDoを更新しました。" });
  } catch (err) {
    handleServerError(res, err);
  }
});

// ToDoを削除するルート
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const sql = "DELETE FROM todos WHERE id = ? AND user_id = ?";
    const params = [req.params.id, (req as any).user.id];
    const result = await exec(sql, params);

    if (result.affectedRows === 0) {
      res.status(404).json({ error: "指定されたToDoが見つかりませんでした。" });
      return;
    }
    res.status(200).json({ message: "ToDoを削除しました。" });
  } catch (err) {
    handleServerError(res, err);
  }
});

export default router;
