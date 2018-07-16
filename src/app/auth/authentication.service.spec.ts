
import { async, inject, TestBed } from '@angular/core/testing';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Broadcaster } from 'ngx-base';

import { SSO_API_URL } from '../shared/sso-api';
import { AuthenticationService } from './authentication.service';
import { AUTH_API_URL } from '../shared/auth-api';
import { REALM } from '../shared/realm-token';

describe('Service: Authentication service', () => {

  const authUrl: string = 'http://example.com/';
  let authenticationService: AuthenticationService;
  let broadcaster: Broadcaster;
  let httpClient: HttpClient;
  let httpClientTestingModule: HttpClientTestingModule;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        AuthenticationService,
        {
          provide: AUTH_API_URL,
          useValue: 'http://example.com/'
        },
        {
          provide: REALM,
          useValue: 'fabric8'
        },
        {
          provide: SSO_API_URL,
          useValue: 'http://example.com/auth'
        },
        Broadcaster
      ]
    });
  });

  beforeEach(inject(
    [AuthenticationService, Broadcaster],
    (service: AuthenticationService, broadcast: Broadcaster) => {
      authenticationService = service;
      httpClient = TestBed.get(HttpClient);
      httpTestingController = TestBed.get(HttpTestingController);
      broadcaster = broadcast;
    }
  ));

  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    // httpTestingController.verify();
    // Logout so you can have a fresh start on each test.
    authenticationService.logout();
  });

  let tokenJson = `
    {"access_token":"token","expires_in":1800,"refresh_expires_in":1800,"refresh_token":"refresh","token_type":"bearer"}
  `;

  const authHeader = {
    'Www-Authenticate': 'LOGIN url=something.io login required'
  };

  it('can log on', (done) => {
    spyOn(authenticationService, 'setupRefreshTimer');

    broadcaster.on('loggedin').subscribe((data: number) => {
      expect(data).toBe(1);
      let token = JSON.parse(tokenJson);
      expect(authenticationService.setupRefreshTimer).toHaveBeenCalledWith(token.expires_in);
      expect(localStorage.getItem('auth_token')).toBe(token.access_token);
      expect(localStorage.getItem('refresh_token')).toBe(token.refresh_token);
      done();
    });
    authenticationService.logIn(tokenJson);
  });

  it('can retrieve the token', (done) => {
    spyOn(authenticationService, 'setupRefreshTimer');

    broadcaster.on('loggedin').subscribe(() => {
      let token = JSON.parse(tokenJson);
      expect(authenticationService.getToken()).toBe(token.access_token);
      done();
    });
    authenticationService.logIn(tokenJson);
  });

  it('can log out', (done) => {
    spyOn(authenticationService, 'setupRefreshTimer');

    broadcaster.on('loggedin').subscribe(() => {
      let token = JSON.parse(tokenJson);
      expect(localStorage.getItem('auth_token')).toBe(token.access_token);
      expect(localStorage.getItem('refresh_token')).toBe(token.refresh_token);
      // log off here
      authenticationService.logout();
    });

    broadcaster.on('logout').subscribe(() => {
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      done();
    });

    authenticationService.logIn(tokenJson);
  });

  it('can refresh token processing', (done) => {
    spyOn(authenticationService, 'setupRefreshTimer');

    broadcaster.on('loggedin').subscribe(() => {
      let token = JSON.parse(tokenJson);
      expect(authenticationService.setupRefreshTimer).toHaveBeenCalledWith(token.expires_in);
      spyOn(authenticationService, 'processTokenResponse').and.callThrough();

      authenticationService.refreshToken();

      // mock response
      const req = httpTestingController.expectOne(authUrl + 'token/refresh');
      req.flush({token: tokenJson},
        { status: 201, statusText: 'ok' });

      expect(authenticationService.processTokenResponse).toHaveBeenCalled();
      done();
    });

    authenticationService.logIn(tokenJson);
  });

  it('Refresh token should broadcast authenticationError event on 401 with auth header www-authenticate', (done) => {
    let authenticationError = false;
    broadcaster.on('authenticationError').subscribe(() => {
      authenticationError = true;
    });

    broadcaster.on('loggedin').subscribe((data: number) => {
      authenticationService.refreshToken();

      // mock response
      const req = httpTestingController.expectOne(authUrl + 'token/refresh');
      req.flush({errors: [{code: 'validation_error'}]},
        { status: 401, statusText: 'error', headers: authHeader  });

      expect(authenticationError).toBe(true, 'authentication error');
      done();
    });

    authenticationService.logIn(tokenJson);
  });


  it('Openshift proxy token retrieval', (done) => {
    broadcaster.on('loggedin').subscribe((data: number) => {
      let token = JSON.parse(tokenJson);
      authenticationService.getOpenShiftToken().subscribe(output => {
        // then
        expect(output === authenticationService.getToken());
        authenticationService.logout();
        done();
      });
    });

    // when
    authenticationService.logIn(tokenJson);
  });

  it('Openshift valid connection test', (done) => {
    const cluster = 'cluster';

    broadcaster.on('loggedin').subscribe((data: number) => {
      authenticationService.isOpenShiftConnected(cluster).subscribe((output) => {
        // then
        expect(output).toBe(true);
        authenticationService.logout();
        done();
      });

      // mock response
      const req = httpTestingController
        .expectOne(`${authUrl}token?force_pull=true&for=${encodeURIComponent(cluster)}`);
      req.flush('', { status: 200, statusText: 'ok' });
    });

    // when
    authenticationService.logIn(tokenJson);
  });

  it('Openshift valid connection test if cluster needs to be encoded', (done) => {
    const cluster = 'cluster+somthing-else';

    broadcaster.on('loggedin').subscribe((data: number) => {
      authenticationService.isOpenShiftConnected(cluster).subscribe((output) => {
        // then
        expect(output).toBe(true);
        authenticationService.logout();
        done();
      });

      // mock response
      const req = httpTestingController
        .expectOne(`${authUrl}token?force_pull=true&for=${encodeURIComponent(cluster)}`);
      req.flush('', { status: 200, statusText: 'ok' });
    });

    // when
    authenticationService.logIn(tokenJson);
  });

  it('Openshift failed connection test', (done) => {
    const cluster = 'cluster';

    broadcaster.on('loggedin').subscribe((data: number) => {
      authenticationService.isOpenShiftConnected(cluster).subscribe((output) => {
        // then
        expect(output).toBe(false);
        authenticationService.logout();
        done();
      });

      // mock response
      const req = httpTestingController
        .expectOne(`${authUrl}token?force_pull=true&for=${encodeURIComponent(cluster)}`);
      req.flush('', { status: 401, statusText: 'error' });
    });

    // when
    authenticationService.logIn(tokenJson);
  });


  it('Github token processing', (done) => {

    broadcaster.on('loggedin').subscribe((data: number) => {
      // mock response
      const req = httpTestingController
        .expectOne(`${authUrl}token?for=${encodeURIComponent('https://github.com')}`);
      req.flush(JSON.parse(tokenJson), { status: 201, statusText: 'ok' });

      let token = JSON.parse(tokenJson);
      authenticationService.gitHubToken.subscribe(output => {
        // then
        expect(output === token.access_token);
        expect(localStorage.getItem('github_token')).toBe(token.access_token);
        authenticationService.logout();
        done();
      });
    });

    authenticationService.logIn(tokenJson);
  });

  it('Github token clear', (done) => {
    broadcaster.on('loggedin').subscribe((data: number) => {
      // mock response
      const req = httpTestingController
        .expectOne(`${authUrl}token?for=${encodeURIComponent('https://github.com')}`);
      req.flush(JSON.parse(tokenJson), { status: 201, statusText: 'ok' });

      expect(localStorage.getItem('github_token')).not.toBeNull();
      authenticationService.clearGitHubToken();
    });
    authenticationService.logIn(tokenJson);

    authenticationService.gitHubToken.subscribe(output => {
      // token should be empty after token is cleared
      expect(output).toBe('');
      expect(localStorage.getItem('github_token')).toBeNull();
      expect(authenticationService.getGitHubToken()).toBeNull();
      authenticationService.logout();
      done();
    });
  });

  it('Github token processing', (done) => {
    broadcaster.on('loggedin').subscribe((data: number) => {
      // mock response
      const req = httpTestingController
        .expectOne(`${authUrl}token?for=${encodeURIComponent('https://github.com')}`);
      req.flush(JSON.parse(tokenJson), { status: 201, statusText: 'ok' });

      let token = JSON.parse(tokenJson);
      expect(authenticationService.getGitHubToken()).toBe(token.access_token);
      done();
    });

    authenticationService.logIn(tokenJson);
  });
});
