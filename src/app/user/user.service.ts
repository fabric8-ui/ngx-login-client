import { Injectable, Inject } from '@angular/core';
import { Headers, Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

import { Broadcaster } from '../shared/broadcaster.service';
import { AuthenticationService } from '../auth/authentication.service';
import { Logger } from '../shared/logger.service';
import { AUTH_API_URL } from '../shared/auth-api';
import { User } from './user';

//import { ProfileService } from './../profile/profile.service';

@Injectable()
export class UserService {

  userData: User = {} as User;
  allUserData: User[] = [];

  private headers = new Headers({'Content-Type': 'application/json'});
  private userUrl: string;  // URL to web api
  private usersUrl: string;  // URL to web api


  constructor(private http: Http,
              private logger: Logger,
              private auth: AuthenticationService,
              private broadcaster: Broadcaster,
              @Inject(AUTH_API_URL) apiUrl: string
              //private profile: ProfileService
  ) {
    this.userUrl = apiUrl + 'user';
    this.usersUrl = apiUrl + 'users';
    this.broadcaster.on<string>('logout')
      .subscribe(message => {
        this.resetUser();
      });
  }

  getSavedLoggedInUser(): User {
    return this.userData;
  }

  getLocallySavedUsers(): User[] {
    return this.allUserData;
  }

  getUser(): Promise<User> {
    // Check if we have the user data if not then check if the user is logged in.
    // We need the auth key to get the user data. So either we already the data or we don't have the keys
    //   in either case don't try to get the data.
    if (Object.keys(this.userData).length || !this.auth.isLoggedIn()) {
      return new Promise((resolve, reject) => {
        resolve(this.userData);
      });
    } else {
      this.headers.set('Authorization', 'Bearer ' + this.auth.getToken());
      return this.http
        .get(this.userUrl, {headers: this.headers})
        .toPromise()
        .then(response => {
          let userData = response.json().data as User;
          // The reference of this.userData is
          // being used in Header
          // So updating the value like that
          this.userData.attributes = {
            fullName: userData.attributes.fullName,
            imageURL: userData.attributes.imageURL,
            username: userData.attributes.username,
            bio: userData.attributes.bio,
            primaryEmail: userData.attributes.email
          };
          this.userData.id = userData.id;
          // this.profile.initDefaults(this.userData);
          this.broadcaster.broadcast('currentUserInit', this.userData);
          return this.userData;
        })
        .catch ((e) => {
          if (e.status === 401) {
            this.auth.logout();
          } else {
            this.handleError(e);
          }
        });
    }
  }

  getAllUsers(): Promise<User[]> {
    if (this.allUserData.length) {
      return new Promise((resolve, reject) => {
        resolve(this.allUserData);
      });
    } else {
      return this.http
        .get(this.usersUrl, {headers: this.headers})
        .toPromise()
        .then(response => {
          this.allUserData = response.json().data as User[];
          return this.allUserData;
        })
        .catch(this.handleError);
    }
  }

  resetUser(): void {
    this.userData = {} as User;
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }

}
