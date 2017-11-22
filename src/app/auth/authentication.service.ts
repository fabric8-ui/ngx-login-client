import { Injectable, Inject } from '@angular/core';
import { Http, Response, Headers, RequestOptions, RequestOptionsArgs } from '@angular/http';

import jwt_decode from 'jwt-decode';
import { Observable, Subject } from 'rxjs';
import { Broadcaster, Logger } from 'ngx-base';

import { AUTH_API_URL } from '../shared/auth-api';
import { SSO_API_URL } from '../shared/sso-api';
import { REALM } from '../shared/realm-token';
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
  private realm: string;
  private clearTimeoutId: any;
  private headers: Headers = new Headers({ 'Content-Type': 'application/json' });
  private refreshTokens: Subject<Token> = new Subject();
  readonly openshift = 'openshift-v3';
  readonly github = 'github';

  constructor(
    private broadcaster: Broadcaster,
    @Inject(AUTH_API_URL) apiUrl: string,
    @Inject(SSO_API_URL) ssoUrl: string,
    @Inject(REALM) realm: string,
    private http: Http,
    private logger: Logger
  ) {
    this.apiUrl = apiUrl;
    this.ssoUrl = ssoUrl;
    this.realm = realm;
    this.openShiftToken = this.createFederatedToken(this.openshift, (response: Response) => response.json() as Token);
    this.gitHubToken = this.createFederatedToken(this.github, (response: Response) => response.json() as Token);
    if (this.getToken() != null) {
      this.headers.set('Authorization', 'Bearer ' + this.getToken());
    }
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
        this.refreshTokens.next({ "access_token": token } as Token);
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
    if (localStorage.getItem(this.openshift + '_token')) {
      return Observable.of(localStorage.getItem(this.openshift + '_token'));
    }
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
        // setTimeout() uses a 32 bit int to store the delay. So the max value allowed is 2147483647
        // The bigger number will cause immediate refreshing
        // but since we refresh in 10 minutes or in refreshInSeconds whatever is sooner we are good
        this.clearTimeoutId = setTimeout(() => this.refreshToken(), refreshInMs);
      }
    }
  }

  refreshToken() {
    if (this.isLoggedIn()) {
      let headers = new Headers({ 'Content-Type': 'application/json' });
      let options: RequestOptions = new RequestOptions({ headers: headers });
      let refreshTokenUrl = this.apiUrl + 'token/refresh';
      let refreshToken = localStorage.getItem('refresh_token');
      let body = JSON.stringify({ 'refresh_token': refreshToken });
      this.http.post(refreshTokenUrl, body, options)
        .map((response: Response) => {
          let responseJson = response.json();
          let token = this.processTokenResponse(responseJson.token);
          this.clearTimeoutId = null;
          this.setupRefreshTimer(token.expires_in);
          return token;
        })
        .catch(response => {
          // Additionally catch a 400 from keycloak
          if (response.status === 400) {
            this.broadcaster.broadcast('authenticationError', response);
          }
          return Observable.of({} as Token);
        })
        .subscribe(token => {
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
  
  connectGitHub(redirectUrl: string) {
    //let headers = new Headers({ 'Content-Type': 'application/json' });
    //let options: RequestOptions = new RequestOptions({ headers: headers });
    let tokenUrl = this.apiUrl + 'token/link';
    let form = document.createElement("form");

    // Create the for parameter
    let inputFor = document.createElement("input");
    inputFor.type = "hidden";
    inputFor.name = "for";
    inputFor.value = "https://github.com";
    form.appendChild(inputFor);

    // Create the token parameter
    let inputToken = document.createElement("input");
    inputToken.type = "hidden";
    inputToken.name = "token";
    inputToken.value = this.getToken();
    form.appendChild(inputToken);

    // Create the redirect parameter
    let inputRedirect = document.createElement("input");
    inputRedirect.type = "hidden";
    inputRedirect.name = "redirect";
    inputRedirect.value = redirectUrl;
    form.appendChild(inputRedirect);

    form.action = tokenUrl;
    form.method = "POST";
    document.body.appendChild(form);
    form.submit();
  }
  
  disconnectGitHub() {
    let tokenUrl = this.apiUrl + 'token?for=https://github.com';
    const xhr = new XMLHttpRequest();
    xhr.open("delete", tokenUrl);
    var that = this;
    xhr.onreadystatechange = function (evt) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // TODO need to refresh the token value here
        } else {
          console.log("Error", xhr.statusText);
        }
      }
    }
    
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + this.getToken());
    xhr.send();

    // DOESN'T WORK
    //return this.http
    //  .delete (tokenUrl, { headers: this.headers })
    //  .map( () => {})
    //  .catch((error) => {
    //    return this.handleError(error);
    //  });
  }

  connectOpenShift(redirectUrl: string) {
    let parsedToken: any = jwt_decode(this.getToken());
    let url = this.apiUrl + 'link/session?' +
      "&sessionState=" + parsedToken.session_state +
      "&provider=openshift-v3" +
      "&redirect=" + redirectUrl;
    window.location.href = url;
  }

  disconnectOpenShift(openshiftApiUrl: string) {
    let tokenUrl = this.apiUrl + 'token?for=' + openshiftApiUrl;
    const xhr = new XMLHttpRequest();
    xhr.open("delete", tokenUrl);
    xhr.onreadystatechange = function (evt) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // TODO need to refresh the token value here
        } else {
          console.log("Error", xhr.statusText);
        }
      }
    }
    
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + this.getToken());
    xhr.send();

    // DOESN'T WORK
    //return this.http
    //  .delete (tokenUrl, { headers: this.headers })
    //  .map( () => {})
    //  .catch((error) => {
    //    return this.handleError(error);
    //  });
  }

  private handleError(error: any) {
    this.logger.error(error);
    return Observable.throw(error.message || error);
  }

  private createFederatedToken(broker: string, processToken: ProcessTokenResponse): Observable<string> {
    let res = this.refreshTokens.switchMap(token => {
      let headers = new Headers({ 'Content-Type': 'application/json' });
      let tokenUrl = this.ssoUrl + `auth/realms/${this.realm}/broker/${broker}/token`;
      if ( broker == this.github ){
        tokenUrl = this.apiUrl + `token?for=https://github.com`;
      }
      headers.set('Authorization', `Bearer ${token.access_token}`);
      let options = new RequestOptions({ headers: headers });
      return this.http.get(tokenUrl, options)
        .map(response => processToken(response))
        .catch(response => {
          if (response.status === 400) {
            this.broadcaster.broadcast('noFederatedToken', res);
          }
          return Observable.of({} as Token);
        })
        .do(token => localStorage.setItem(broker + '_token', token.access_token))
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
    localStorage.removeItem(this.openshift + '_token');
    localStorage.removeItem(this.github + '_token');
    clearTimeout(this.clearTimeoutId);
    this.refreshInterval = null;
  }
}
