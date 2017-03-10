import { Injectable, Inject } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Observable } from 'rxjs';

import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/catch';
import { cloneDeep } from 'lodash';

import { Broadcaster } from '../shared/broadcaster.service';
import { AuthenticationService } from '../auth/authentication.service';
import { Logger } from '../shared/logger.service';
import { AUTH_API_URL } from '../shared/auth-api';
import { User } from './user';

/**
 *  Provides user and user list methods to retrieve current or user list details
 *
 *  The UserService should be injected at the root of the application to ensure it is a singleton
 *  getUser and getAllUsers return observables that can be subscribed to for information
 */
@Injectable()
export class UserService {

  /**
   * @deprecated since v0.4.4. Use {@link #loggedInUser} instead.
   */
  private userData: User = {} as User;

  /**
   * @deprecated since v0.4.4. No replacement method is provided.
   */
  private allUserData: User[] = [];

  private headers = new Headers({ 'Content-Type': 'application/json' });
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
    // TODO Remove these when we remove deprecated methods
    this.loggedInUser.subscribe(val => this.userData = val);
    this.getAllUsers().subscribe(val => this.allUserData = val);
  }

  /**
   * The currently logged in user
   */
  get loggedInUser(): Observable<User> {
    return this.http
      .get(this.userUrl, { headers: this.headers })
      .map(response => {
        let userData = cloneDeep(response.json().data as User);
        userData.attributes.primaryEmail = userData.attributes.email;
        return userData;
      });
  }

  /**
   * Get the User object for a given user id, or null if no user is found
   * @param userId the userId to search for
   */
  getUserByUserId(userId: string): Observable<User> {
    return this.getAllUsers().map(val => {
      for (let u of val) {
        if (userId === u.id) {
          return u;
        }
      }
      return null;
    });
  }

  /**
   * Get the User object for a given username, or null if no user is found
   * @param username the username to search for
   */
  getUserByUsername(username: string): Observable<User> {
    return this.getAllUsers().map(val => {
      for (let u of val) {
        if (username === u.attributes.username) {
          return u;
        }
      }
      return null;
    });
  }


  /**
   * @deprecated since v0.4.4. Use {@link #loggedInUser} instead.
   */
  getSavedLoggedInUser(): User {
    return this.userData;
  }

  /**
   * @deprecated since v0.4.4. No replacement is provided.
   */
  getLocallySavedUsers(): User[] {
    return this.allUserData;
  }

  /**
   * @deprecated since v0.4.4. Use {@link #loggedInUser} instead.
   * Get currently logged in user
   *
   * @returns Observable<User>
   */
  getUser(): Observable<User> {
    return this.loggedInUser;
  }

  /**
   * @deprecated since v0.4.4. No replacement is provided.
   * Get all users
   *
   * @returns Observable<User[]>
   */
  getAllUsers(): Observable<User[]> {
    return this.http
      .get(this.usersUrl, { headers: this.headers })
      .map(response => {
        this.allUserData = response.json().data as User[];
        return this.allUserData;
      });
  }

  /**
   * @deprecated since v0.4.4. No replacement is provided.
   *
   */
  resetUser(): void {
    this.userData = {} as User;
  }
}
