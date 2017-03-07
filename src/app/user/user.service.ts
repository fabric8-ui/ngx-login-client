import { Injectable, Inject } from '@angular/core';
import { Headers, Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/catch';

import { Broadcaster } from '../shared/broadcaster.service';
import { AuthenticationService } from '../auth/authentication.service';
import { Logger } from '../shared/logger.service';
import { AUTH_API_URL } from '../shared/auth-api';
import { User } from './user';
import { Observable } from 'rxjs';

/**
 *  Provides user and user list methods to retrieve current or user list details
 *
 *  The UserService should be injected at the root of the application to ensure it is a singleton
 *  getUser and getAllUsers return observables that can be subscribed to for information
 */

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

  /**
   * Get currently logged in user
   *
   * @returns Observable<User>
   */
  getUser(): Observable<User> {
    // Check if we have the user data if not then check if the user is logged in.
    // We need the auth key to get the user data. So either we already the data or we don't have the keys
    //   in either case don't try to get the data.
    if (Object.keys(this.userData).length || !this.auth.isLoggedIn()) {
      return Observable.of(this.userData);
    } else {
      return this.http
        .get(this.userUrl, {headers: this.headers})
        .map(response => {
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
          return this.userData;
        });
    }
  }

  /**
   * Get all users
   *
   * @returns Observable<User[]>
   */
  getAllUsers(): Observable<User[]> {
    if (this.allUserData.length) {
      return Observable.of(this.allUserData);
    } else {
      return this.http
        .get(this.usersUrl, {headers: this.headers})
        .map(response => {
          this.allUserData = response.json().data as User[];
          return this.allUserData;
        });
    }
  }

  resetUser(): void {
    this.userData = {} as User;
  }
}
