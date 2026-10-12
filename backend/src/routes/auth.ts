import { Router } from "express";
import { query, exec } from "../db";
import { generateToken, verifyToken } from "../jwt";
import bcrypt from "bcrypt";

// 型をインポートする
import type { Request, Response } from "express";

// ユーザーの型をインターフェースとして定義する
interface User {
  id: number;
  email: string;
  password: string;
}

// ルーティング操作用オブジェクト
const router = Router();

// ユーザーを登録するルート
router.post("/register", async (req: Request, res: Response) => {
  const { email, password }: { email: string; password: string } = req.body;

  if (!email.trim() || !password.trim()) {
    res
      .status(400)
      .json({ error: "メールアドレスとパスワードを入力してください。" });
    return;
  }

  if (password.trim().length < 8) {
    res
      .status(400)
      .json({ error: "パスワードは8文字以上で入力してください。" });
    return;
  }

  try {
    const checkSql = "SELECT * FROM users WHERE email = ?";
    const checkParams = [email];
    const existingUser = await query<User>(checkSql, checkParams);

    // すでに同じメールアドレスのユーザーが存在する場合は409エラーを返す
    if (existingUser.length > 0) {
      res
        .status(400)
        .json({ error: "そのメールアドレスはすでに登録済みです。" });
    }

    // パスワードをハッシュ化する
    const hashed = await bcrypt.hash(password, 10);

    const insertSql = "INSERT INTO users (email, password) VALUES (?, ?)";
    const insertParams = [email, hashed];

    // ユーザーをデータベースに登録する
    await exec(insertSql, insertParams);

    res.status(201).json({ message: "会員登録に成功しました。" });
  } catch (error) {
    res.status(500).json({ error: "データベースエラーが発生しました。" });
  }
});

// ログイン処理を行うルート
router.post("/login", async (req: Request, res: Response) => {
  const { email, password }: { email: string; password: string } = req.body;

  try {
    const sql = "SELECT * FROM users WHERE email = ?";
    const params = [email];
    const rows = await query<User>(sql, params);
    const user = rows[0];

    // ユーザーが存在しない場合は401エラーを返す
    if (!user) {
      res.status(401).json({ error: "ユーザーが存在しません。" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    // パスワードが不一致の場合は401エラーを返す
    if (!isMatch) {
      res.status(401).json({ error: "パスワードが間違っています。" });
      return;
    }

    // パスワードが一致した場合は認証トークンを生成する
    const token = generateToken({ id: user.id, email: user.email });

    // 認証トークンをクッキーに保存する（ブラウザへ指示を出す）
    res.cookie("authToken", token, {
      httpOnly: true, // JavaScriptからのアクセスを禁止する（XSS対策）
      secure: process.env.NODE_ENV === "production", // 本番環境では暗号化されたHTTPSでのみ送信する（盗聴リスク低減）
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // 本番環境では別サイトからのリクエスト時にクッキーを送信しない（CSRF対策）
      maxAge: 60 * 60 * 1000, // 有効期限（1時間）
    });

    // ステータスコードのみ返却する（認証トークンはクッキー経由で返却する）
    res.status(200).json({ message: "ログインに成功しました。" });
  } catch (error) {
    res.status(500).json({ error: "データベースエラーが発生しました。" });
  }
});

// ログアウト処理を行うルート
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("authToken");
  res.json({ message: "ログアウトしました。" });
});

// ログイン済みかどうかを確認するルート
router.get("/check", verifyToken, (req: Request, res: Response) => {
  res.status(200).json({ message: "ログイン済みです。" });
});

export default router;
