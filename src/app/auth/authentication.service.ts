import { Injectable, Inject, NgZone } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';

import { Observable, of, Subject } from 'rxjs';
import { catchError, map, publishReplay, switchMap, tap } from 'rxjs/operators';
import { Broadcaster } from 'ngx-base';

import { AUTH_API_URL } from '../shared/auth-api';
import { SSO_API_URL } from '../shared/sso-api';
import { REALM } from '../shared/realm-token';
import { Token } from '../user/token';
import { ConnectableObservable } from 'rxjs/internal/observable/ConnectableObservable';

export interface ProcessTokenResponse {
  (response: HttpResponse<any>): Token;
}

@Injectable()
export class AuthenticationService {

  public gitHubToken: Observable<string>;
  public readonly openshift = 'openshift-v3';
  public readonly github = 'github';

  private refreshInterval: number;
  private apiUrl: string;
  private ssoUrl: string;
  private realm: string;
  private clearTimeoutId: any;
  private refreshTokens: Subject<Token> = new Subject();

  constructor(
    private broadcaster: Broadcaster,
    @Inject(AUTH_API_URL) apiUrl: string,
    @Inject(SSO_API_URL) ssoUrl: string,
    @Inject(REALM) realm: string,
    private http: HttpClient,
    private ngZone: NgZone
  ) {
    this.apiUrl = apiUrl;
    this.ssoUrl = ssoUrl;
    this.realm = realm;
    this.gitHubToken = this.createFederatedToken(this.github);
  }

  logIn(tokenParameter: string): boolean {
    let tokenJson = decodeURIComponent(tokenParameter);
    let token = this.processTokenResponse(JSON.parse(tokenJson));
    this.setupRefreshTimer(token.expires_in);

    // make sure old tokens are cleared out when we login again
    localStorage.removeItem(this.openshift + '_token');
    localStorage.removeItem(this.github + '_token');

    // kick off initial token refresh
    this.refreshTokens.next(token);

    this.onLogIn();
    return true;
  }

  onLogIn() {
    this.broadcaster.broadcast('loggedin', 1);
  }

  logout() {
    this.clearSessionData();
    this.broadcaster.broadcast('logout', 1);
  }

  isLoggedIn(): boolean {
    let token = localStorage.getItem('auth_token');
    if (token) {
      if (!this.clearTimeoutId) {
        // kick off initial token refresh
        this.refreshTokens.next({ 'access_token' : token } as Token);
        this.setupRefreshTimer(15);
      }
      return true;
    }
    return false;
  }

  getToken(): string {
    if (this.isLoggedIn()) {
      return localStorage.getItem('auth_token');
    }
    return '';
  }

  /**
   * Deprecated method - should be replaced with simple getToken() for connecting to OpenShift proxy now
   */
  getOpenShiftToken(): Observable<string> {
    return of(this.getToken());
  }

  isOpenShiftConnected(cluster: string): Observable<boolean> {
    let tokenUrl = this.apiUrl + `token?force_pull=true&for=` + encodeURIComponent(cluster);
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http.get(tokenUrl, httpOptions)
      .pipe(
        map(() =>
          // token returned, openshift is connected
          true
        ),
        catchError(() => {
          // with any exception coming back, return false
          return of(false);
        })
      );
  }


  setupRefreshTimer(refreshInSeconds: number) {
    if (!this.clearTimeoutId) {
      // refresh should be required to be less than ten minutes measured in seconds
      let tenMinutes = 60 * 10;
      if (refreshInSeconds > tenMinutes) {
        refreshInSeconds = tenMinutes;
      }
      let refreshInMs = Math.round(refreshInSeconds * .9) * 1000;
      console.log('Refreshing token in: ' + refreshInMs + ' milliseconds.');
      this.refreshInterval = refreshInMs;
      // Run setTimeout outside angular zone. Without this, all protractor tests fail with
      // "Waiting for Angular" timeout as protractor waits indefinitely.
      // https://github.com/angular/protractor/blob/master/docs/timeouts.md#angular
      this.ngZone.runOutsideAngular(() => {
          // setTimeout() uses a 32 bit int to store the delay. So the max value allowed is 2147483647
          // The bigger number will cause immediate refreshing
          // but since we refresh in 10 minutes or in refreshInSeconds whatever is sooner we are good
          this.clearTimeoutId = setTimeout(() => this.refreshToken(), refreshInMs);
      });
    }
  }

  refreshToken() {
    if (this.isLoggedIn()) {
      let refreshTokenUrl = this.apiUrl + 'token/refresh';
      let refreshToken = localStorage.getItem('refresh_token');
      let body = JSON.stringify({ 'refresh_token': refreshToken });
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type':  'application/json'
        })
      };
      this.http.post<any>(refreshTokenUrl, body, httpOptions)
        .pipe(
          map((t: any) => {
            let token = this.processTokenResponse(t.token);
            this.clearTimeoutId = null;
            this.setupRefreshTimer(token.expires_in);
            return token;
          }),
          catchError(response => {
            // Additionally catch a 400 from keycloak
            if (response.status === 400) {
              this.broadcaster.broadcast('authenticationError', response);
            }
            return of({} as Token);
          })
        )
        .subscribe((token: Token) => {
          // Refresh any federated tokens that we have
          this.refreshTokens.next(token);
          console.log('token refreshed at:' + Date.now());
        });
    }
  }

  processTokenResponse(response: any): Token {
    let token = response as Token;
    localStorage.setItem('auth_token', token.access_token);
    localStorage.setItem('refresh_token', token.refresh_token);
    return token;
  }

  getGitHubToken(): string {
    return localStorage.getItem(this.github + '_token');
  }

  clearGitHubToken(): void {
    localStorage.removeItem(this.github + '_token');
    this.gitHubToken = of('');
  }

  private createFederatedToken(broker: string): Observable<string> {
    let res = this.refreshTokens
      .pipe(
        switchMap((token: Token) => {
          let tokenUrl = this.ssoUrl + `auth/realms/${this.realm}/broker/${broker}/token`;
          if ( broker === this.github ) {
            tokenUrl = this.apiUrl + `token?for=${encodeURIComponent('https://github.com')}`;
          }
          const httpOptions = {
            headers: new HttpHeaders({
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${token.access_token}`
            })
          };
          return this.http.get<Token>(tokenUrl, httpOptions)
            .pipe(
              catchError(response => {
                if (response.status === 400) {
                  this.broadcaster.broadcast('noFederatedToken', res);
                }
                return of({} as Token);
              }),
              tap((shadowToken: Token) => {
                if (shadowToken.access_token) {
                  localStorage.setItem(broker + '_token', shadowToken.access_token);
                } else {
                  localStorage.removeItem(broker + '_token');
                }
              }),
              map((t: Token) => t.access_token)
            );
        }),
        publishReplay(1)
      ) as ConnectableObservable<string>;
    res.connect();
    return res;
  }

  private queryAsToken(query: string): Token {
    let vars = query.split('&');
    let token = {} as any;
    for (let i = 0; i < vars.length; i++) {
      let pair = vars[i].split('=');
      let key = decodeURIComponent(pair[0]);
      let val = decodeURIComponent(pair[1]);
      token[key] = val;
    }
    return token as Token;
  }

  private clearSessionData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem(this.openshift + '_token');
    localStorage.removeItem(this.github + '_token');
    clearTimeout(this.clearTimeoutId);
    this.refreshInterval = null;
  }
}
