import './rxjs-extensions';

import { NgModule, Pipe, PipeTransform } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Http, HttpModule } from "@angular/http";

// import { DropdownModule } from 'ngx-dropdown';

import { AlmUserName } from './src/app/user/alm-user-name.pipe';

export { AlmUserName } from './src/app/user/alm-user-name.pipe';


@NgModule({
  imports: [
    FormsModule,
    Http,
    HttpModule,
    Pipe,
    ReactiveFormsModule
  ],
  declarations: [

  ],
  exports: [
    AlmUserName,
  ]
})
export class LoginModule {
  // static forRoot(providedLoader: any = {
  //   provide: TranslateLoader,
  //   useFactory: translateLoaderFactory,
  //   deps: [Http]
  // }): ModuleWithProviders {
  //   return {
  //     ngModule: WidgetsModule,
  //     providers: [
  //       providedLoader,
  //       TranslateService,
  //       { provide: TranslateParser, useClass: DefaultTranslateParser }
  //     ]
  //   };
  // }
}