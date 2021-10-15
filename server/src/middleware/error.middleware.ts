import { Request, Response, NextFunction } from "express";
import env from "../env";

export default function (err: Error, req: Request, res: Response, _next: NextFunction) {
    const body = req.body;
    if (body instanceof Object) {
        if (body.password) body.password = "...omitted...";
        if (body.passwordRepeat) body.passwordRepeat = "...omitted...";
    }

    const errJson = {
        status: (<any>err).status || 500,
        message: err.message || "internal server error",
        stack: env.NODE_ENV === "development" ? (err.stack || "").split(/\n/g).filter(l => !!l.trim()) : undefined,
    };

    console.log("E", JSON.stringify({
        hostname: req.hostname,
        method: req.method,
        url: req.url,
        headers: (() => {
            if (req.headers.authorization) req.headers.authorization = "...omitted...";
            if (req.headers.cookie) req.headers.cookie = "...omitted...";
            return req.headers;
        })(),
        body,
        error: errJson
    }, null, 2));

    return res
        .status(errJson.status)
        .send(errJson);
}
