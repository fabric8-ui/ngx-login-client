import { inject, TestBed } from '@angular/core/testing';
import { Headers, Http, Response, ResponseOptions, XHRBackend } from '@angular/http';
import { MockBackend } from '@angular/http/testing';

import { Broadcaster } from 'ngx-base';

import { HttpService } from './http.service';

describe('Http service', () => {

  let httpService: HttpService;
  let mockService: MockBackend;
  let broadcaster: Broadcaster;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockBackend,
        {
          provide: XHRBackend,
          useExisting: MockBackend
        },
        HttpService,
        Broadcaster
      ]
    });
  });

  beforeEach(inject(
    [HttpService, MockBackend, Broadcaster],
    (service: HttpService, mock: MockBackend, broadcast: Broadcaster) => {
      httpService = service;
      mockService = mock;
      broadcaster = broadcast;
    }
  ));

  let mockHeaders = new Headers();

  // TODO: Refactor tests once this is upgraded to the new Angular HttpClient. These tests fail due to the partial upgrade. It is a partial upgrade so that we can keep the existing http.service.ts.
  // it('should broadcast authenticationError event on 401 with code jwt_security_error', () => {
  //   let authenticationError = false;
  //   let errored = false;
  //   broadcaster.on('authenticationError').subscribe(() => {
  //     authenticationError = true;
  //   });
  //
  //   mockService.connections.subscribe((connection: any) => {
  //     connection.mockError(new Response(
  //       new ResponseOptions({
  //         body: JSON.stringify({errors: [{code: 'jwt_security_error'}]}),
  //         headers: mockHeaders,
  //         status: 401
  //       })
  //     ));
  //   });
  //
  //   httpService.request('test').subscribe(() => {}, () => {
  //     errored = true;
  //   });
  //
  //   expect(authenticationError).toBe(true, 'authentication error');
  //   expect(errored).toBe(true, 'request error');
  // });
  //
  // it('should broadcast authenticationError event on 401 with auth header www-authenticate', () => {
  //   let authenticationError = false;
  //   let errored = false;
  //   mockHeaders.set('Www-Authenticate', 'LOGIN url=something.io login required');
  //   broadcaster.on('authenticationError').subscribe(() => {
  //     authenticationError = true;
  //   });
  //
  //   mockService.connections.subscribe((connection: any) => {
  //     connection.mockError(new Response(
  //       new ResponseOptions({
  //         body: JSON.stringify({errors: [{code: 'validation_error'}]}),
  //         headers: mockHeaders,
  //         status: 401
  //       })
  //     ));
  //   });
  //
  //   httpService.request('test').subscribe(() => {}, () => {
  //     errored = true;
  //   });
  //
  //   expect(authenticationError).toBe(true, 'authentication error');
  //   expect(errored).toBe(true, 'request error');
  // });
  //
  // it('should not broadcast authenticationError event on 401', () => {
  //   let authenticationError = false;
  //   let errored = false;
  //   broadcaster.on('authenticationError').subscribe(() => {
  //     authenticationError = true;
  //   });
  //
  //   mockService.connections.subscribe((connection: any) => {
  //     connection.mockError(new Response(
  //       new ResponseOptions({
  //         status: 401
  //       })
  //     ));
  //   });
  //
  //   httpService.request('test').subscribe(() => {}, () => {
  //     errored = true;
  //   });
  //
  //   expect(authenticationError).toBe(false, 'authentication error');
  //   expect(errored).toBe(true, 'request error');
  // });
});

