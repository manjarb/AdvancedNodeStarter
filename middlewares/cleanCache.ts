import { Request, Response, NextFunction, RequestHandler } from "express";
import { clearHash } from "../services/cache";

export const cleanCacheMiddleWare: RequestHandler = async (req, res, next) => {
  await next();

  clearHash(req.body.user.id);
};
