import { Request, Response, NextFunction } from "express";

export default function healthMiddleware(req: Request, res: Response, _next: NextFunction) {
    return res.status(200).end(req.protocol);
}
