import { Injectable, Inject, forwardRef } from '@angular/core';
import {
  HttpRequest,
  HttpResponse,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';

import { Broadcaster } from 'ngx-base';

import { WIT_API_PROXY } from './wit-api';
import { AUTH_API_URL } from './auth-api';
import { SSO_API_URL } from './sso-api';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    @Inject(forwardRef(() => Broadcaster)) private broadcaster: Broadcaster,
    @Inject(WIT_API_PROXY) private witApiUrl: string,
    @Inject(AUTH_API_URL) private authApiUrl: string,
    @Inject(SSO_API_URL) private ssoUrl: string
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isAuthUrl(request.url)) {
      return next.handle(request);
    }

    let token = localStorage.getItem('auth_token');
    if (token !== null) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    return next.handle(request)
      .pipe(
        tap(
          // Succeeds when there is a response; ignore other events
          event => event instanceof HttpResponse ? this.refreshRPT(event) : '',
          // Operation failed; error is an HttpErrorResponse
          error => error instanceof HttpErrorResponse ? this.catchError(error) : throwError(error)
        )
      );
  }

  private refreshRPT(res: HttpResponse<any>) {
    if (res.headers.has('Authorization')) {
      const token = localStorage.getItem('auth_token');
      const newToken = res.headers.get('Authorization').replace('Bearer ', '');
      if (token !== newToken) {
        localStorage.setItem('auth_token', newToken);
      }
    }
  }

  private catchError(res: HttpErrorResponse) {
    if (res.status === 403 || this.isAuthenticationError(res)) {
      this.broadcaster.broadcast('authenticationError', res);
    } else if (res.status === 500) {
      this.broadcaster.broadcast('communicationError', res);
    }
  }

  private isAuthenticationError(res: HttpErrorResponse): boolean {
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

  private isAuthUrl(url: string) {
    return url.startsWith(this.witApiUrl) || url.startsWith(this.authApiUrl) || url.startsWith(this.ssoUrl);
  }
}
