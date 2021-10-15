export const routes = {
    health: "/api/health",
    docker: {
        base: "/api/docker",
        image: {
            ls: "/image/ls",
            rm: "/image/rm",
            // inspect: "/image/inspect/:item",
        },
        container: {
            ls: "/container/ls",
            rm: "/container/rm",
            start: "/container/start",
            stop: "/container/stop",
            // inspect: "/container/inspect/:item",
        },
        volume: {
            ls: "/volume/ls",
            rm: "/volume/rm",
            // inspect: "/volume/inspect/:item",
        },
        network: {
            ls: "/network/ls",
            rm: "/network/rm",
            // inspect: "/network/inspect/:item",
        },
    },
}
