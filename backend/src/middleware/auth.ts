import type { NextFunction, Request, Response } from "express";
import { verifyJwt } from "../services/auth.service.js";
import { isContractOwner } from "../blockchain/token.service.js";
import { AppError } from "../utils/errors.js";

export type AuthedRequest = Request & { wallet?: string };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("UNAUTHORIZED", "Missing bearer token", 401));
  }
  const token = header.slice(7);
  const payload = verifyJwt(token);
  req.wallet = payload.sub;
  next();
}

export async function requireOwner(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (!req.wallet) return next(new AppError("UNAUTHORIZED", "Not authenticated", 401));
  const owner = await isContractOwner(req.wallet);
  if (!owner) return next(new AppError("FORBIDDEN", "Contract owner required", 403));
  next();
}
