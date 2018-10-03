import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Broadcaster } from 'ngx-base';
import { AuthInterceptor } from './auth.interceptor';
import { WIT_API_PROXY } from './wit-api';
import { AUTH_API_URL } from './auth-api';
import { SSO_API_URL } from './sso-api';

describe(`AuthHttpInterceptor`, () => {
  const testUrl: string = 'http://auth.example.com/test';
  const otherUrl: string = 'http://other.example.com/test';
  const testToken: string = 'test_token';
  const rptToken = 'new_token_with_rpt_data';

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
        { provide: WIT_API_PROXY, useValue: 'http://wit.example.com'},
        { provide: AUTH_API_URL, useValue: 'http://auth.example.com'},
        { provide: SSO_API_URL, useValue: 'http://sso.example.com'},
        Broadcaster
      ]
    });
    httpMock = TestBed.get(HttpTestingController);
    httpClient = TestBed.get(HttpClient);
    broadcaster = TestBed.get(Broadcaster);

    localStorage.setItem('auth_token', testToken);
  });
  afterEach(() => {
    httpMock.verify();
  });

  it('should add an Authorization header', () => {
    httpClient.get(testUrl).subscribe(() => {});

    const req = httpMock.expectOne(testUrl);

    expect(req.request.headers.has('Authorization')).toBeTruthy();
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
  });

  it('should not intercept request if the URL is not valid auth endpoint', () => {
    httpClient.get(otherUrl).subscribe(() => {});

    const req = httpMock.expectOne(otherUrl);

    // should not add authorization header
    expect(req.request.headers.has('Authorization')).toBeFalsy();
  });

  it('should update auth_token if there is a new RPT token in response header', () => {
    httpClient.get(testUrl, { observe: 'response' }).subscribe(res => {
      expect(res.headers.has('Authorization')).toBeTruthy();
      expect(res.headers.get('Authorization')).toBe(`Bearer ${rptToken}`);
    });

    const req = httpMock.expectOne(testUrl);

    // mock response
    req.flush(
      { data: 'mock-data' },
      { headers: { 'Authorization': `Bearer ${rptToken}` } }
    );

    // check if request sends proper auth headers
    expect(req.request.headers.has('Authorization'));
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);

    // check if localStorage is updated with new RPT token
    expect(localStorage.getItem('auth_token')).toBe(rptToken);
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
