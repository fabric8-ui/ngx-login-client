import { Injectable, Inject } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';

import { Observable, Subject } from 'rxjs';
import { Broadcaster } from 'ngx-base';

import { AUTH_API_URL } from '../shared/auth-api';
import { SSO_API_URL } from '../shared/sso-api';
import { Token } from '../user/token';

export interface ProcessTokenResponse {
  (response: Response): Token;
}

@Injectable()
export class AuthenticationService {

  public openShiftToken: Observable<string>;
  public gitHubToken: Observable<string>;
  private refreshInterval: number;
  private apiUrl: string;
  private ssoUrl: string;
  private clearTimeoutId: any;
  private refreshTokens: Subject<Token> = new Subject();

  constructor(
    private broadcaster: Broadcaster,
    @Inject(AUTH_API_URL) apiUrl: string,
    @Inject(SSO_API_URL) ssoUrl: string,
    private http: Http
  ) {
    this.apiUrl = apiUrl;
    this.ssoUrl = ssoUrl;
    this.openShiftToken = this.createFederatedToken('openshift-v3', (response: Response) => response.json() as Token);
    this.gitHubToken = this.createFederatedToken('github', (response: Response) => this.queryAsToken(response.text()));
  }

  logIn(tokenParameter: string): boolean {
    let tokenJson = decodeURIComponent(tokenParameter);
    let token = this.processTokenResponse(JSON.parse(tokenJson));
    this.setupRefreshTimer(token.expires_in);

    // kick off initial token refresh
    this.refreshTokens.next(token);

    // make sure old openshift token is cleared out when we login again
    localStorage.removeItem('openshift_token');

    this.onLogIn();
    return true;
  }

  onLogIn() {
    this.broadcaster.broadcast('loggedin', 1);
  }

  logout() {
    let logOutUrl = this.apiUrl + 'logout';
    this.http.get(logOutUrl).subscribe(() => {
      console.log('user logged out');
      this.clearSessionData();
      this.broadcaster.broadcast('logout', 1);
    }, error => {
      console.log('user failed to log out, clearing session data', error);
      this.clearSessionData();
      this.broadcaster.broadcast('logout', 1);
    });
  }

  isLoggedIn(): boolean {
    let token = localStorage.getItem('auth_token');
    if (token) {
      if (!this.clearTimeoutId) {
        this.setupRefreshTimer(15);
      }
      return true;
    }
    return false;
  }

  getToken() {
    if (this.isLoggedIn()) return localStorage.getItem('auth_token');
  }

  getOpenShiftToken(): Observable<string> {
    return this.openShiftToken;
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
      if (process.env.ENV !== 'inmemory') {
        this.clearTimeoutId = setTimeout(() => this.refreshToken(), refreshInMs);
      }
    }
  }

  refreshToken() {
    if (this.isLoggedIn()) {
      let headers = new Headers({ 'Content-Type': 'application/json' });
      let refreshTokenUrl = this.apiUrl + 'login/refresh';
      let refreshToken = localStorage.getItem('refresh_token');
      let body = JSON.stringify({ 'refresh_token': refreshToken });
      this.http.post(refreshTokenUrl, body, headers)
        .map((response: Response) => {
          let responseJson = response.json();
          let token = this.processTokenResponse(responseJson.token);
          this.clearTimeoutId = null;
          this.setupRefreshTimer(token.expires_in);
          return token;
        }).subscribe(token => {
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

  private createFederatedToken(broker: string, processToken: ProcessTokenResponse): Observable<string> {
    let res = this.refreshTokens.switchMap(token => {
      let headers = new Headers({ 'Content-Type': 'application/json' });
      let tokenUrl = this.ssoUrl + `auth/realms/fabric8/broker/${broker}/token`;
      headers.set('Authorization', `Bearer ${token.access_token}`);
      let options = new RequestOptions({ headers: headers });
      return this.http.get(tokenUrl, options)
        .map(response => processToken(response))
        .map(t => t.access_token);
    })
    .publishReplay(1);
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
    localStorage.removeItem('openshift_token');
    clearTimeout(this.clearTimeoutId);
    this.refreshInterval = null;
  }
}
