import { Request, Response, NextFunction } from "express";

import { globals } from "../../globals";
import { env } from "../env";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- last arg required by express to correctly interpret as error middleware
export function errorMiddleware(err: Error, req: Request, res: Response, _next: NextFunction) {
    const status = err.status || 500;
    const omitted = "*omitted*";
    const safeErr = {
        message: err.message || "internal server error",
        stack: (stack => Array.isArray(stack) && stack.length === 1 ? stack[0] : stack)((err.stack || "")
            .split(/\n/g)
            .map(l => l.replace(err.message, "").trim())
            .filter(l => !!l && !/(?:[\\/]node_modules[\\/]|\(node:internal\/|^Error:$)/.test(l))),
        method: req.method,
        status,
        headers: (() => {
            ["authorization", "cookie"].forEach(h => req.headers[h] && delete req.headers[h] && (req.headers[`${h}`] = omitted));
            return req.headers;
        })()
    };

    if (!req.url.endsWith(".map"))
        globals.console.error(safeErr);

    res.status(status)
        .header("Content-Type", "text/plain")
        .send(env.NODE_ENV !== "development" ? safeErr.message : [safeErr.message, "", ...(Array.isArray(safeErr.stack) ? safeErr.stack : [safeErr.stack])].join("\n"));
}
