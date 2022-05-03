import assert from "assert";
import cluster from "cluster";
import * as os from "os";
import { Application } from "express";
import { env } from "./env";
import { makeApp } from "./app";
import { logger } from "./services/logger.service";

serve(makeApp).catch((err: Error) => {
    logger.error("Critical", err);
    // eslint-disable-next-line no-restricted-syntax -- process is terminated on purpose when startup fails
    process.exit(err.status || ExitCode.Generic);
});

enum ExitCode {
    Generic = 1,
    UncaughtException = 2,
    UnhandledRejection = 3,
    /* primary */
    Environment = 101,
    InitFunction = 102,
    /* workers */
    WorkerStartup = 201,
}

function serve(expressAppFactory: () => Application | Promise<Application>): Promise<void> {
    process.on("uncaughtException", (err: Error) => assert.fail({ ...err, status: ExitCode.UncaughtException }));
    process.on("unhandledRejection", (err: Error) => assert.fail({ ...err, status: ExitCode.UnhandledRejection }));

    return (cluster.isPrimary
        ? clusterPrimary()
        : clusterWorker(expressAppFactory)
    ).then(() => {/* void */ });
}

function clusterPrimary(): Promise<void> {
    return Promise.resolve()
        .then(() => validateMasterEnv())
        .then(() => logger.info("Info", `${env.NODE_ENV} server (main process ${process.pid}) starting on port ${env.PORT}`))
        .then(() => startWorkers());
}

function validateMasterEnv(): void {
    env.NODE_ENV
        || assert.fail({ ...Error("env NODE_ENV invalid"), status: ExitCode.Environment });
    env.PORT > 0 && env.PORT <= 65536
        || assert.fail({ ...Error("env PORT invalid"), status: ExitCode.Environment });
    env.CLUSTERS > 0 && env.CLUSTERS <= os.cpus().length
        || assert.fail({ ...Error("env CLUSTERS invalid"), status: ExitCode.Environment });
}

function startWorkers(): void {
    new Array(env.CLUSTERS).fill(null).forEach(() => cluster.fork(env));
    cluster.on("exit", (worker, code, signal) => {
        logger.error("Error", `worker ${worker.process.pid} exited; ${JSON.stringify({ code, signal })}`);
        cluster.fork();
    });
}

function clusterWorker(expressAppFactory: () => Application | Promise<Application>): Promise<void> {
    return Promise.resolve()
        .then(() => expressAppFactory())
        .then(app => app.listen(env.PORT, () => logger.info("Info", `service (worker process ${process.pid}) is online`)))
        .then(() => { /* void */ })
        .catch(err => {
            logger.error("Critical", err);
            // eslint-disable-next-line no-restricted-syntax -- worker is terminated on purpose, so that primary worker can fork a healthy one
            process.exit(ExitCode.WorkerStartup);
        });
}
