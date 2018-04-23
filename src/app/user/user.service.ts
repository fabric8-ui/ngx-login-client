import { Injectable, Inject } from '@angular/core';
import { Headers, Http, Response } from '@angular/http';

import {
  Observable,
  ConnectableObservable,
  ReplaySubject,
  Subject
} from 'rxjs';

import { cloneDeep } from 'lodash';
import { Broadcaster, Logger } from 'ngx-base';

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
   * The currently logged in user - please use currentLoggedInUser instead of subscribing
   * TODO: move this to deprecated
   */
  public loggedInUser: ConnectableObservable<User>;

  /**
   * The current logged in user - should be always populated after login
   */
  public currentLoggedInUser: User = {} as User;

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
  private searchUrl: string;

  constructor(private http: Http,
    private logger: Logger,
    broadcaster: Broadcaster,
    @Inject(AUTH_API_URL) apiUrl: string
  ) {
    this.userUrl = apiUrl + 'user';
    this.usersUrl = apiUrl + 'users';
    this.searchUrl = apiUrl + 'search';
    // TODO - switch to internal observable that is populated on initialization
    // and only expose currentLoggedInUser publicly
    this.loggedInUser = Observable.merge(
      broadcaster.on('loggedin')
        .map(val => 'loggedIn'),
      broadcaster.on('logout')
        .map(val => 'loggedOut'),
      broadcaster.on('authenticationError')
        .map(val => 'authenticationError')
    )
      .switchMap(val => {
        // If it's a login event, then we need to retreive the user's details
        if (val === 'loggedIn') {
          return this.http
            .get(this.userUrl, { headers: this.headers })
            .map(response => cloneDeep(response.json().data as User));
        } else {
          // Otherwise, we clear the user
          return Observable.of({} as User);
        }
      })
      .do(user => {
        this.currentLoggedInUser = user;
        // TODO remove this - ensure nobody is using userData anymore
        this.userData = user;
      })
      // In order to ensure any future subscribers get the currently user
      // we use a replay subject of size 1
      .multicast(() => new ReplaySubject(1));
      this.loggedInUser.connect();
  }

  /**
   * Get the User object for a given user id, or null if no user is found
   * @param userId the userId to search for
   */
  getUserByUserId(userId: string): Observable<User> {
    return this.http
      .get(`${this.usersUrl}/${userId}`, { headers: this.headers })
      .map(response => {
        return response.json().data as User;
      });
  }

  /**
   * Get the User object for a given username, or null if no user is found
   * @param username the username to search for
   */
  getUserByUsername(username: string): Observable<User> {
    return this.filterUsersByUsername(username).map(val => {
      for (let u of val) {
        if (username === u.attributes.username) {
          return u;
        }
      }
      return null;
    });
  }

  /**
   * Get users by a search string
   */
  getUsersBySearchString(search: string): Observable<User[]> {
    if (search && search !== "") {
      return this.http
        .get(this.searchUrl + '/users?q=' + search, {headers: this.headers})
        .map(response => {
          return response.json().data as User[];
        });
    }
    return Observable.of([] as User[]);
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
        return response.json().data as User[];
      })
      // TODO remove this
      .do(val => this.allUserData = val);
  }

  /**
   *
   * Filter users by username
   *
   * @returns Observable<User[]>
   */

  filterUsersByUsername(username: string): Observable<User[]> {
    return this.http
      .get( `${this.usersUrl}?filter[username]=${username}`, { headers: this.headers })
      .map(response => {
        return response.json().data as User[];
      });
  }

  /**
   * Send email verification link to user.
   */
  sendEmailVerificationLink(): Observable<Response> {
    return this.http
      .post(this.usersUrl + '/verificationcode', '', { headers: this.headers })
      .map((response: Response) => {
        return response;
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
