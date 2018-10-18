import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

export type Permission = {
  exp: number,
  resource_set_id: string,
  resource_set_name: string,
  scopes: Array<string>
};

@Injectable()
export class PermissionService {
  private jwtHelper: JwtHelperService = new JwtHelperService();

  /**
   * Returns all the scopes a user has for a specific resource.
   * @param resourceId ID of a specific resource such as a Space
   */
  getAllScopes(resourceId: string): Array<string> {
    const permissions = this.getPermission(resourceId);
    return permissions ? permissions.scopes : [];
  }

  /**
   * Checks if a user has a specific scope for a resource.
   * @param resourceId ID of a specific resource such as a Space
   * @param scope the scope you want to check for. Ex - `can edit`
   */
  checkScope(resourceId: string, scope: string): boolean {
    const permissions = this.getPermission(resourceId);
    return permissions ? permissions.scopes.includes(scope) : false;
  }

  /**
   * Returns the permission for a specific resource.
   * @param resourceId ID of a specific resource such as a Space
   */
  getPermission(resourceId: string): Permission | null {
    const decodedToken = this.getDecodedToken();
    if (this.isValidRPT(decodedToken)) {
      return decodedToken.permissions.find((permission: Permission) => permission.resource_set_id === resourceId);
    }
    return null;
  }

  /**
   * Decodes the JWT token using JwtHelperService from `angular-jwt`.
   */
  private getDecodedToken(): any {
    const token = localStorage.getItem('auth_token');
    return token ? this.jwtHelper.decodeToken(token) : '';
  }

  /**
   * Checks if the decoded token is valid RPT by checking the permissions claim.
   * @param token Decoded JWT token.
   */
  private isValidRPT(token: any) {
    return token && token.permissions;
  }
}
