import { UpdateVolunteerEntity } from '@src/domain/entities/volunteer/update-volunteer-entity';
import { VolunteerEntity } from '@src/domain/entities/volunteer/volunteer-entity';
import { VolunteerWithAuthEntity } from '@src/domain/entities/volunteer/volunteer-with-auth-entity';
import { CreateVolunteerEntity } from '@src/domain/entities/volunteer/create-volunteer-entity';

export interface VolunteerRepository {
  updateVolunteer(
    volunteer: UpdateVolunteerEntity,
    email: string
  ): Promise<VolunteerEntity | null>;

  getVolunteerByEmail(email: string): Promise<VolunteerEntity | null>;

  getVolunteerWithAuthDataByEmail(
    email: string
  ): Promise<VolunteerWithAuthEntity | null>;

  getAllVolunteers(): Promise<VolunteerEntity[]>;

  createVolunteer(volunteer: CreateVolunteerEntity): Promise<VolunteerEntity>;

  deleteVolunteerByEmail(email: string): Promise<boolean>;

  updateOrCreatePasswordForEmail(
    email: string,
    password: string
  ): Promise<boolean>;
}
