import {
  CREATE_PASSWORD_HOST,
  CREATE_PASSWORD_ROUTE,
  EMAIL_APP_PASSWORD,
  EMAIL_SENDER
} from '@src/config/server';
import { SendEmailError } from '@src/domain/errors/send-email';
import { encrypt } from '@src/helpers/message-encryption';
import nodemailer from 'nodemailer';
import { urlJoin } from 'url-join-ts';

export const sendEmailToVolunteer = async (email: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.kinghost.net',
      port: 587,
      secure: false,
      auth: {
        user: EMAIL_SENDER,
        pass: EMAIL_APP_PASSWORD
      }
    });

    const emailHash = encrypt(email);
    const resetPasswordPath = urlJoin(
      CREATE_PASSWORD_HOST,
      CREATE_PASSWORD_ROUTE,
      emailHash
    );

    await new Promise((resolve, reject) => {
      transporter.sendMail(
        {
          from: 'info@palavrasdepaz.org ',
          to: email,
          subject: 'Cadastro Senha Palavra da Paz',
          html: `<p>Olá! Esse email foi enviado para criar sua nova senha no sistema do Palavraz de Paz, por favor utilize esse link: ${resetPasswordPath}<p>`
        },
        (err, info) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve(info);
          }
        }
      );
    });
  } catch (error) {
    throw new SendEmailError({
      name: 'COULD_NOT_SEND_EMAIL_ERROR',
      message: `Could not send email to ${email}`,
      details: error
    });
  }
};
