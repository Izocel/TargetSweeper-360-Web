import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const app = express();
const PORT = process.env.PORT || 4000;
const outputDir = path.join(process.cwd(), 'projects');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created output directory: ${outputDir}`);
}

app.use(cors());
app.use(bodyParser.json({ limit: '2mb' }));
app.use('/downloads', express.static(outputDir));

// Multer setup for KML uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Helper: cleanup logic (shared with /api/generate)
function cleanupProjectsDir() {
    try {
        const dirs = fs.readdirSync(outputDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name)
            .map(name => {
                const fullPath = path.join(outputDir, name);
                const stat = fs.statSync(fullPath);
                return { name, fullPath, ctime: stat.ctimeMs };
            })
            .sort((a, b) => a.ctime - b.ctime);
        const now = Date.now();
        // Delete all older than 24h
        for (const dir of dirs) {
            if (now - dir.ctime > 24 * 60 * 60 * 1000) {
                fs.rmSync(dir.fullPath, { recursive: true, force: true });
                console.log(`Deleted old project folder: ${dir.fullPath}`);
            }
        }
        // Refresh dirs after deleting old ones
        const remainingDirs = fs.readdirSync(outputDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name)
            .map(name => {
                const fullPath = path.join(outputDir, name);
                const stat = fs.statSync(fullPath);
                return { name, fullPath, ctime: stat.ctimeMs };
            })
            .sort((a, b) => a.ctime - b.ctime);
        // If more than 100, delete oldest until only 100 remain
        while (remainingDirs.length > 100) {
            const dir = remainingDirs.shift();
            if (dir) {
                fs.rmSync(dir.fullPath, { recursive: true, force: true });
                console.log(`Deleted excess project folder: ${dir.fullPath}`);
            }
        }
    } catch (cleanupErr) {
        console.warn('Cleanup error:', cleanupErr);
    }
}

// KML upload endpoint
app.post('/api/upload-kml', upload.single('file'), async (req, res) => {
    cleanupProjectsDir();
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    const file = req.file;
    // Accept only KML MIME or .kml extension
    const isKmlMime = file.mimetype === 'application/vnd.google-earth.kml+xml';
    const isKmlExt = file.originalname.toLowerCase().endsWith('.kml');
    if (!isKmlMime && !isKmlExt) {
        return res.status(400).json({ error: 'Only KML files are allowed.' });
    }
    try {
        // Unique folder for upload
        const safeName = file.originalname.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
        const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const projectFolder = `${safeName}_${uniqueSuffix}`;
        const projectDir = path.join(outputDir, projectFolder);
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }
        const kmlPath = path.join(projectDir, file.originalname);
        fs.writeFileSync(kmlPath, file.buffer);
        res.json({
            name: file.originalname,
            url: `/downloads/${projectFolder}/${file.originalname}`
        });
    } catch (err) {
        console.error('Error in /api/upload-kml:', err && err.stack ? err.stack : err);
        res.status(500).json({ error: err && err.message ? err.message : 'Unknown error' });
    }
});

// (Declarations already present above, remove these duplicates)

// API endpoint to generate KML/CSV/KMZ from form data
app.post('/api/generate', async (req, res) => {
    // Clean up: delete oldest project folders if their lifetime exceeds 24h or if more than 100 projects exist
    try {
        const dirs = fs.readdirSync(outputDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name)
            .map(name => {
                const fullPath = path.join(outputDir, name);
                const stat = fs.statSync(fullPath);
                return { name, fullPath, ctime: stat.ctimeMs };
            })
            .sort((a, b) => a.ctime - b.ctime);
        const now = Date.now();
        // Delete all older than 24h
        for (const dir of dirs) {
            if (now - dir.ctime > 24 * 60 * 60 * 1000) {
                fs.rmSync(dir.fullPath, { recursive: true, force: true });
                console.log(`Deleted old project folder: ${dir.fullPath}`);
            }
        }
        // Refresh dirs after deleting old ones
        const remainingDirs = fs.readdirSync(outputDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name)
            .map(name => {
                const fullPath = path.join(outputDir, name);
                const stat = fs.statSync(fullPath);
                return { name, fullPath, ctime: stat.ctimeMs };
            })
            .sort((a, b) => a.ctime - b.ctime);
        // If more than 100, delete oldest until only 100 remain
        while (remainingDirs.length > 100) {
            const dir = remainingDirs.shift();
            if (dir) {
                fs.rmSync(dir.fullPath, { recursive: true, force: true });
                console.log(`Deleted excess project folder: ${dir.fullPath}`);
            }
        }
    } catch (cleanupErr) {
        console.warn('Cleanup error:', cleanupErr);
    }
    const project = req.body;
    try {
        // Wrap single project in the expected structure
        const generation = {
            ProjectName: project.ProjectName,
            Target: project.Target,
            Sweeper: project.Sweeper,
        };
        const manager = new ProjectManager();

        // Generate a unique folder for this project
        const safeName = (project.ProjectName || 'project')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .slice(0, 32);
        const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const projectFolder = `${safeName}_${uniqueSuffix}`;
        const projectDir = path.join(outputDir, projectFolder);
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }
        const baseName = safeName;
        // Generate files in the unique project folder
        const output = await manager.generateProjectOutputs(generation, projectDir, baseName);

        res.json({
            kmlUrl: `/downloads/${projectFolder}/${path.basename(output.kmlPath)}`,
            csvUrl: `/downloads/${projectFolder}/${path.basename(output.csvPath)}`,
            kmzUrl: `/downloads/${projectFolder}/${path.basename(output.kmzPath)}`,
            summary: output.summary,
        });
    } catch (err) {
        console.error('Error in /api/generate:', err && err.stack ? err.stack : err);
        res.status(500).json({ error: err && err.message ? err.message : 'Unknown error' });
    }
});

app.listen(PORT, () => {
    console.log(`TargetSweeper-360 backend running on port ${PORT}`);
});
