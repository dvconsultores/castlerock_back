import { Injectable } from '@nestjs/common';
import path from 'path';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';
import { UtilsShared } from '../utils/utils.shared';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail({
    to,
    subject,
    text = '',
    template,
    context = {},
  }: {
    to: string;
    subject: string;
    text?: string;
    template?: string;
    context?: Record<string, any>;
  }) {
    console.log('Sending email...');
    const mailOptions: any = {
      to,
      subject,
      text,
    };

    if (template) {
      mailOptions.template = template;
      mailOptions.context = context;
    }

    try {
      const result = await this.mailerService.sendMail(mailOptions);
      console.log('Email enviado con éxito');
      return result;
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      throw new Error('Error al enviar el correo');
    }
  }
}
