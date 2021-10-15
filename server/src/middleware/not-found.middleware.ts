import { Request, Response, NextFunction } from "express";

export default function notFoundMiddleware(_req: Request, _res: Response, next: NextFunction) {
    const err = Error("not found");
    (<any>err).status = 404;
    return next(err);
}
