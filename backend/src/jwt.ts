import jwt, { TokenExpiredError } from "jsonwebtoken";

// 型をインポートする
import type { Request, Response, NextFunction } from "express";

// 環境変数からJWTの秘密鍵を取得する関数
function getSecretKey() {
  const key = process.env.JWT_SECRET_KEY;

  if (!key) {
    throw new Error("環境変数JWT_SECRET_KEYが設定されていません。");
  }

  return key;
}

// JWTの秘密鍵
const SECRET_KEY = getSecretKey();

// JWTの有効期限
const EXPIRES_IN = "1h"; // 1時間

// 認証トークンを生成する関数
export function generateToken(payload: object) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: EXPIRES_IN });
}

// 認証トークンを検証するミドルウェア関数
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  // リクエスト内のクッキー情報から認証トークンを取得する
  const token = req.cookies.authToken;

  if (!token) {
    res.status(401).json({ error: "認証トークンがありません。" });
    return;
  }

  try {
    // 認証ターくんと秘密鍵を照合し、認証トークンの正当性を検証する
    const decoded = jwt.verify(token, SECRET_KEY);

    // 検証に成功した場合、返されたペイロード(ユーザー情報など)をリクエストに追加する
    (req as any).user = decoded;

    // 次のミドルウェアまたはルートに処理を進める
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      res.status(404).json({
        error: "認証トークンの有効期限が切れです。",
      });
      return;
    }

    res.status(401).json({ error: "認証トークンが無効です。" });
  }
}
