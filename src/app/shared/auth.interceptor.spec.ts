import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Broadcaster } from 'ngx-base';
import { AuthInterceptor } from './auth.interceptor';

describe(`AuthHttpInterceptor`, () => {
  const testUrl: string = 'http://localhost/test';
  const testToken: string = 'test_token';

  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let broadcaster: Broadcaster;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        },
        Broadcaster
      ]
    });
    httpMock = TestBed.get(HttpTestingController);
    httpClient = TestBed.get(HttpClient);
    broadcaster = TestBed.get(Broadcaster);

    spyOn(localStorage, 'getItem').and.callFake( (key: string): string => {
      return key === 'auth_token' ? testToken : null;
    });
  });

  it('should add an Authorization header', () => {
    httpClient.get(testUrl).subscribe(() => {});

    const req = httpMock.expectOne(testUrl);

    expect(req.request.headers.has('Authorization'));
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
  });

  it('should broadcast authenticationError event on 401 with code jwt_security_error', () => {
    let authenticationError = false;
    let errored = false;

    broadcaster.on('authenticationError').subscribe(() => {
      authenticationError = true;
    });

    httpClient.get(testUrl).subscribe(() => { }, () => {
      errored = true;
    });

    const req = httpMock.expectOne(testUrl);

    // mock response
    req.flush({ errors: [{ code: 'jwt_security_error' }] },
      { status: 401, statusText: 'error' });

    expect(authenticationError).toBe(true, 'authentication error');
    expect(errored).toBe(true, 'request error');
  });



  it('should broadcast authenticationError event on 401 with auth header www-authenticate', () => {
    let authenticationError = false;
    let errored = false;

    broadcaster.on('authenticationError').subscribe(() => {
      authenticationError = true;
    });

    httpClient.get(testUrl).subscribe(() => { }, () => {
      errored = true;
    });

    const req = httpMock.expectOne(testUrl);

    // mock response
    req.flush({ errors: [{ code: 'validation_error' }] }, {
      status: 401, statusText: 'error', headers: {
        'Www-Authenticate': 'LOGIN url=something.io login required'
      }
    });

    expect(authenticationError).toBe(true, 'authentication error');
    expect(errored).toBe(true, 'request error');
  });

  it('should not broadcast authenticationError event on 401', () => {
    let authenticationError = false;
    let errored = false;
    broadcaster.on('authenticationError').subscribe(() => {
      authenticationError = true;
    });

    httpClient.get(testUrl).subscribe(() => { }, () => {
      errored = true;
    });

    const req = httpMock.expectOne(testUrl);

    // mock response
    req.flush('', { status: 401, statusText: 'error' });

    expect(authenticationError).toBe(false, 'authentication error');
    expect(errored).toBe(true, 'request error');
  });

});
