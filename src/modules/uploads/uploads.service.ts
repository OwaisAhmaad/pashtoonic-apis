import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly uploadPath: string;
  private readonly staticUrl: string;

  constructor(private config: ConfigService) {
    this.uploadPath = this.config.get<string>('upload.path') ?? './uploads';
    this.staticUrl = this.config.get<string>('upload.staticUrl') ?? '/static';
    this.ensureDirectories();
  }

  private ensureDirectories() {
    const dirs = ['avatars', 'audio'].map((d) => path.resolve(this.uploadPath, d));
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    const maxSize = this.config.get<number>('upload.maxAvatarSizeBytes') ?? 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(`Avatar must be under ${maxSize / 1024 / 1024}MB`);
    }
    const url = `${this.staticUrl}/avatars/${file.filename}`;
    return { url, filename: file.filename };
  }

  uploadAudio(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    const maxSize = this.config.get<number>('upload.maxAudioSizeBytes') ?? 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(`Audio must be under ${maxSize / 1024 / 1024}MB`);
    }
    const url = `${this.staticUrl}/audio/${file.filename}`;
    return { url, filename: file.filename };
  }
}
