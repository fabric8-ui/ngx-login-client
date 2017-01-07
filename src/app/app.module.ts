import './rxjs-extensions';

import { ModuleWithProviders, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule }    from '@angular/http';
import { DropdownModule } from 'ng2-dropdown';
import { TabsModule } from 'ng2-bootstrap/components/tabs';
import { ModalModule } from 'ng2-modal';
import { TooltipModule } from 'ng2-bootstrap/components/tooltip';

// Shared
import { AuthenticationService } from './auth/authentication.service';
import { Broadcaster } from './shared/broadcaster.service';
import { UserService } from './user/user.service';
import { Logger } from './shared/logger.service';

import { FormsModule } from '@angular/forms';

// App components
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';



// conditionally import the inmemory resource module
var serviceImports: Array<any[] | any | ModuleWithProviders>;

// The inmemory environment variable is checked and if present then the in-memory dataset is added.
if (process.env.ENV == 'inmemory') {
  serviceImports = [
    Logger,
    AuthenticationService,
    Broadcaster,
    UserService,
  ];
} else {
  serviceImports = [
    Logger,
    AuthenticationService,
    Broadcaster,
    UserService,
  ];
}

@NgModule({
  imports: [
    AppRoutingModule,
    BrowserModule,
    DropdownModule,
    FormsModule,
    HttpModule,
    ModalModule,
    TabsModule,
    TooltipModule,
  ],
  declarations: [
    AppComponent,
  ],
  providers: serviceImports,
  bootstrap: [ AppComponent ]
})
export class AppModule { }
