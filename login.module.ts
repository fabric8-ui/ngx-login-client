import { NgModule } from '@angular/core';
import { Http, HttpModule } from "@angular/http";

import { AlmUserName } from './src/app/user/alm-user-name.pipe';

@NgModule({
  imports: [
    Http,
    HttpModule,
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