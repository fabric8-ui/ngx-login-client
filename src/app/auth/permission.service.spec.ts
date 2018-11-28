import { TestBed, async } from '@angular/core/testing';
import { PermissionService, Permission, UserRoleData } from './permission.service';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AUTH_API_URL } from '../shared/auth-api';
import { AuthInterceptor } from '../shared/auth.interceptor';
import { Broadcaster } from 'ngx-base';
import { WIT_API_PROXY } from '../shared/wit-api';
import { SSO_API_URL } from '../shared/sso-api';
import { JwtHelperService } from '@auth0/angular-jwt';
import { of } from 'rxjs';

describe('Service: Permission Service', () => {
  const jwtHelper: JwtHelperService = new JwtHelperService();
  // tslint:disable-next-line:max-line-length
  const fakeRptToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImFVR3Y4bVFBODVqZzRWMURVOFVrMVcwdUtzeG4xODdLUU9OQUdsNkFNdGMiLCJ0eXAiOiJKV1QifQ.eyJhY3IiOiIwIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHA6Ly9hdXRoLm9wZW5zaGlmdC5pbyIsImh0dHA6Ly9vcGVuc2hpZnQuaW8iXSwiYXBwcm92ZWQiOnRydWUsImF1ZCI6Imh0dHA6Ly9vcGVuc2hpZnQuaW8iLCJhdXRoX3RpbWUiOjE1MzU0MTQxNjAsImF6cCI6Imh0dHA6Ly9vcGVuc2hpZnQuaW8iLCJlbWFpbCI6IlRlc3RVc2VyLTUwZWRmZjE4LTZjODYtNDkxMC1iMDY5LTM3ZDY4ZjFjMDJjMUB0ZXN0LmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZXhwIjoxNTM4MDA2MTYwLCJmYW1pbHlfbmFtZSI6IiIsImdpdmVuX25hbWUiOiJUZXN0VXNlci01MGVkZmYxOC02Yzg2LTQ5MTAtYjA2OS0zN2Q2OGYxYzAyYzEiLCJpYXQiOjE1MzU0MTQxNjAsImlzcyI6Imh0dHA6Ly9hdXRoLm9wZW5zaGlmdC5pbyIsImp0aSI6IjEwOWQwOWVkLTkxY2MtNDM5My04ZmExLWJjMzE4N2FhNDBiYSIsIm5hbWUiOiJUZXN0VXNlci01MGVkZmYxOC02Yzg2LTQ5MTAtYjA2OS0zN2Q2OGYxYzAyYzEiLCJuYmYiOjAsInBlcm1pc3Npb25zIjpbeyJyZXNvdXJjZV9zZXRfbmFtZSI6bnVsbCwicmVzb3VyY2Vfc2V0X2lkIjoiYzBlZTJiOTQtYWVlMy00YzQxLTllMTUtNmZhMzMwY2U4ZTBiIiwic2NvcGVzIjpbImxpbWEiXSwiZXhwIjoxNTM1NTAwNTcyfV0sInByZWZlcnJlZF91c2VybmFtZSI6IlRlc3RVc2VySWRlbnRpdHktNTBlZGZmMTgtNmM4Ni00OTEwLWIwNjktMzdkNjhmMWMwMmMxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19LCJicm9rZXIiOnsicm9sZXMiOlsicmVhZC10b2tlbiJdfX0sInNlc3Npb25fc3RhdGUiOiIiLCJzdWIiOiI3YWNhNThkZi1iNmUxLTRhNTgtOGQzYS02MDBkZjM4MmRkNDAiLCJ0eXAiOiJCZWFyZXIifQ.xbY2neM56yeHRwhXnaKLp67o6ine38MkJb4Yhe-guQ2nN0-aLrXkqxYF7Jgqb-8w1TfDfdUuKQGWUK1Ye-Xh10biZq-Cl7amPIRQwZ8bLsoII9KFXTjkUQbCxOjNxMl89PuliIP_rO3OXydATnL2KAoU36qKbkBiUTKpQNUOXkcb8wtID_SXE1lssHHNeHNVU358kJjMJUqYE0K59C8csddupR1vpEYJknoLW7nKxxWtAJYGYTOjCey8BkVom6bOgOXz0AiEq2aYdjcaRdwz4IeiLGeFIyvT_sIDyPgYFSR2YCN4_N3CSQPfQYdrQhDGKM7fKLBKnYqAwfUe2OeibQ';
  // tslint:disable-next-line:max-line-length
  const fakeAuthToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6InpELTU3b0JGSU1VWnNBV3FVbklzVnVfeDcxVklqZDFpckdrR1VPaVRzTDgiLCJ0eXAiOiJKV1QifQ.eyJhY3IiOiIwIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vYXV0aC5wcm9kLXByZXZpZXcub3BlbnNoaWZ0LmlvIiwiaHR0cHM6Ly9wcm9kLXByZXZpZXcub3BlbnNoaWZ0LmlvIl0sImFwcHJvdmVkIjp0cnVlLCJhdWQiOiJodHRwczovL3Byb2QtcHJldmlldy5vcGVuc2hpZnQuaW8iLCJhdXRoX3RpbWUiOjE1NDI3MDc3NTEsImF6cCI6Imh0dHBzOi8vcHJvZC1wcmV2aWV3Lm9wZW5zaGlmdC5pbyIsImVtYWlsIjoicm9yYWkrcHJldmlld0ByZWRoYXQuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImV4cCI6MTU0NTQ5NzcwMiwiZmFtaWx5X25hbWUiOiJSYWkiLCJnaXZlbl9uYW1lIjoiUm9oaXQiLCJpYXQiOjE1NDI3MDc3NTEsImlzcyI6Imh0dHBzOi8vYXV0aC5wcm9kLXByZXZpZXcub3BlbnNoaWZ0LmlvIiwianRpIjoiMGEzMTAwNWUtYzdjMS00Yzg5LWFmNzEtMjA2NjAxYWRiNmE0IiwibmFtZSI6IlJvaGl0IFJhaSIsIm5iZiI6MCwicGVybWlzc2lvbnMiOm51bGwsInByZWZlcnJlZF91c2VybmFtZSI6InJvcmFpLXByZXZpZXciLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX0sImJyb2tlciI6eyJyb2xlcyI6WyJyZWFkLXRva2VuIl19fSwic2Vzc2lvbl9zdGF0ZSI6IjFmYzRlNzcwLTkxNWUtNDg4ZC04YjczLTY2M2U2MTAxZjA0MSIsInN1YiI6IjcwMjk1ZWZhLWI4MzItNDRjNi1hYjM5LTJmMDMyNDY1Y2M5NiIsInR5cCI6IkJlYXJlciJ9.d83O0APtqullLeMcXw7nEUXVnpPJDNigsmRUS71Ff9Bhb6SEbA-Ugbn4DPgS1zipW92h_x-r8-CX5AZgbCDVeBkr6uJ5lqLk8wLjt3qVVTRjEDJ1J0ecOxSV1zGt5ZBmDXfQ6B-j-41AAZ2p6IEl9J-l-rB32OZfC6oXxDnPIkfGyQyG3kyyEIrfYqW7Dic17zo7vnCLD08K1hFd67UALa2YoYvUM8yyFn8-EUEkL2deQGbTggdzK68kzBOCluu9m_GW8Ly2ePa9H3RebD3VHKwnpji0-a-1HDnFk87Cz8j6SEWChD1F1AMp2-iozxsADCO9edLcAc4DEVSNSLkylQ';
  const fakeResourceId = 'c0ee2b94-aee3-4c41-9e15-6fa330ce8e0b';
  const authUrl = 'http://auth.example.com/';
  let service: PermissionService;
  let httpTestingController: HttpTestingController;

  const fakeUser1 = {
    assignee_id: 'user-1',
    assignee_type: 'something',
    inherited: false,
    inherited_from: 'something',
    role_name: 'role-1'
  };

  const fakeUser2 = {
    assignee_id: 'user-2',
    assignee_type: 'something',
    inherited: false,
    inherited_from: 'something',
    role_name: 'role-1'
  };

  const fakeUsers = [fakeUser1, fakeUser2];

  const fakePermission = {
    'resource_set_name': null,
    'resource_set_id': 'c0ee2b94-aee3-4c41-9e15-6fa330ce8e0b',
    'scopes': [
      'lima'
    ],
    'exp': 1535500572
  };


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
        PermissionService,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        },
        { provide: WIT_API_PROXY, useValue: 'http://wit.example.com/'},
        { provide: AUTH_API_URL, useValue: 'http://auth.example.com/'},
        { provide: SSO_API_URL, useValue: 'http://sso.example.com/'},
        Broadcaster
      ]
    });
    service = TestBed.get(PermissionService);

    httpTestingController = TestBed.get(HttpTestingController);
    localStorage.setItem('auth_token', fakeRptToken);
  });

  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    httpTestingController.verify();
  });

  it('should return permission for a resource', () => {
    service.getPermission(fakeResourceId).subscribe((permission: Permission) => {
      expect(permission.resource_set_id).toBe(fakeResourceId);
    });
  });

  it('should check for scope for a resource', () => {
    service.hasScope(fakeResourceId, 'lima').subscribe((res: boolean) => {
      expect(res).toBe(true);
    });
    service.hasScope(fakeResourceId, 'bean').subscribe((res: boolean) => {
      expect(res).toBe(false);
    });
  });

  it('should return all scopes for a resource', () => {
    service.getAllScopes(fakeResourceId).subscribe((scopes: string[]) => {
      expect(scopes.length).toBe(1);
      expect(scopes.includes('lima')).toBe(true);
    });
  });

  it('should audit RPT if the auth_token saved in localStorage is not valid RPT', () => {
    localStorage.setItem('auth_token', fakeAuthToken);
    service.getPermission(fakeResourceId).subscribe((permission: Permission) => {
      expect(permission.resource_set_id).toBe(fakeResourceId);
    });

    const req = httpTestingController.expectOne(`${authUrl}token/audit?resource_id=${fakeResourceId}`);
    expect(req.request.method).toBe('POST');
    req.flush({ 'rpt_token': fakeRptToken });
  });

  it('should audit RPT if the RPT does not have permission for required resource', () => {
    service.getPermission('some-resource-id').subscribe((permission: Permission) => {
      expect(permission).toBeUndefined();
    });

    const req = httpTestingController.expectOne(`${authUrl}token/audit?resource_id=some-resource-id`);
    expect(req.request.method).toBe('POST');
    req.flush('');
  });

  it('should check if findPermissionAfterAudit is called if localStorage has invalid RPT', () => {
    localStorage.setItem('auth_token', fakeAuthToken);
    spyOn(service, 'findPermissionAfterAudit').and.returnValue(of(fakePermission));
    service.getPermission(fakeResourceId).subscribe((permission: Permission) => {
      expect(permission.resource_set_id).toBe(fakeResourceId);
    });
    expect(service.findPermissionAfterAudit).toHaveBeenCalledWith(fakeResourceId);
    expect(service.findPermissionAfterAudit).toHaveBeenCalledTimes(1);
  });

  it('should check if findPermissionAfterAudit is called if permission is not found', () => {
    spyOn(service, 'findPermissionAfterAudit').and.returnValue(of(undefined));
    service.getPermission('some-resource-id').subscribe((permission: Permission) => {
      expect(permission).toBeUndefined();
    });
    expect(service.findPermissionAfterAudit).toHaveBeenCalledWith('some-resource-id');
    expect(service.findPermissionAfterAudit).toHaveBeenCalledTimes(1);
  });

  it('should assign a role to users', () => {
    service.assignRole(fakeResourceId, 'admin', ['user-1', 'user-2']).subscribe();

    const req = httpTestingController.expectOne(`${authUrl}resources/${fakeResourceId}/roles`);
    expect(req.request.method).toBe('PUT');
    req.flush('');
  });

  it('should get all users with a specific role', () => {
    service.getUsersByRole(fakeResourceId, 'admin')
      .subscribe((users: UserRoleData[]) => {
        expect(users).toBe(fakeUsers);
      });

    const req = httpTestingController.expectOne(`${authUrl}resources/${fakeResourceId}/roles/admin`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: fakeUsers });
  });

  it('should return permission from new decoded RPT after audit', () => {
    service.findPermissionAfterAudit(fakeResourceId).subscribe((permission: Permission | undefined) => {
      expect(localStorage.getItem('auth_token')).toBe(fakeRptToken);
      expect(permission).toEqual(fakePermission);
    });

    const req = httpTestingController.expectOne(`${authUrl}token/audit?resource_id=${fakeResourceId}`);
    expect(req.request.method).toBe('POST');
    req.flush({ 'rpt_token': fakeRptToken });
  });

  it('should return undefined when no new RPT info is there after audit', () => {
    localStorage.setItem('auth_token', fakeAuthToken);
    service.findPermissionAfterAudit(fakeResourceId).subscribe((permission: Permission | undefined) => {
      expect(localStorage.getItem('auth_token')).toBe(fakeAuthToken);
      expect(permission).toEqual(undefined);
    });

    const req = httpTestingController.expectOne(`${authUrl}token/audit?resource_id=${fakeResourceId}`);
    expect(req.request.method).toBe('POST');
    req.flush('');
  });

});
