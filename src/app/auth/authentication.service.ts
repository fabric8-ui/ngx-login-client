import { Injectable, Inject } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';

import { Observable } from 'rxjs';
import { Broadcaster } from 'ngx-base';

import { AUTH_API_URL } from '../shared/auth-api';
import { SSO_API_URL } from '../shared/sso-api';
import { Token } from '../user/token';

@Injectable()
export class AuthenticationService {
  private refreshInterval: number;
  private apiUrl: string;
  private ssoUrl: string;
  private clearTimeoutId: any;
  private clearOpenShiftTimeoutId: any;

  constructor(private broadcaster: Broadcaster,
    @Inject(AUTH_API_URL) apiUrl: string,
    @Inject(SSO_API_URL) ssoUrl: string,
    private http: Http) {
    this.apiUrl = apiUrl;
    this.ssoUrl = ssoUrl;
  }

  logIn(tokenParameter: string): boolean {
    let tokenJson = decodeURIComponent(tokenParameter);
    let token = this.processTokenResponse(JSON.parse(tokenJson));
    this.setupRefreshTimer(token.expires_in);

    // make sure old openshift token is cleared out when we login again
    localStorage.removeItem('openshift_token');

    this.onLogIn();
    return true;
  }

  onLogIn() {
    this.broadcaster.broadcast('loggedin', 1);
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('openshift_token');
    clearTimeout(this.clearTimeoutId);
    this.refreshInterval = null;
    this.broadcaster.broadcast('logout', 1);
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
    if (localStorage.getItem('openshift_token')) {
      return Observable.of(localStorage.getItem('openshift_token'));
    } else {
      if (this.isLoggedIn()) {
        let headers = new Headers({'Content-Type': 'application/json'});
        let osTokenUrl = this.ssoUrl + 'auth/realms/fabric8/broker/openshift-v3/token';
        let token = this.getToken();
        headers.set('Authorization', `Bearer ${token}`);
        let options = new RequestOptions({ headers: headers });
        return this.http.get(osTokenUrl, options)
          .map((response: Response) => {
            let token = response.json() as Token;
            this.clearOpenShiftTimeoutId = null;
            localStorage.setItem('openshift_token', token.access_token);

            let refreshInMs = Math.round(token.expires_in * .9) * 1000;
            console.log('Clearing openshift token in: ' + refreshInMs + ' milliseconds.');
            setTimeout(() => this.clearOpenShiftToken(), refreshInMs);
            return token.access_token;
          });
      } else {
        // user is not logged in, return empty
        return Observable.of('');
      }
    }
  }

  clearOpenShiftToken() {
    localStorage.removeItem('openshift_token');
  }

  setupRefreshTimer(refreshInSeconds: number) {
    if (!this.clearTimeoutId) {
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
      let headers = new Headers({'Content-Type': 'application/json'});
      let refreshTokenUrl = this.apiUrl + 'login/refresh';
      let refreshToken = localStorage.getItem('refresh_token');
      let body = JSON.stringify({'refresh_token': refreshToken});
      this.http.post(refreshTokenUrl, body, headers)
        .map((response: Response) => {
          let responseJson = response.json();
          let token = this.processTokenResponse(responseJson.token);
          this.clearTimeoutId = null;
          this.setupRefreshTimer(token.expires_in);
        }).subscribe( () => {
          console.log('token refreshed at:' + Date.now());
        });
    }
  }

  processTokenResponse( response: any ): Token {
    let token = response as Token;
    localStorage.setItem('auth_token', token.access_token);
    localStorage.setItem('refresh_token', token.refresh_token);
    return token;
  }
}
