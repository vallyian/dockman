import { Router, Response, Request, NextFunction } from "express";
import { routes } from "../../../shared/routes";
import * as dockerService from "../services/docker.service";

export default function setDockerRoute(router: Router): Router {
    router.get(routes.docker.image.ls, imageLs);

    router.get(routes.docker.container.ls, containerLs);
    router.post(routes.docker.container.start, containerStart);
    router.post(routes.docker.container.stop, containerStop);

    router.get(routes.docker.volume.ls, volumeLs);

    router.get(routes.docker.network.ls, networkLs);

    return router;
}

async function imageLs(req: Request, res: Response, next: NextFunction) {
    return dockerService.imageLs(req.params.item)
        .then(result => result
            ? res.json(result)
            : res.status(404).end())
        .catch(e => (e.status = 500, next(e)));
}

async function containerLs(req: Request, res: Response, next: NextFunction) {
    return dockerService.containerLs(req.params.item)
        .then(result => result
            ? res.json(result)
            : res.status(404).end())
        .catch(e => (e.status = 500, next(e)));
}

async function containerStart(req: Request, res: Response, next: NextFunction) {
    return dockerService.containerStart(req.body.id)
        .then(result => result
            ? res.json(result)
            : res.status(404).end())
        .catch(e => (e.status = 500, next(e)));
}

async function containerStop(req: Request, res: Response, next: NextFunction) {
    return dockerService.containerStop(req.body.id)
        .then(result => result
            ? res.json(result)
            : res.status(404).end())
        .catch(e => (e.status = 500, next(e)));
}

async function volumeLs(req: Request, res: Response, next: NextFunction) {
    return dockerService.volumeLs(req.params.item)
        .then(result => result
            ? res.json(result)
            : res.status(404).end())
        .catch(e => (e.status = 500, next(e)));
}

async function networkLs(req: Request, res: Response, next: NextFunction) {
    return dockerService.networkLs(req.params.item)
        .then(result => result
            ? res.json(result)
            : res.status(404).end())
        .catch(e => (e.status = 500, next(e)));
}
