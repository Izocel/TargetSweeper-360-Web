import multer from 'multer';

export class Upload {
    static getMulterInstance() {
        return multer({
            storage: multer.memoryStorage(),
            limits: { fileSize: 5 * (1024 ** 2) },
        });
    }
}
