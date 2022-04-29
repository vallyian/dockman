declare global {
    namespace Express {
        interface Request {

        }
    }

    namespace Error {
        status: number | undefined;
    }
}
