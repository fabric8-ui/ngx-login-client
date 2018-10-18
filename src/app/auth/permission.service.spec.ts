import { TestBed } from '@angular/core/testing';
import { PermissionService, Permission } from './permission.service';

describe('Service: Permission Service', () => {
  // tslint:disable-next-line:max-line-length
  const fakeToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImFVR3Y4bVFBODVqZzRWMURVOFVrMVcwdUtzeG4xODdLUU9OQUdsNkFNdGMiLCJ0eXAiOiJKV1QifQ.eyJhY3IiOiIwIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHA6Ly9hdXRoLm9wZW5zaGlmdC5pbyIsImh0dHA6Ly9vcGVuc2hpZnQuaW8iXSwiYXBwcm92ZWQiOnRydWUsImF1ZCI6Imh0dHA6Ly9vcGVuc2hpZnQuaW8iLCJhdXRoX3RpbWUiOjE1MzU0MTQxNjAsImF6cCI6Imh0dHA6Ly9vcGVuc2hpZnQuaW8iLCJlbWFpbCI6IlRlc3RVc2VyLTUwZWRmZjE4LTZjODYtNDkxMC1iMDY5LTM3ZDY4ZjFjMDJjMUB0ZXN0LmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZXhwIjoxNTM4MDA2MTYwLCJmYW1pbHlfbmFtZSI6IiIsImdpdmVuX25hbWUiOiJUZXN0VXNlci01MGVkZmYxOC02Yzg2LTQ5MTAtYjA2OS0zN2Q2OGYxYzAyYzEiLCJpYXQiOjE1MzU0MTQxNjAsImlzcyI6Imh0dHA6Ly9hdXRoLm9wZW5zaGlmdC5pbyIsImp0aSI6IjEwOWQwOWVkLTkxY2MtNDM5My04ZmExLWJjMzE4N2FhNDBiYSIsIm5hbWUiOiJUZXN0VXNlci01MGVkZmYxOC02Yzg2LTQ5MTAtYjA2OS0zN2Q2OGYxYzAyYzEiLCJuYmYiOjAsInBlcm1pc3Npb25zIjpbeyJyZXNvdXJjZV9zZXRfbmFtZSI6bnVsbCwicmVzb3VyY2Vfc2V0X2lkIjoiYzBlZTJiOTQtYWVlMy00YzQxLTllMTUtNmZhMzMwY2U4ZTBiIiwic2NvcGVzIjpbImxpbWEiXSwiZXhwIjoxNTM1NTAwNTcyfV0sInByZWZlcnJlZF91c2VybmFtZSI6IlRlc3RVc2VySWRlbnRpdHktNTBlZGZmMTgtNmM4Ni00OTEwLWIwNjktMzdkNjhmMWMwMmMxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19LCJicm9rZXIiOnsicm9sZXMiOlsicmVhZC10b2tlbiJdfX0sInNlc3Npb25fc3RhdGUiOiIiLCJzdWIiOiI3YWNhNThkZi1iNmUxLTRhNTgtOGQzYS02MDBkZjM4MmRkNDAiLCJ0eXAiOiJCZWFyZXIifQ.xbY2neM56yeHRwhXnaKLp67o6ine38MkJb4Yhe-guQ2nN0-aLrXkqxYF7Jgqb-8w1TfDfdUuKQGWUK1Ye-Xh10biZq-Cl7amPIRQwZ8bLsoII9KFXTjkUQbCxOjNxMl89PuliIP_rO3OXydATnL2KAoU36qKbkBiUTKpQNUOXkcb8wtID_SXE1lssHHNeHNVU358kJjMJUqYE0K59C8csddupR1vpEYJknoLW7nKxxWtAJYGYTOjCey8BkVom6bOgOXz0AiEq2aYdjcaRdwz4IeiLGeFIyvT_sIDyPgYFSR2YCN4_N3CSQPfQYdrQhDGKM7fKLBKnYqAwfUe2OeibQ';
  const fakeResourceId = 'c0ee2b94-aee3-4c41-9e15-6fa330ce8e0b';
  let service: PermissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PermissionService
      ]
    });
    service = TestBed.get(PermissionService);

    localStorage.setItem('auth_token', fakeToken);
  });

  it('should return permission for a resource', () => {
    const permission: Permission = service.getPermission(fakeResourceId);
    expect(permission.resource_set_id).toBe(fakeResourceId);
  });

  it('should check for scope for a resource', () => {
    expect(service.checkScope(fakeResourceId, 'lima')).toBe(true);
    expect(service.checkScope(fakeResourceId, 'bean')).toBe(false);
  });

  it('should return all scopes for a resource', () => {
    const scopes = service.getAllScopes(fakeResourceId);
    expect(scopes.length).toBe(1);
    expect(scopes.includes('lima')).toBe(true);
  });
});
