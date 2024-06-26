import path from "path";

export const storageDir = path.resolve(process.env["STORAGE_DIR"] ?? './storage')
export const tilesDir =  path.resolve(process.env["TILES_DIR"] ?? `${storageDir}/tiles`)