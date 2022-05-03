import cluster from "cluster";
import * as os from "os";
import { Application } from "express";
import { env } from "./env";
import { makeApp } from "./app";

serve(makeApp);

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
    process.on("uncaughtException", err => {
        console.error("Critical", err);
        process.exit(ExitCode.UncaughtException);
    });

    process.on("unhandledRejection", err => {
        console.error("Critical", err);
        process.exit(ExitCode.UnhandledRejection);
    });

    return (cluster.isPrimary
        ? clusterPrimary()
        : clusterWorker(expressAppFactory)
    ).then(() => {/* void */ }).catch(err => {
        console.error("Critical", err);
        process.exit(ExitCode.Generic);
    });
}

function clusterPrimary(): Promise<void> {
    return Promise.resolve()
        .then(() => validateMasterEnv())
        .then(() => console.info("Info", `${env.NODE_ENV} server (main process ${process.pid}) starting on port ${env.PORT}`))
        .then(() => startWorkers());
}

function validateMasterEnv(): void {
    if (!env.NODE_ENV) {
        console.error("Critical", "env NODE_ENV invalid");
        process.exit(ExitCode.Environment);
    }
    if (!env.PORT || env.PORT <= 0 || env.PORT > 65536) {
        console.error("Critical", "env PORT invalid");
        process.exit(ExitCode.Environment);
    }
    if (!env.CLUSTERS || env.CLUSTERS < 1 || env.CLUSTERS > os.cpus().length) {
        console.error("Critical", "env CLUSTERS invalid");
        process.exit(ExitCode.Environment);
    }
}

function startWorkers(): void {
    new Array(env.CLUSTERS).fill(null).forEach(() => cluster.fork(env));
    cluster.on("exit", (worker, code, signal) => {
        console.error("Error", `worker ${worker.process.pid} exited; ${JSON.stringify({ code, signal })}`);
        cluster.fork();
    });
}

function clusterWorker(expressAppFactory: () => Application | Promise<Application>): Promise<void> {
    return Promise.resolve()
        .then(() => expressAppFactory())
        .then(app => app.listen(env.PORT, () => console.info("Info", `service (worker process ${process.pid}) is online`)))
        .then(() => { /* void */ })
        .catch(err => {
            console.error("Critical", err);
            process.exit(ExitCode.WorkerStartup);
        });
}
