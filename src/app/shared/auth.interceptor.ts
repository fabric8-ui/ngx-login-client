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

import { isAuthenticationError } from './isAuthenticationError';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(@Inject(forwardRef(() => Broadcaster)) private broadcaster: Broadcaster) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token = localStorage.getItem('auth_token');
    let ok: string;
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
          event => ok = event instanceof HttpResponse ? 'succeeded' : '',
          // Operation failed; error is an HttpErrorResponse
          error => {
            if (error instanceof HttpErrorResponse) {
              const res: HttpErrorResponse = error;
              if (res.status === 403 || isAuthenticationError(res)) {
                this.broadcaster.broadcast('authenticationError', res);
              } else if (res.status === 500) {
                this.broadcaster.broadcast('communicationError', res);
              }
            }
            return throwError(error);
          }
        )
      );
  }
}
