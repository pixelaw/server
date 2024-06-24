import express from 'express';
import path from "path";
import fse from "fs-extra";

export async function setupRoutes(app) {
    app.use('/', express.static(process.env["WEB_DIR"]));

    app.get('/tiles/:filename.png', async (req, res) => {
        const storageDir = process.env["STORAGE_DIR"] ?? './storage'
        const tilesDir = process.env["TILES_DIR"] ?? `${storageDir}/tiles`
        const filePath = path.join(tilesDir, req.params.filename + '.png');

        try {
            const exists = await fse.pathExists(filePath);
            if (exists) {
                res.sendFile(filePath);
            } else {
                console.log(req.params.filename, "not found")
                res.sendStatus(404);
            }
        } catch (error) {
            console.error(filePath, error);
            res.status(500).send('Server error');
        }
    });

}