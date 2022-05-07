import { Router, Response, NextFunction } from "express";

import { routes } from "../../../shared/routes";
import * as dockerService from "../services/docker.service";

export function setDockerRoute(router: Router): Router {
    router.get(routes.docker.image.ls, (req, res, next) => result(res, next, dockerService.imageLs(req.params.id)));
    router.get(routes.docker.container.ls, (_, res, next) => result(res, next, dockerService.containerLs()));
    router.get(routes.docker.volume.ls, (_, res, next) => result(res, next, dockerService.volumeLs()));
    router.get(routes.docker.network.ls, (_, res, next) => result(res, next, dockerService.networkLs()));

    router.get(routes.docker.image.inspect, (req, res, next) => result(res, next, dockerService.inspect("image", req.params.id)));
    router.get(routes.docker.container.inspect, (req, res, next) => result(res, next, dockerService.inspect("container", req.params.id)));
    router.get(routes.docker.volume.inspect, (req, res, next) => result(res, next, dockerService.inspect("volume", req.params.id)));
    router.get(routes.docker.network.inspect, (req, res, next) => result(res, next, dockerService.inspect("network", req.params.id)));

    router.get(routes.docker.container.start, (req, res, next) => result(res, next, dockerService.container("start", req.params.id)));
    router.get(routes.docker.container.stop, (req, res, next) => result(res, next, dockerService.container("stop", req.params.id)));
    router.get(routes.docker.container.logs, (req, res, next) => result(res, next, dockerService.logs(req.params.id)));

    router.delete(routes.docker.image.rm, (req, res, next) => result(res, next, dockerService.rm("image", req.params.id)));
    router.delete(routes.docker.container.rm, (req, res, next) => result(res, next, dockerService.rm("container", req.params.id)));
    router.delete(routes.docker.volume.rm, (req, res, next) => result(res, next, dockerService.rm("volume", req.params.id)));
    router.delete(routes.docker.network.rm, (req, res, next) => result(res, next, dockerService.rm("network", req.params.id)));

    return router;
}

function result(res: Response, next: NextFunction, result: Promise<unknown>) {
    return result
        .catch(err => err)
        .then(result => result instanceof Error
            ? next(result)
            : res.json(result));
}
