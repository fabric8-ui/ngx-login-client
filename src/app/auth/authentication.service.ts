import { Injectable } from '@angular/core';

import { Broadcaster } from '../shared/broadcaster.service';

@Injectable()
export class AuthenticationService {
  private authToken: string = '';

  constructor(private broadcaster: Broadcaster) { }

  isLoggedIn(): boolean {
    let token = localStorage.getItem('auth_token');
    if (token){
      this.authToken = token;
      return true;      
    }
    let params:any = this.getUrlParams();
    if ('token' in params) {
      this.authToken = params['token'];
      localStorage.setItem('auth_token', this.authToken);
      //location.href = location.protocol + '//' + location.host;
      return true;
    }
    //this.router.navigate(['login']);
    return false;
  }

  logout() {
    this.authToken = '';
    localStorage.removeItem('auth_token');
    // this.router.navigate(['login']);
    this.broadcaster.broadcast('logout', 1);
    // location.href = location.protocol + '//' + location.host + location.pathname + location.hash;
  }

  getToken() {
    if (this.isLoggedIn()) return this.authToken;
    //else this.router.navigate(['login']);
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
