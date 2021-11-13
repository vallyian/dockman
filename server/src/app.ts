import * as express from "express";
import * as helmet from "helmet";
import { routes } from "../../shared/routes";
import setDockerRoute from "./routes/docker.route";
import errorMiddleware from "./middleware/error.middleware";
import healthMiddleware from "./middleware/health.middleware";
import notFoundMiddleware from "./middleware/not-found.middleware";
import env from "./env";

let app: express.Application;

export async function makeApp(): Promise<express.Application> {
    if (app) return app;

    app = express();

    app.use(helmet());
    app.disable("X-Powered-By");
    app.use(routes.health, healthMiddleware);
    app.use(express.static(env.NODE_ENV === "development" ? "../client/dist" : "./client"));
    app.use(routes.docker.base, setDockerRoute(express.Router()));
    app.use(notFoundMiddleware);
    app.use(errorMiddleware);

    return app;
}
