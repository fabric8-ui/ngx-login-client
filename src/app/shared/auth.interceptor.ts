import { Injectable, Inject, forwardRef } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/operators/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';

import { Broadcaster } from 'ngx-base';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(@Inject(forwardRef(() => Broadcaster)) private broadcaster: Broadcaster) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token = localStorage.getItem('auth_token');
    if (token !== null) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return next.handle(request).catch(this.catchRequestError);
  }

  private catchRequestError = (event: HttpEvent<any>) => {
    if (event instanceof HttpErrorResponse) {
      const res: HttpErrorResponse = event;
      if (res.status === 403 || isAuthenticationError(res)) {
        this.broadcaster.broadcast('authenticationError', res);
      } else if (res.status === 500) {
        this.broadcaster.broadcast('communicationError', res);
      }
    }
    return Observable.throw(event);
  }
}

function isAuthenticationError(res: HttpErrorResponse): boolean {
  if (res.status === 401) {
    const json: any = res.error;
    const hasErrors: boolean = json && Array.isArray(json.errors);
    const isJwtError: boolean = hasErrors &&
      json.errors.filter((e: any) => e.code === 'jwt_security_error').length >= 1;
    const authHeader = res.headers.get('www-authenticate');
    const isLoginHeader = authHeader && authHeader.toLowerCase().includes('login');
    return isJwtError || isLoginHeader;
  }
  return false;
}
