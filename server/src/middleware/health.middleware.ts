import { Request, Response, NextFunction } from "express";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function healthMiddleware(req: Request, res: Response, _next: NextFunction) {
    return res.status(200).end(req.protocol);
}
