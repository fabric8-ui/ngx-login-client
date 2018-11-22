import { Injectable, Inject } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AUTH_API_URL } from '../shared/auth-api';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  getAllScopes(resourceId: string): Array<string> {
    const permission = this.getPermission(resourceId);
    return permission ? permission.scopes : [];
  }

  /**
   * Checks if a user has a specific scope for a resource.
   * @param resourceId ID of a specific resource such as a Space
   * @param scope the scope you want to check for. Ex - `can edit`
   */
  hasScope(resourceId: string, scope: string): boolean {
    const permission = this.getPermission(resourceId);
    return permission ? permission.scopes.includes(scope) : false;
  }

  /**
   * Returns the permission for a specific resource.
   * If there is no permission info in current RPT then we need to audit new RPT token.
   * @param resourceId ID of a specific resource such as a Space
   */
  getPermission(resourceId: string): Permission | null {
    let decodedToken = this.getDecodedToken(resourceId);
    let permission = this.findPermission(decodedToken, resourceId);
    if (!permission) {
      this.auditRPT(resourceId).subscribe(newDecodedToken => {
        if (newDecodedToken) {
          decodedToken = newDecodedToken;
          permission = this.findPermission(decodedToken, resourceId);
        }
      });
    }
    return permission || null;
  }

  /**
   * Assign a specific role to a one or more users in a resource such as space.
   * @param resourceId ID of a specific resource such as a Space
   * @param roleName Role to be assigned for the resource
   * @param userIDs IDs for users that need to be assigned the specified role.
   */
  assignRole(resourceId: string, roleName: string, userIDs: Array<string>): Observable<any> {
    const url = `${this.authApi}resource/${resourceId}/roles`;
    const payload = {
      data: [
        { ids: userIDs, role: roleName }
      ]
    };
    return this.http
      .post(url, payload, { headers: this.headers, responseType: 'text' });
  }

  /**
   * Get all the users who have a speicific role.
   * @param resourceId ID of a specific resource such as a Space
   * @param roleName Role to get all the users for the resource
   */
  getUsersByRole(resourceId: string, roleName: string): Observable<UserRoleData[]> {
    const url = `${this.authApi}resources/${resourceId}/${roleName}`;
    return this.http
      .get(url, { headers: this.headers })
      .pipe(
        map((res: { data: UserRoleData[] }): UserRoleData[] => res.data)
      );
  }

  /**
   * Call the Audit RPT API to get a new RPT token if the token if not an RPT
   * Or if the token doesn't contain permission info for a particular resource
   * @param resourceId ID of a specific resource such as a Space
   */
  auditRPT(resourceId: string): Observable<any> {
    const url = `${this.authApi}token/audit`;
    const params = new HttpParams().set('resource_id', resourceId);
    return this.http
      .post(url, { headers: this.headers, params })
      .pipe(
        map((res: {'rpt_token': string} | null): any => {
          if (res) {
            this.refreshAuthToken(res.rpt_token);
            return this.jwtHelper.decodeToken(res.rpt_token);
          }
          return res;
        })
      );
  }

  /**
   * Find permission info for a particular resource in decoded RPT token.
   * @param token Decoded RPT token
   * @param resourceId ID of a specific resource such as a Space
   */
  private findPermission(token: any, resourceId: string): Permission {
    return token.permissions
      .find((perm: Permission): boolean => perm.resource_set_id === resourceId);
  }

  /**
   * Saves new token with RPT info as auth_token in localStorage.
   * @param rpt RPT token returned after calling audit API
   */
  private refreshAuthToken(rpt: string): void {
    localStorage.setItem('auth_token', rpt);
  }

  /**
   * Decodes the JWT token using JwtHelperService from `angular-jwt`.
   * If the token if not valid RPT the  call auditRPT to get new token.
   * @param resourceId ID of a specific resource such as a Space. Needed for auditRPT
   */
  private getDecodedToken(resourceId: string): any {
    const token = localStorage.getItem('auth_token');
    let decodedToken = token ? this.jwtHelper.decodeToken(token) : '';
    if (!this.isValidRPT(decodedToken)) {
      this.auditRPT(resourceId).subscribe(newDecodedToken => {
        if (newDecodedToken) {
          decodedToken = newDecodedToken;
        }
      });
    }
    return decodedToken;
  }

  /**
   * Checks if the decoded token is valid RPT by checking the permissions claim.
   * @param token Decoded JWT token.
   */
  private isValidRPT(token: any): boolean {
    return token && token.permissions;
  }
}
