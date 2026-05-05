import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { hashPassword, signToken, verifyPassword } from "../auth.js";
import { requireAuth, type AuthedRequest } from "../middleware.js";

export const authRouter = Router();

const SignupSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().max(255),
  password: z.string().min(8).max(200)
});

authRouter.post("/signup", async (req, res) => {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const user = await prisma.user.create({
    data: { name, email, password: await hashPassword(password) },
    select: { id: true, name: true, email: true }
  });
  const token = signToken(user);
  return res.json({ token, user });
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await verifyPassword(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ id: user.id, email: user.email, name: user.name });
  return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true }
  });
  return res.json({ user });
});

