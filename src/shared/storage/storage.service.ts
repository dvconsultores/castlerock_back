import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import * as mime from 'mime-types';
import { EnvironmentVariables } from '../../config/env';
import { Multer } from 'multer';

@Injectable()
export class StorageService {
  private s3: S3Client;
  private bucketName: string;
  private endpoint: string;

  constructor(private readonly configService: ConfigService<EnvironmentVariables>) {
    this.bucketName = this.configService.get<string>('DO_SPACES_BUCKET')!;
    this.endpoint = this.configService.get<string>('DO_SPACES_ENDPOINT')!;

    this.s3 = new S3Client({
      region: this.configService.get<string>('DO_SPACES_REGION')!,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: this.configService.get<string>('DO_SPACES_KEY')!,
        secretAccessKey: this.configService.get<string>('DO_SPACES_SECRET')!,
      },
    });
  }

  async upload(file: Multer.File): Promise<string> {
    const extension = mime.extension(file.mimetype) || extname(file.originalname);
    const key = `kindergarden/uploads/${uuidv4()}.${extension}`;

    const uploadParams: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    await this.s3.send(new PutObjectCommand(uploadParams));

    return `${this.endpoint}/${this.bucketName}/${key}`;
  }
}
