import { Router } from '@angular/router';
import { Injectable, Inject } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';

import { Broadcaster } from '../shared/broadcaster.service';
import { Token } from '../user/token';
import { AUTH_API_URL } from '../shared/auth-api';

@Injectable()
export class AuthenticationService {
  private authToken: string = '';
  private refreshInterval: number;
  private apiUrl: string;
  private clearTimeoutId: any;

  constructor(private router: Router,
              private broadcaster: Broadcaster,
              @Inject(AUTH_API_URL) apiUrl: string,
              private http: Http) {
    this.apiUrl = apiUrl;
  }

  isLoggedIn(): boolean {
    let token = localStorage.getItem('auth_token');
    if (token) {
      this.authToken = token;
      // refresh the token in five seconds to make sure we have expiry and a running timer - only do this first time in
      if(!this.refreshInterval) {
        this.setupRefreshTimer(15);
      }
      return true;
    }
    let params: any = this.getUrlParams();
    if ('token_json' in params) {
      let tokenJson = decodeURIComponent(params['token_json']);
      let token = this.processTokenResponse(JSON.parse(tokenJson));
      this.setupRefreshTimer(token.expires_in);
      return true;
    }
    return false;
  }

  logout(redirect: boolean = false) {
    this.authToken = '';
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    clearTimeout(this.clearTimeoutId);
    this.refreshInterval = null;
    this.broadcaster.broadcast('logout', 1);
    if (redirect) {
      this.router.navigate(['login']);
    }
  }

  getToken() {
    if (this.isLoggedIn()) return this.authToken;
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
      this.clearTimeoutId = null;
      let headers = new Headers({'Content-Type': 'application/json'});
      headers.set('Authorization', 'Bearer ' + this.getToken());
      let refreshTokenUrl = this.apiUrl + 'login/refresh';
      let refreshToken = localStorage.getItem('refresh_token');
      let body = JSON.stringify({"refresh_token": refreshToken});
      this.http.post(refreshTokenUrl, body, headers)
        .map((response: Response) => {
          let responseJson = response.json();
          let token = this.processTokenResponse(responseJson.token);
          this.setupRefreshTimer(token.expires_in);
        }).subscribe( () => {
          console.log('token refreshed at:' + Date.now());
        });
    }
  }

  getUrlParams(): Object {
    let query = window.location.search.substr(1);
    let result: any = {};
    query.split('&').forEach(function (part) {
      let item: any = part.split('=');
      result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
  }

  processTokenResponse(response: any): Token {
    let token = response as Token;
    this.authToken = token.access_token;
    localStorage.setItem('auth_token', this.authToken);
    localStorage.setItem('refresh_token', token.refresh_token);
    return token;
  }
}
