import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "./auth.js";

export type AuthedRequest = Request & {
  user?: { id: string; email: string; name: string };
};

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.header("authorization") ?? "";
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.sub, email: decoded.email, name: decoded.name };
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

