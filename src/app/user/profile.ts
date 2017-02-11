// import { Email } from './email';

export class Profile {
    fullName: string;
    imageURL: string;
    username: string;
    bio?: string;
    url?: string;
    provider?: string;
    email?: string;
    emails?: string[];
    primaryEmail?: string;
    notificationEmail?: string;
    publicEmail?: string;
    primaryEmailPrivate?: boolean;
    emailPreference?: string;
    notificationMethods?: string[];
}
