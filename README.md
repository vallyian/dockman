# dockman

---

## Prerequisites

* [Docker + WSL](https://docs.docker.com/docker-for-windows/wsl/)
* Add `dockman` to hosts file and avoid using `localhost`
* [Node.js v14 LTS](https://nodejs.org/en/) - only for development

---

## Build

`./run build`

---

## Test

`./run test`

---

## Run

`./run`  => [http://dockman/](http://dockman/)

*Note*:
If `env` folder doesn't exist, it will be created with self-signed certs and random generated secrets.  
Services are inaccessible on the host (by design).  
