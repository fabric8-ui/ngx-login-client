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
  jwtHelper: JwtHelperService;
  constructor() {
    this.jwtHelper = new JwtHelperService();
  }

  getAllScopes(resourceId: string): Array<string> {
    const permissions = this.getPermission(resourceId);
    return permissions ? permissions.scopes : [];
  }

  checkScope(resourceId: string, scope: string): boolean {
    const permissions = this.getPermission(resourceId);
    return permissions ? permissions.scopes.includes(scope) : false;
  }

  getDecodedToken() {
    const token = localStorage.getItem('auth_token');
    return token ? this.jwtHelper.decodeToken(token) : '';
  }

  getPermission(resourceId: string): Permission {
    const decodedToken = this.getDecodedToken();
    if (this.isValidRPT(decodedToken)) {
      return decodedToken.permissions.find((permission: Permission) => permission.resource_set_id === resourceId);
    }
  }

  isValidRPT(token: any) {
    return token && token.permissions;
  }

}
