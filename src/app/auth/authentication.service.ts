import { Injectable, Inject } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';

import { Broadcaster } from '../shared/broadcaster.service';
import { Token } from '../user/token';
import { AUTH_API_URL } from '../shared/auth-api';

@Injectable()
export class AuthenticationService {
  private refreshInterval: number;
  private apiUrl: string;
  private clearTimeoutId: any;

  constructor(private broadcaster: Broadcaster,
    @Inject(AUTH_API_URL) apiUrl: string,
    private http: Http) {
    this.apiUrl = apiUrl;
  }

  logIn(tokenParameter: string): boolean {
    let tokenJson = decodeURIComponent(tokenParameter);
    let token = this.processTokenResponse(JSON.parse(tokenJson));
    this.setupRefreshTimer(token.expires_in);
    this.onLogIn();
    return true;
  }

  onLogIn() {
    this.broadcaster.broadcast('loggedin', 1);
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
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
