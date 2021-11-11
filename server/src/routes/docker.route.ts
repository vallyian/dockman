﻿import { Router, Response, Request, NextFunction } from "express";
import { routes } from "../../../shared/routes";
import * as dockerService from "../services/docker.service";

export default function setDockerRoute(router: Router): Router {
    router.get(routes.docker.image.ls, imageLs);
    router.get(routes.docker.container.ls, containerLs);
    router.get(routes.docker.volume.ls, volumeLs);
    router.get(routes.docker.network.ls, networkLs);

    router.get(routes.docker.image.inspect, imageInspect);
    router.get(routes.docker.container.inspect, containerInspect);
    router.get(routes.docker.volume.inspect, volumeInspect);
    router.get(routes.docker.network.inspect, networkInspect);

    router.get(routes.docker.container.start, containerStart);
    router.get(routes.docker.container.stop, containerStop);
    router.get(routes.docker.container.logs, containerLogs);

    router.delete(routes.docker.image.rm, imageRm);
    router.delete(routes.docker.container.rm, containerRm);
    router.delete(routes.docker.volume.rm, volumeRm);
    router.delete(routes.docker.network.rm, networkRm);

    return router;
}

function imageLs(req: Request, res: Response, next: NextFunction) {
    return dockerService.imageLs(req.params.id).then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}
function containerLs(_req: Request, res: Response, next: NextFunction) {
    return dockerService.containerLs().then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}
function volumeLs(_req: Request, res: Response, next: NextFunction) {
    return dockerService.volumeLs().then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}
async function networkLs(_req: Request, res: Response, next: NextFunction) {
    return dockerService.networkLs().then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}

function imageInspect(req: Request, res: Response, next: NextFunction) {
    return dockerService.inspect("image", req.params.id).then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}
function containerInspect(req: Request, res: Response, next: NextFunction) {
    return dockerService.inspect("container", req.params.id).then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}
function volumeInspect(req: Request, res: Response, next: NextFunction) {
    return dockerService.inspect("volume", req.params.id).then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}
async function networkInspect(req: Request, res: Response, next: NextFunction) {
    return dockerService.inspect("network", req.params.id).then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}

async function containerStart(req: Request, res: Response, next: NextFunction) {
    return dockerService.container("start", req.params.id).then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}
async function containerStop(req: Request, res: Response, next: NextFunction) {
    return dockerService.container("stop", req.params.id).then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}
async function containerLogs(req: Request, res: Response, next: NextFunction) {
    return dockerService.logs(req.params.id).then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}

async function imageRm(req: Request, res: Response, next: NextFunction) {
    return dockerService.rm("image", req.params.id).then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}
async function containerRm(req: Request, res: Response, next: NextFunction) {
    return dockerService.rm("container", req.params.id).then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}
async function volumeRm(req: Request, res: Response, next: NextFunction) {
    return dockerService.rm("volume", req.params.id).then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}
async function networkRm(req: Request, res: Response, next: NextFunction) {
    return dockerService.rm("network", req.params.id).then(result => result instanceof Error
        ? next(result)
        : res.json(result));
}
