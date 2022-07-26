import { Response, NextFunction } from "express";

export function responder(res: Response, next: NextFunction, result: Promise<unknown>) {
    return result
        .catch(err => err)
        .then(result => result instanceof Error
            ? next(result)
            : res.json(result));
}
