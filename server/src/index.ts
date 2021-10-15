import * as cluster from "cluster";
import * as os from "os";
import { Application } from "express";
import env from "./env";
import { makeApp } from "./app";

serve(makeApp);

enum ExitCode {
    Generic = 1,
    UncaughtException = 2,
    UnhandledRejection = 3,
    /* master */
    Environment = 101,
    InitFunction = 102,
    /* workers */
    WorkerStartup = 201,
}

async function serve(expressAppFactory: () => Application | Promise<Application>) {
    process.on('uncaughtException', (err, _origin) => {
        console.error("Critical", err);
        process.exit(ExitCode.UncaughtException);
    });

    process.on('unhandledRejection', (err, _promise) => {
        console.error("Critical", <any>err);
        process.exit(ExitCode.UnhandledRejection);
    });

    await (cluster.isMaster
        ? clusterMain()
        : clusterWorker(expressAppFactory)
    ).catch(err => {
        console.error("Critical", err);
        process.exit(ExitCode.Generic);
    });
}

async function clusterMain() {
    // validate master env
    if (!env.NODE_ENV) {
        console.error("Critical", "env NODE_ENV invalid");
        process.exit(ExitCode.UncaughtException);
    }
    if (!env.PORT || env.PORT <= 0 || env.PORT > 65536) {
        console.error("Critical", "env PORT invalid");
        process.exit(ExitCode.UncaughtException);
    }
    if (!env.CLUSTERS || env.CLUSTERS < 1 || env.CLUSTERS > os.cpus().length) {
        console.error("Critical", "env CLUSTERS invalid");
        process.exit(ExitCode.UncaughtException);
    }

    // master validation and init complete
    console.info("Info", `${env.NODE_ENV} server (main process ${process.pid}) starting on port ${env.PORT}`);

    // start workers
    new Array(env.CLUSTERS).fill(null).forEach(() => cluster.fork(env));
    cluster.on("exit", (worker, code, signal) => {
        console.error("Error", `worker ${worker.process.pid} exited; ${JSON.stringify({ code, signal })}`);
        cluster.fork();
    });
}

async function clusterWorker(expressAppFactory: () => Application | Promise<Application>) {
    await Promise.resolve()
        .then(() => expressAppFactory())
        .then(app => app.listen(env.PORT, () => console.info("Info", `service (worker process ${process.pid}) is online`)))
        .catch(err => {
            console.error("Critical", err);
            process.exit(ExitCode.WorkerStartup);
        });
}
