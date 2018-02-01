
import { async, inject, TestBed } from '@angular/core/testing';
import { BaseRequestOptions, Http, Response, ResponseOptions } from '@angular/http';
import { MockBackend } from '@angular/http/testing';

import { Broadcaster } from 'ngx-base';

import { SSO_API_URL } from '../shared/sso-api';
import { AuthenticationService } from './authentication.service';
import { AUTH_API_URL } from '../shared/auth-api';
import { REALM } from '../shared/realm-token';

describe('Service: Authentication service', () => {

  let mockService: MockBackend;
  let authenticationService: AuthenticationService;
  let broadcaster: Broadcaster;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BaseRequestOptions,
        AuthenticationService,
        MockBackend,
        {
          provide: Http,
          useFactory: (backend: MockBackend,
                       options: BaseRequestOptions) => new Http(backend, options),
          deps: [MockBackend, BaseRequestOptions]
        },
        {
          provide: AUTH_API_URL,
          useValue: "http://example.com"
        },
        {
          provide: REALM,
          useValue: "fabric8"
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
    [AuthenticationService, MockBackend, Broadcaster],
    (service: AuthenticationService, mock: MockBackend, broadcast: Broadcaster) => {
      authenticationService = service;
      mockService = mock;
      broadcaster = broadcast;
    }
  ));

  afterEach(() => {
    authenticationService.logout();
  });

  let tokenJson = `{"access_token":"token","expires_in":1800,"refresh_expires_in":1800,"refresh_token":"refresh","token_type":"bearer"}`;

  it('Can log on', (done) => {
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

  it('Retrieves token', (done) => {
    spyOn(authenticationService, 'setupRefreshTimer');

    broadcaster.on('loggedin').subscribe((data: number) => {
      let token = JSON.parse(tokenJson);
      expect(authenticationService.getToken()).toBe(token.access_token);
      done();
    });
    authenticationService.logIn(tokenJson);
  });

  it('Can log out', (done) => {
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

  it('Refresh token processing', (done) => {
    mockService.connections.subscribe((connection: any) => {
      connection.mockRespond(new Response(
        new ResponseOptions({
          body: JSON.stringify({token: tokenJson}),
          status: 201
        })
      ));
    });
    spyOn(authenticationService, 'setupRefreshTimer');

    broadcaster.on('loggedin').subscribe((data: number) => {
      let token = JSON.parse(tokenJson);
      expect(authenticationService.setupRefreshTimer).toHaveBeenCalledWith(token.expires_in);
      spyOn(authenticationService, 'processTokenResponse').and.callThrough();
      authenticationService.refreshToken();
      expect(authenticationService.processTokenResponse).toHaveBeenCalled();
      done();
    });

    authenticationService.logIn(tokenJson);
  });

  it('Openshift token processing', (done) => {
    // given
    mockService.connections.subscribe((connection: any) => {
      connection.mockRespond(new Response(
        new ResponseOptions({
          body: tokenJson,
          status: 201
        })
      ));
    });
    spyOn(authenticationService, 'setupRefreshTimer');

    broadcaster.on('loggedin').subscribe((data: number) => {
      let token = JSON.parse(tokenJson);
      authenticationService.getOpenShiftToken().subscribe(output => {
        // then
        expect(output == token.access_token);
        expect(localStorage.getItem('openshift-v3_token')).toBe(token.access_token);
        authenticationService.logout();
        done();
      });
    });

    // when
    authenticationService.logIn(tokenJson);
  });

  it('Openshift proxy token retrieval', (done) => {
    // given
    mockService.connections.subscribe((connection: any) => {
      connection.mockRespond(new Response(
        new ResponseOptions({
          body: tokenJson,
          status: 201
        })
      ));
    });
    spyOn(authenticationService, 'setupRefreshTimer');

    broadcaster.on('loggedin').subscribe((data: number) => {
      let token = JSON.parse(tokenJson);
      authenticationService.getOpenShiftToken().subscribe(output => {
        // then
        expect(output == authenticationService.getToken());
        authenticationService.logout();
        done();
      });
    });

    // when
    authenticationService.logIn(tokenJson);
  });

  it('Openshift valid connection test', (done) => {
    // given
    mockService.connections.subscribe((connection: any) => {
      connection.mockRespond(new Response(
        new ResponseOptions({
          body: tokenJson,
          status: 200
        })
      ));
    });
    spyOn(authenticationService, 'setupRefreshTimer');

    broadcaster.on('loggedin').subscribe((data: number) => {
      authenticationService.isOpenShiftConnected('cluster').subscribe((output) => {
        // then
        expect(output).toBe(true);
        authenticationService.logout();
        done();
      });
    });

    // when
    authenticationService.logIn(tokenJson);
  });

  it('Openshift failed connection test', (done) => {
    // given
    mockService.connections.subscribe((connection: any) => {
      connection.mockError(new Response(
        new ResponseOptions({
          body: tokenJson,
          status: 401
        })
      ));
    });
    spyOn(authenticationService, 'setupRefreshTimer');

    broadcaster.on('loggedin').subscribe((data: number) => {
      authenticationService.isOpenShiftConnected('cluster').subscribe((output) => {
        // then
        expect(output).toBe(false);
        authenticationService.logout();
        done();
      });
    });

    // when
    authenticationService.logIn(tokenJson);
  });


  it('Openshift token processing - not logged in', async(() => {
      mockService.connections.subscribe((connection: any) => {
      connection.mockRespond(new Response(
        new ResponseOptions({
          body: tokenJson,
          status: 200
        })
      ));
    });
    spyOn(authenticationService, 'setupRefreshTimer');

    authenticationService.getOpenShiftToken().subscribe(output => {
      expect(output == '');
      expect(localStorage.getItem('openshift-v3_token')).toBeNull();
    });
  }));

  it('Github token processing', (done) => {
    // given
    mockService.connections.subscribe((connection: any) => {
      connection.mockRespond(new Response(
        new ResponseOptions({
          body: tokenJson,
          status: 201
        })
      ));
    });
    spyOn(authenticationService, 'setupRefreshTimer');

    broadcaster.on('loggedin').subscribe((data: number) => {
      let token = JSON.parse(tokenJson);
      authenticationService.gitHubToken.subscribe(output => {
        // then
        expect(output == token.access_token);
        expect(localStorage.getItem('github_token')).toBe(token.access_token);
        authenticationService.logout();
        done();
      });
    });

    authenticationService.logIn(tokenJson);
  });

  it('Github token clear', (done) => {
    // given
    mockService.connections.subscribe((connection: any) => {
      connection.mockRespond(new Response(
        new ResponseOptions({
          body: tokenJson,
          status: 201
        })
      ));
    });
    spyOn(authenticationService, 'setupRefreshTimer');

    broadcaster.on('loggedin').subscribe((data: number) => {
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
    // given
    mockService.connections.subscribe((connection: any) => {
      connection.mockRespond(new Response(
        new ResponseOptions({
          body: tokenJson,
          status: 201
        })
      ));
    });
    spyOn(authenticationService, 'setupRefreshTimer');

    broadcaster.on('loggedin').subscribe((data: number) => {
      let token = JSON.parse(tokenJson);
      expect(authenticationService.getGitHubToken()).toBe(token.access_token);
      done();
    });

    authenticationService.logIn(tokenJson);
  });
});
