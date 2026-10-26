import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.code, err.message, err.statusCode);
  }
  if (err instanceof ZodError) {
    return sendError(res, "VALIDATION_ERROR", err.message, 400);
  }
  logger.error({ err }, "Unhandled error");
  return sendError(res, "INTERNAL_ERROR", "Internal server error", 500);
}
