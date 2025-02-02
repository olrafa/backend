import { VolunteerRepository } from '@src/domain/interfaces/repositories/volunteer-repository';
import { VolunteerEntity } from '@src/domain/entities/volunteer/volunteer-entity';
import { sign } from 'jsonwebtoken';
import { HELPDESK_EMAIL, INFO_EMAIL, JWT_SECRET_KEY } from '@src/config/server';
import { VolunteerJWTPayload } from '../types/volunteer-jwt-payload';
import { VolunteerError } from '@src/domain/errors/volunteer';
import {
  Body,
  Controller,
  FieldErrors,
  Head,
  Patch,
  Path,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags
} from 'tsoa';
import { inject } from 'inversify';
import { SequelizeVolunteerRepository } from '@src/services/repositories/sequelize-volunteer-repository';
import { provide } from 'inversify-binding-decorators';
import { sendEmailToVolunteer } from '@src/services/email-service/send-password-email';
import { VolunteerAuthDataEntity } from '@src/domain/entities/volunteer/volunteer-auth-entity';
import { checkPlainWithHash } from '@src/helpers/message-hashing';
import { decrypt } from '@src/helpers/message-encryption';
import { ApiError } from '../types/api-error';
import { CreateVolunteerEntity } from '@src/domain/entities/volunteer/create-volunteer-entity';
import { SendEmailError } from '@src/domain/errors/send-email';
import { validationExample } from '@src/documentation/validation-example';
import { SupportEmailSendData } from '@src/services/email-service/types/support-email-send-data';
import { sendEmailToSupport } from '@src/services/email-service/send-email-to-support';
import { PermissionEntity } from '@src/domain/entities/volunteer/permission-entity';

@Route('volunteers')
@Response<{ message: string; details: FieldErrors }>(
  422,
  'Validation Error',
  validationExample
)
@provide(UnsecuredVolunteerAPI)
@Tags('Volunteer')
export class UnsecuredVolunteerAPI extends Controller {
  private volunteerRepository: VolunteerRepository;

  constructor(
    @inject(SequelizeVolunteerRepository)
    volunteerRepository: VolunteerRepository
  ) {
    super();
    this.volunteerRepository = volunteerRepository;
  }

  /**
   * Check if the email already exists on the system.
   *
   */
  @Head('{email}')
  @SuccessResponse(200, 'The email exists')
  @Response<VolunteerError>(404, 'Could not find the email')
  async checkExistingEmail(@Path() email: string): Promise<void> {
    const volunteer = await this.volunteerRepository.getVolunteerByEmail(email);

    if (!volunteer)
      throw new ApiError(
        404,
        new VolunteerError({
          name: 'VOLUNTEER_NOT_FOUND',
          message: `Volunteer with email ${email} not found`
        })
      );
  }

  /**
   * Create the volunteer password if it does not exist or udpdate it.
   *
   * IMPORTANT: That route differently from the PUT /{email}/password
   * receives a hashed email, that email should only be retrieved from the POST /password-email
   * link send to the volunteer email. Furthermore, this route does not have authentication
   * as the email is hashed.
   */
  @Patch('password')
  @SuccessResponse(204, 'Password Successfully created or updated')
  @Response<VolunteerError>(400, 'Could not find volunteer')
  async createOrUpdatePasswordForHashEmail(
    @Body() createOrUpatePassData: { password: string; hashEmail: string }
  ): Promise<void> {
    const email = decrypt(createOrUpatePassData.hashEmail);

    const success =
      await this.volunteerRepository.updateOrCreatePasswordForEmail(
        email,
        createOrUpatePassData.password
      );

    if (!success) {
      throw new ApiError(
        400,
        new VolunteerError({
          name: 'VOLUNTEER_NOT_FOUND',
          message:
            'Could not create or update volunteer password because it was not found'
        })
      );
    }
  }

  /**
   * Generate an access token for the volunteer if his login data is correct
   */
  @Post('login')
  @SuccessResponse(200, 'Success Login')
  @Response<VolunteerError>(400, 'Wrong email or password', {
    name: 'EMAIL_OR_PASSWORD_WRONG_ERROR',
    message: 'Email or Password wrong'
  })
  async login(
    @Body() loginData: Pick<VolunteerAuthDataEntity, 'password' | 'email'>
  ): Promise<{ token: string; volunteer: VolunteerEntity }> {
    const volunteerWithAuth =
      await this.volunteerRepository.getVolunteerWithAuthDataByEmail(
        loginData.email
      );

    if (
      volunteerWithAuth &&
      checkPlainWithHash(loginData.password, volunteerWithAuth.password)
    ) {
      let permissions: PermissionEntity | null = null;

      if (volunteerWithAuth.authorPermission) {
        permissions = await this.volunteerRepository.getPermissionByAuthName(
          volunteerWithAuth.authorPermission
        );
      }

      const {
        bookPermission,
        certificationPermission,
        password: _password,
        readPermission,
        ...volunteer
      } = volunteerWithAuth;
      const payload: VolunteerJWTPayload = {
        email: volunteer.email,
        idvol: volunteer.idvol,
        bookPermission: bookPermission ? true : undefined,
        certificationPermission: certificationPermission ? true : undefined,
        readPermission: readPermission ? true : undefined,
        ...permissions?.permissions
      };

      const token = sign(payload, JWT_SECRET_KEY, { expiresIn: '2h' });
      return { token: token, volunteer };
    } else {
      throw new ApiError(
        400,
        new VolunteerError({
          name: 'EMAIL_OR_PASSWORD_WRONG_ERROR',
          message: 'Email or Password wrong'
        })
      );
    }
  }

  /**
   * Create the volunteer
   */
  @Post()
  @SuccessResponse(201, 'Volunteer Created')
  @Response<VolunteerError>(400, 'Volunteer already exists', {
    name: 'VOLUNTEER_ALREADY_EXISTS',
    message: 'Volunteer with email {some email} already exists'
  })
  async createVolunteer(
    @Body() volunteer: CreateVolunteerEntity
  ): Promise<VolunteerEntity> {
    try {
      const createdVolunteer = await this.volunteerRepository.createVolunteer(
        volunteer
      );
      return createdVolunteer;
    } catch (error) {
      throw new ApiError(400, error as VolunteerError);
    }
  }

  /**
   * Sends email from volunteer to helpdesk email
   */
  @Post('help-email')
  @SuccessResponse(200, 'Successfully sent help email')
  @Response<SendEmailError>(400, 'Could not send email')
  async sendHelpEmail(@Body() helpEmailData: SupportEmailSendData) {
    try {
      await sendEmailToSupport(helpEmailData, HELPDESK_EMAIL);
    } catch (error) {
      throw new ApiError(400, error as SendEmailError);
    }
  }

  /**
   * Sends email from volunteer to contact email
   */
  @Post('contact-email')
  @SuccessResponse(200, 'Successfully sent help email')
  @Response<SendEmailError>(400, 'Could not send email')
  async sendContactEmail(@Body() contactEmailData: SupportEmailSendData) {
    try {
      await sendEmailToSupport(contactEmailData, INFO_EMAIL);
    } catch (error) {
      throw new ApiError(400, error as SendEmailError);
    }
  }

  /**
   * Sends an email to the volunteer with a link for creating or update a forgotten password.
   *
   * The link contains the user email hash in the path as the following format:
   *
   * GET /{reset-password-route}/{email-hash}
   *
   */
  @Post('password-email')
  @SuccessResponse(200, 'Successfully sent the email to the volunteer')
  @Response<VolunteerError>(400, 'Could not find volunteer')
  @Response<SendEmailError>(400, 'Could not send email')
  async sendCreatePasswordEmail(
    @Body() emailWrapper: Pick<VolunteerAuthDataEntity, 'email'>
  ): Promise<void> {
    const volunteer = await this.volunteerRepository.getVolunteerByEmail(
      emailWrapper.email
    );

    if (!volunteer)
      throw new ApiError(
        400,
        new VolunteerError({
          name: 'VOLUNTEER_NOT_FOUND',
          message: `Volunteer with email ${emailWrapper.email} not found`
        })
      );

    try {
      await sendEmailToVolunteer(emailWrapper.email);
    } catch (error) {
      throw new ApiError(400, error as SendEmailError);
    }
  }
}
