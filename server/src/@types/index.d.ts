import * as express from "express"

declare global {
    namespace Express {
        interface Request {

        }
    }

    namespace Error {
        status: number | undefined;
    }
}
