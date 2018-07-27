import { TestBed } from '@angular/core/testing';
import { Broadcaster, Logger } from 'ngx-base';

import { AUTH_API_URL } from '../shared/auth-api';
import { UserService } from './user.service';
import { HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import { HttpHeaders } from '@angular/common/http';


describe('Service: User service', () => {
  let httpMock: HttpTestingController;
  let userService: UserService;
  let broadcaster: Broadcaster;
  let url: string;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService,
        {
          provide: AUTH_API_URL,
          useValue: 'http://example.com/'
        },
        Broadcaster,
        Logger
      ]
    });
    httpMock = TestBed.get(HttpTestingController);
    url = TestBed.get(AUTH_API_URL);
    broadcaster = TestBed.get(Broadcaster);
    userService = TestBed.get(UserService);
  });

  let testUser = {
    'attributes': {
      'fullName': 'name',
      'imageURL': '',
      'username': 'myUser'
    },
    'id': 'userId',
    'type': 'userType'
  };

  let testUsers = [
    testUser,
    {
      'attributes': {
        'fullName': 'secondUser',
        'imageURL': '',
        'username': 'secondUser'
      },
      'id': 'secondUserId',
      'type': 'userType'
    },
    {
      'attributes': {
        'fullName': 'thirdUser',
        'imageURL': '',
        'username': 'thirdUser+1@redhat.com'
      },
      'id': 'thirdUserId',
      'type': 'userType'
    }
  ];

  const mockHeader = new HttpHeaders({'Www-Authenticate': 'LOGIN url=something.io login required'});

  it('Logged in event updates user', (done) => {

    broadcaster.on('loggedin').subscribe((data: number) => {

      userService.loggedInUser.subscribe((user) => {
        expect(user.id).toEqual(testUser.id);
        expect(userService.currentLoggedInUser.id).toEqual(testUser.id);
        done();
      });

      const req = httpMock.expectOne(request => request.method === 'GET' && request.url === `${url}user`);
      req.flush({data: testUser}, {status: 201, statusText: ''});

    });
    broadcaster.broadcast('loggedin', 1);

  });

  it('Logged out event clears user', (done) => {
    broadcaster.on('logout').subscribe(() => {
      userService.loggedInUser.subscribe((user) => {
        expect(user).toBeDefined();
        expect(userService.currentLoggedInUser).not.toBeNull();
        done();
      });
      const req = httpMock.expectOne(`${url}user`);
    });

    // log in user and then immediately log out
    broadcaster.on('loggedin').subscribe(() => {
      broadcaster.broadcast('logout', 1);
    });

    broadcaster.broadcast('loggedin', 1);
  });

  it('Get user by user id returns valid user', (done) => {
    broadcaster.on('loggedin').subscribe((data: number) => {
      userService.getUserByUserId('userId').subscribe((user) => {
        expect(user.id).toEqual(testUser.id);
        done();
      });
      const req = httpMock.expectOne(request => request.method === 'GET'
                                                         && request.url === `${url}users/${testUser.id}`);
      req.flush({data: testUser}, {status: 201, statusText: ''});
    });
    broadcaster.broadcast('loggedin', 1);

  });

  it('Get user by user id should broadcast authenticationError event on 401 with auth header', (done) => {
    let authenticationError = false;
    let errored = false;
    broadcaster.on('authenticationError').subscribe(() => {
      authenticationError = true;
    });

    broadcaster.on('loggedin').subscribe((data: number) => {
      userService.getUserByUserId('userId').subscribe(() => {}, () => {
        errored = true;
      });
      const req = httpMock.expectOne(request => request.method === 'GET'
                                                         && request.url === `${url}users/${testUser.id}`);
      req.flush({errors: [{code: 'validation_error'}]}, {status: 401, statusText: '', headers: mockHeader});
      expect(errored).toBe(true, 'request error');
      expect(authenticationError).toBe(true, 'authentication error');
      done();
    });
    broadcaster.broadcast('loggedin', 1);

  });

  it('Get user by user name returns null no user matched', (done) => {
    userService.getUserByUsername('nouserId').subscribe((user) => {
      expect(user).toBeNull();
      done();
    });
    const req = httpMock.expectOne(request => request.method === 'GET'
      && request.url === `${url}users?filter[username]=nouserId`);
    req.flush({data: testUsers}, {status: 201, statusText: ''});
  });

  it('Get user by user name returns valid user', (done) => {
    userService.getUserByUsername('secondUser').subscribe((user) => {
      expect(user.id).toEqual('secondUserId');
      done();
    });
    const req = httpMock.expectOne(request => request.method === 'GET'
      && request.url === `${url}users?filter[username]=secondUser`);
    req.flush({data: testUsers}, {status: 201, statusText: ''});
  });

  it('Get user by user name returns valid user when username == email', (done) => {
    userService.getUserByUsername('thirdUser+1@redhat.com').subscribe((user) => {
      expect(user.id).toEqual('thirdUserId');
      done();
    });
    const req = httpMock.expectOne(request => request.method === 'GET'
      && request.url === `${url}users?filter[username]=thirdUser%2B1%40redhat.com`);
    req.flush({data: testUsers}, {status: 201, statusText: ''});
  });
});
