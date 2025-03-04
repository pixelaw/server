import path from "path"
import express from "express"
import fse from "fs-extra"
import { tilesDir } from "./config.ts"

export async function setupRoutes(app) {
    app.use("/", express.static(process.env["WEB_DIR"]))

    app.get("/tiles/:filename.png", async (req, res) => {
        const filePath = path.join(tilesDir, req.params.filename + ".png")

        try {
            const exists = await fse.pathExists(filePath)
            if (exists) {
                res.sendFile(filePath)
            } else {
                console.log(req.params.filename, "not found")
                res.sendStatus(404)
            }
        } catch (error) {
            console.error(filePath, error)
            res.status(500).send("Server error")
        }
    })
}
