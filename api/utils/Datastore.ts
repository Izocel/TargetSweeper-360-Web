import fs from 'fs';
import path from 'path';

export class DataStore {
    static basePath = path.join(process.cwd(), 'data');
    static projectsDir = path.join(this.basePath, 'projects');

    static ensureDir() {
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
        if (!fs.existsSync(this.projectsDir)) {
            fs.mkdirSync(this.projectsDir, { recursive: true });
        }
    }

    static getFilePath(filename: string): string {
        return path.join(this.basePath, filename);
    }

    static saveFile(filename: string, data: Buffer | string) {
        this.ensureDir();
        fs.writeFileSync(this.getFilePath(filename), data);
    }

    static readFile(filename: string, encoding: BufferEncoding = 'utf8'): string | Buffer {
        this.ensureDir();
        return fs.readFileSync(this.getFilePath(filename), encoding);
    }

    static fileExists(filename: string): boolean {
        return fs.existsSync(this.getFilePath(filename));
    }

    static deleteFile(filename: string) {
        if (this.fileExists(filename)) {
            fs.unlinkSync(this.getFilePath(filename));
        }
    }

    static listFiles(): string[] {
        this.ensureDir();
        return fs.readdirSync(this.basePath);
    }

    static getProjectDirs(): Array<{ name: string; fullPath: string; ctime: number }> {
        this.ensureDir();
        return fs.readdirSync(this.projectsDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name)
            .map(name => {
                const fullPath = path.join(this.projectsDir, name);
                const stat = fs.statSync(fullPath);
                return { name, fullPath, ctime: stat.ctimeMs };
            })
            .sort((a, b) => a.ctime - b.ctime);
    }

    static cleanupProjectsDir() {
        try {
            const now = Date.now();
            let dirs = this.getProjectDirs();
            for (const dir of dirs) {
                if (now - dir.ctime > 24 * 60 * 60 * 1000) {
                    fs.rmSync(dir.fullPath, { recursive: true, force: true });
                    console.log(`[DataStore] Deleted old project folder: ${dir.fullPath}`);
                }
            }
            dirs = this.getProjectDirs();
            while (dirs.length > 100) {
                const dir = dirs.shift();
                if (dir) {
                    fs.rmSync(dir.fullPath, { recursive: true, force: true });
                    console.log(`[DataStore] Deleted excess project folder: ${dir.fullPath}`);
                }
            }
        } catch (cleanupErr) {
            console.warn('[DataStore] Cleanup error:', cleanupErr);
        }
    }

    static getSafeFolderName(baseName: string): string {
        return (baseName || 'project').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
    }

    static createProjectDir(baseName: string) {
        this.ensureDir();
        this.cleanupProjectsDir();
        const safeName = this.getSafeFolderName(baseName);
        const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const projectFolder = `${safeName}_${uniqueSuffix}`;
        const projectDir = path.join(this.projectsDir, projectFolder);
        return { projectDir, projectFolder, safeName };
    }

    static saveProjectFile(projectDir: string, filename: string, data: Buffer | string): string {
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }
        const filePath = path.join(projectDir, filename);
        fs.writeFileSync(filePath, data);
        return filePath;
    }
}
