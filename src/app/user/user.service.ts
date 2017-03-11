import { Injectable, Inject } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Observable, ConnectableObservable, ReplaySubject, Subject } from 'rxjs';

import { cloneDeep } from 'lodash';

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
   * The currently logged in user
   */
  public loggedInUser: ConnectableObservable<User>;

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
    broadcaster: Broadcaster,
    @Inject(AUTH_API_URL) apiUrl: string
  ) {
    this.userUrl = apiUrl + 'user';
    this.usersUrl = apiUrl + 'users';
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
      // TODO remove this
      .do(user => this.userData = user)
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
      })
      // TODO remove this
      .do(val => this.allUserData = val);
  }

  /**
   * @deprecated since v0.4.4. No replacement is provided.
   *
   */
  resetUser(): void {
    this.userData = {} as User;
  }
}
