import { drive_v3 } from '@googleapis/drive';
import { FileHandler } from './file-handler';
import { provideSingleton } from '@src/helpers/provide-singleton';
import { GOOGLE_CLOUD_KEY } from '@src/config/server';
import { createWriteStream, readdirSync, writeFile } from 'fs';
import path from 'path';
import archiver from 'archiver';
import { logger } from '../logger/logger';

@provideSingleton(DriveFileHandler)
export class DriveFileHandler implements FileHandler {
  drive: drive_v3.Drive;

  constructor() {
    this.drive = new drive_v3.Drive({ auth: GOOGLE_CLOUD_KEY });
    logger.info('Created drive Cliente');
  }

  async getFolderName(source: string): Promise<string> {
    const resp = await this.drive.files.get({
      fileId: source,
      supportsAllDrives: true,
      fields: 'name'
    });

    return resp.data.name ?? '';
  }

  private async getFileBufferFromId(fileId: string): Promise<Buffer> {
    const resp = await this.drive.files.get(
      {
        fileId: fileId,
        alt: 'media',
        supportsAllDrives: true
      },
      { responseType: 'arraybuffer' }
    );

    // using any because of not found type from library
    const buffer = Buffer.from(resp.data as any, 'base64');
    return buffer;
  }

  private async getFilesFromSource(
    source: string
  ): Promise<drive_v3.Schema$File[]> {
    const files = (
      await this.drive.files.list({
        supportsAllDrives: true,
        q: `"${source}" in parents`
      })
    ).data.files;

    logger.info('Fetched files from drive');

    return files ? files : [];
  }

  async downloadFilesFromSourceToFolder(
    source: string,
    folder: string
  ): Promise<void[]> {
    const files = await this.getFilesFromSource(source);

    return Promise.all(
      files.map(async (file) => {
        if (file.id && file.name) {
          const fileBuffer = await this.getFileBufferFromId(file.id);
          const filepath = path.join(folder, file.name);
          writeFile(filepath, fileBuffer, (err) => {
            if (err) logger.error(err);
          });
        }
      })
    );
  }

  async zipFiles(source: string, zipName: string): Promise<void> {
    const zipPath = path.join(source, zipName);
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = createWriteStream(zipPath);
    const files = readdirSync(source);

    logger.info(`Start Creating Zip File from list: ${files}`);

    return new Promise((resolve, reject) => {
      files.forEach((file) =>
        archive.file(path.join(source, file), {
          name: file
        })
      );

      archive
        .on('error', (err) => {
          if (err) logger.error(err);
          reject(err);
        })
        .pipe(stream);
      archive.on('end', () => {
        resolve();
      });
      archive.finalize();
    });
  }
}
