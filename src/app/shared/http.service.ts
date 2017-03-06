import { Injectable, Inject, forwardRef } from '@angular/core';
import { Http, XHRBackend, RequestOptions, Request, RequestOptionsArgs, Response, Headers } from '@angular/http';
import { Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/of';

import { Broadcaster } from './broadcaster.service';

@Injectable()
export class HttpService extends Http {
  private broadcaster: Broadcaster;

  constructor (backend: XHRBackend,
               options: RequestOptions,
               @Inject(forwardRef(() => Broadcaster)) broadcaster: Broadcaster) {
    super(backend, options);
    this.broadcaster = broadcaster;
  }

  request(url: string|Request, options?: RequestOptionsArgs): Observable<Response> {
    let token = localStorage.getItem('auth_token');
    if (token !== null) {
      if (typeof url === 'string') { // meaning we have to add the token to the options, not in url
        if (!options) {
          // let's make option object
          options = {headers: new Headers()};
        }
        options.headers.set('Authorization', `Bearer ${token}`);
      } else {
        // we have to add the token to the url object
        url.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return super.request(url, options).catch(this.catchRequestError());
  }

  private catchRequestError () {
    return (res: Response) => {
      if (res.status === 401 || res.status === 403) {
        this.broadcaster.broadcast('authenticationError', res);
      } else if(res.status === 500) {
        this.broadcaster.broadcast('communicationError', res);
      }
      return Observable.throw(res);
    };
  }
}
