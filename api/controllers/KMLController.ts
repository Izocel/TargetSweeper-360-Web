import path from 'path';
import { Request, Response } from 'express';
import { DataStore } from '../utils/Datastore';
import { ProjectManager } from 'targetsweeper-360';

export class KMLController {
    static async uploadKML(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }
        const file = req.file as Express.Multer.File;
        const isKmlMime = file.mimetype === 'application/vnd.google-earth.kml+xml';
        const isKmlExt = file.originalname.toLowerCase().endsWith('.kml');
        if (!isKmlMime && !isKmlExt) {
            return res.status(400).json({ error: 'Only KML files are allowed.' });
        }
        try {
            const newDir = DataStore.createProjectDir(file.originalname);
            DataStore.saveProjectFile(newDir, file.originalname, file.buffer);
            res.json({
                name: file.originalname,
                url: `${newDir}/${file.originalname}`
            });
        } catch (err: any) {
            console.error('Error in /api/upload-kml:', err && err.stack ? err.stack : err);
            res.status(500).json({ error: err && err.message ? err.message : 'Unknown error' });
        }
    }

    static async generateKML(req: Request, res: Response) {
        const project = req.body;
        try {
            const manager = new ProjectManager();
            const newDir = DataStore.createProjectDir(project.ProjectName);
            const generation = {
                ProjectName: project.ProjectName,
                Target: project.Target,
                Sweeper: project.Sweeper,
            };
            const output = await manager.generateProjectOutputs(generation, newDir);
            res.json({
                kmlUrl: `/${output.kmlPath}`,
                csvUrl: `/${output.csvPath}`,
                kmzUrl: `/${output.kmzPath}`,
                summary: output.summary,
            });
        } catch (err: any) {
            console.error('Error in /api/generate:', err && err.stack ? err.stack : err);
            res.status(500).json({ error: err && err.message ? err.message : 'Unknown error' });
        }
    }
}
