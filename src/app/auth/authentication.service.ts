import { Router } from '@angular/router';
import { Injectable } from '@angular/core';

import { Broadcaster } from '../shared/broadcaster.service';

@Injectable()
export class AuthenticationService {
  private authToken: string = '';

  constructor(private router: Router,
              private broadcaster: Broadcaster) { }

  isLoggedIn(): boolean {
    let token = localStorage.getItem('auth_token');
    if (token) {
      this.authToken = token;
      return true;
    }
    let params:any = this.getUrlParams();
    if ('token' in params) {
      this.authToken = params['token'];
      localStorage.setItem('auth_token', this.authToken);
      return true;
    }
    return false;
  }

  logout(redirect: boolean = false) {
    this.authToken = '';
    localStorage.removeItem('auth_token');
    this.broadcaster.broadcast('logout', 1);
    if (redirect) {
      this.router.navigate(['login']);
    }
  }

  getToken() {
    if (this.isLoggedIn()) return this.authToken;
  }

  getUrlParams(): Object {
    let query = window.location.search.substr(1);
    let result:any = {};
    query.split('&').forEach(function(part) {
      let item:any = part.split('=');
      result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
  }
}
