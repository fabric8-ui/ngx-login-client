import { HttpResponse } from '@angular/common/http';

export function isAuthenticationError(res: HttpResponse<JSON>): boolean {
  if (res.status === 401) {
    const json: any = res.body;
    const hasErrors: boolean = json && Array.isArray(json.errors);
    const isJwtError: boolean = hasErrors &&
      json.errors.filter((e: any) => e.code === 'jwt_security_error').length >= 1;
    const authHeader = res.headers.get('www-authenticate');
    const isLoginHeader = authHeader && authHeader.toLowerCase().includes('login');
    return isJwtError || isLoginHeader;
  }
  return false;
}
