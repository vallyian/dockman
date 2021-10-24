export interface Image {
    REPOSITORY: string;
    TAG: string;
    ID: string;
    CREATED: string;
    SIZE: string;
}

export interface Container {
    ID: string;
    IMAGE: string;
    COMMAND: string;
    CREATED: string;
    STATUS: string;
    UP: boolean;
    PORTS: string[];
    NAMES: string;
}

export interface Volume {
    DRIVER: string;
    NAME: string;
}

export interface Network {
    ID: string;
    NAME: string;
    DRIVER: string;
    SCOPE: string;
}

export interface Log {
    dt: Date;
    log: string;
    err?: boolean;
}
