import './rxjs-extensions';

import { ModuleWithProviders, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule }    from '@angular/http';

// Shared
import { AuthenticationService } from './src/app/auth/authentication.service';
import { Broadcaster } from './src/app/shared/broadcaster.service';
import { UserService } from './src/app/user/user.service';
import { Logger } from './src/app/shared/logger.service';

// App components
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';


@NgModule({
  imports: [
    AppRoutingModule,
    BrowserModule,
    HttpModule,
  ],
  declarations: [
    AppComponent,
  ],
  providers: [
    Logger,
    AuthenticationService,
    Broadcaster,
    UserService,
  ],
  bootstrap: [ AppComponent ]
})
export class LoginModule { }
