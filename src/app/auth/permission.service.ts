import { Injectable, Inject } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AUTH_API_URL } from '../shared/auth-api';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, iif, of } from 'rxjs';
import { map } from 'rxjs/operators';

export type Permission = {
  exp: number,
  resource_set_id: string,
  resource_set_name: string,
  scopes: Array<string>
};

export type UserRoleData = {
  assignee_id: string,
  assignee_type: string,
  inherited: boolean,
  inherited_from: string,
  role_name: string
};

@Injectable()
export class PermissionService {
  private jwtHelper: JwtHelperService = new JwtHelperService();
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(
    private http: HttpClient,
    @Inject(AUTH_API_URL) private authApi: string
  ) {}

  /**
   * Returns all the scopes a user has for a specific resource.
   * @param resourceId ID of a specific resource such as a Space
   */
  getAllScopes(resourceId: string): Observable<string[]> {
    return this.getPermission(resourceId).pipe(
      map((permission: Permission | undefined) => permission.scopes)
    );
  }

  /**
   * Checks if a user has a specific scope for a resource.
   * @param resourceId ID of a specific resource such as a Space
   * @param scope the scope you want to check for. Ex - `can edit`
   */
  hasScope(resourceId: string, scope: string): Observable<boolean> {
    return this.getPermission(resourceId).pipe(
      map((permission: Permission | undefined) => permission.scopes.includes(scope))
    );
  }

  /**
   * Returns the permission for a specific resource.
   * If there is no permission info in current RPT then we need to audit new RPT token.
   * @param resourceId ID of a specific resource such as a Space
   */
  getPermission(resourceId: string): Observable<Permission | undefined> {
    const permission = this.findPermission(this.getDecodedToken(), resourceId);
    return iif(
      () => !!permission,
      of(permission),
      this.findPermissionAfterAudit(resourceId)
    );
  }

  /**
   * Assign a specific role to a one or more users in a resource such as space.
   * @param resourceId ID of a specific resource such as a Space
   * @param roleName Role to be assigned for the resource
   * @param userIDs IDs for users that need to be assigned the specified role.
   */
  assignRole(resourceId: string, roleName: string, userIDs: Array<string>): Observable<string> {
    const url = `${this.authApi}resources/${resourceId}/roles`;
    const payload = {
      data: [
        { ids: userIDs, role: roleName }
      ]
    };
    return this.http
      .put(url, payload, { headers: this.headers, responseType: 'text' });
  }

  /**
   * Get all the users who have a speicific role.
   * @param resourceId ID of a specific resource such as a Space
   * @param roleName Role to get all the users for the resource
   */
  getUsersByRole(resourceId: string, roleName: string): Observable<UserRoleData[]> {
    const url = `${this.authApi}resources/${resourceId}/roles/${roleName}`;
    return this.http
      .get<{data: UserRoleData[]}>(url, { headers: this.headers })
      .pipe(
        map(res => res.data)
      );
  }

  /**
   * Call the Audit RPT API to get a new RPT token if the token if not an RPT
   * Or if the token doesn't contain permission info for a particular resource
   * @param resourceId ID of a specific resource such as a Space
   */
  findPermissionAfterAudit(resourceId: string): Observable<Permission | undefined> {
    const url = `${this.authApi}token/audit`;
    const params = new HttpParams().set('resource_id', resourceId);
    return this.http
      .post<{'rpt_token': string} | undefined>(url, '', { headers: this.headers, params })
      .pipe(
        map((res): Permission | undefined => {
          if (res) {
            this.saveRPT(res.rpt_token);
            return this.findPermission(this.getDecodedToken(), resourceId);
          }
        })
      );
  }

  /**
   * Find permission info for a particular resource in decoded RPT token.
   * @param token Decoded RPT token
   * @param resourceId ID of a specific resource such as a Space
   */
  private findPermission(token: any, resourceId: string): Permission | undefined {
    return token && token.permissions && token.permissions
      .find((perm: Permission): boolean => perm.resource_set_id === resourceId);
  }

  /**
   * Saves new token with RPT info as auth_token in localStorage.
   * @param rpt RPT token returned after calling audit API
   */
  private saveRPT(rpt: string): void {
    localStorage.setItem('auth_token', rpt);
  }

  /**
   * Decodes the JWT token using JwtHelperService from `angular-jwt`.
   * If the token if not valid RPT the  call auditRPT to get new token.
   */
  private getDecodedToken(): any {
    const token = localStorage.getItem('auth_token');
    return token ? this.jwtHelper.decodeToken(token) : undefined;
  }
}
