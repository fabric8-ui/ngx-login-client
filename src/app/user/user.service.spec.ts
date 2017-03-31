import { inject, TestBed } from '@angular/core/testing';
import { BaseRequestOptions, Http, Response, ResponseOptions } from '@angular/http';
import { MockBackend } from '@angular/http/testing';

import { Broadcaster, Logger } from 'ngx-base';

import { AUTH_API_URL } from '../shared/auth-api';
import { UserService } from './user.service';

describe('Service: User service', () => {

  let mockService: MockBackend;
  let userService: UserService;
  let broadcaster: Broadcaster;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BaseRequestOptions,
        UserService,
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
        Broadcaster,
        Logger
      ]
    });
  });

  beforeEach(inject(
    [UserService, MockBackend, Broadcaster],
    (service: UserService, mock: MockBackend, broadcast: Broadcaster) => {
      userService = service;
      mockService = mock;
      broadcaster = broadcast;
    }
  ));

  let testUser = {
    "attributes": {
      "fullName": "name",
      "imageURL": "",
      "username": "myUser"
    },
    "id": "userId",
    "type": "userType"
  };

  let testUsers = [
    testUser,
    {
      "attributes": {
        "fullName": "secondUser",
        "imageURL": "",
        "username": "secondUser"
      },
      "id": "secondUserId",
      "type": "userType"
    }
  ];

  it('Logged in event updates user', (done) => {
    mockService.connections.subscribe((connection: any) => {
      connection.mockRespond(new Response(
        new ResponseOptions({
          body: JSON.stringify({data: testUser}),
          status: 201
        })
      ));
    });

    broadcaster.on('loggedin').subscribe((data: number) => {
      userService.loggedInUser.subscribe((user) => {
        expect(user.id).toEqual(testUser.id);
        done();
      });
    });
    broadcaster.broadcast('loggedin', 1);
  });

  it('Logged out event clears user', (done) => {
    mockService.connections.subscribe((connection: any) => {
      connection.mockRespond(new Response(
        new ResponseOptions({
          body: JSON.stringify({data: testUser}),
          status: 201
        })
      ));
    });

    broadcaster.on('logout').subscribe(() => {
      userService.loggedInUser.subscribe((user) => {
        expect(user).toEqual({});
        done();
      });
    });

    // log in user and then immediately log out
    broadcaster.on('loggedin').subscribe(() => {
      broadcaster.broadcast('logout', 1);
    });

    broadcaster.broadcast('loggedin', 1);
  });

  it('Get user by user id returns valid user', (done) => {
    mockService.connections.subscribe((connection: any) => {
      connection.mockRespond(new Response(
        new ResponseOptions({
          body: JSON.stringify({data: testUser}),
          status: 201
        })
      ));
    });

    broadcaster.on('loggedin').subscribe((data: number) => {
      userService.getUserByUserId('userId').subscribe((user) => {
        expect(user.id).toEqual(testUser.id);
        done();
      });
    });
    broadcaster.broadcast('loggedin', 1);
  });

  it('Get user by user name returns null no user matched', (done) => {
    mockService.connections.subscribe((connection: any) => {
      connection.mockRespond(new Response(
        new ResponseOptions({
          body: JSON.stringify({data: testUsers}),
          status: 201
        })
      ));
    });

    userService.getUserByUsername('nouserId').subscribe((user) => {
      expect(user).toBeNull();
      done();
    });
  });

  it('Get user by user name returns valid user', (done) => {
    mockService.connections.subscribe((connection: any) => {
      connection.mockRespond(new Response(
        new ResponseOptions({
          body: JSON.stringify({data: testUsers}),
          status: 201
        })
      ));
    });

    userService.getUserByUsername('secondUser').subscribe((user) => {
      expect(user.id).toEqual('secondUserId');
      done();
    });
  });
});

