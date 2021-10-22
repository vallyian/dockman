# dockman

---

## Prerequisites

* [Docker + WSL](https://docs.docker.com/docker-for-windows/wsl/)
* Add `dockman` to hosts file and avoid using `localhost`
* [Node.js v14 LTS](https://nodejs.org/en/) - only for development

---

## Build

`docker build -t dockman .`

---

## Run

`docker run --name dockman -v /var/run/docker.sock:/var/run/docker.sock -p 80:80 --restart=always -d dockman` => [http://dockman/](http://dockman/)

*Note*:
If `env` folder doesn't exist, it will be created with self-signed certs and random generated secrets.  
Services are inaccessible on the host (by design).  

---

## Debug

* `docker run --name dockman -v /var/run/docker.sock:/var/run/docker.sock -p 80:80 -e DEBUG=* -it dockman sh`
* attach VS Code to `dockman` container, opem Javascript debug terminal, run `node .`
