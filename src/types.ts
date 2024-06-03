export type Dimension = [width: number, height: number];
export type Coordinate = [number, number];
export type Bounds = [topLeft: Coordinate, bottomRight: Coordinate];

export const MAX_UINT32: number = 4_294_967_295

export const FORK_OPTIONS = {
    execArgv: [
        '-r', 'ts-node/register',
        // '--inspect-brk=9230'
    ]
};
export type Message = {
    cmd: string;
    data: string
};