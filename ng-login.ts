//export * from './index';

import './rxjs-extensions';

import { ModuleWithProviders, NgModule } from '@angular/core';
// import { BrowserModule } from '@angular/platform-browser';
// import { HttpModule }    from '@angular/http';

// Shared
import { AuthenticationService } from './src/app/auth/authentication.service';

import { Broadcaster } from './src/app/shared/broadcaster.service';
import { Logger }      from './src/app/shared/logger.service';

import { UserService } from './src/app/user/user.service';


@NgModule({
  imports: [
    // BrowserModule,
    // HttpModule,
  ],
  declarations: [
    AuthenticationService,
    UserService
  ],
  providers: [
    AuthenticationService,
    Broadcaster,
    Logger,
    UserService,
  ],
  exports: [

  ]
})
export class LoginModule {
  /* optional: in case you need users to override your providers */
  static forRoot(configuredProviders: Array<any>): ModuleWithProviders {
    return {
      ngModule: LoginModule,
      providers: configuredProviders
    };
  }
}
