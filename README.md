# ngx-login-client
Auth and User services for Angular v2 and up

This library requires a server side component to perform the authentication. The one we 
using is located [here](https://github.com/almighty/almighty-core) and it uses 
[keycloak](https://github.com/keycloak/keycloak). You can see how it is used in the 
front-end [here](https://github.com/fabric8io/fabric8-ui).

The system we build is composed of several components existing in separate repos but
still needing access to common information, like who is logged. These services were 
extracted to provide a shared set of services. 

## Getting started:

This library does not run on it's own. It must be imported. 

`npm install ngx-login-client`

There are several services and a couple of models used by them available.

    AuthenticationService    
    BroadcasterService    
    UserService    
       User
       Profile     
    LoggerService
 
 ## Building it
 
 ####Install the dependencies:
 
 `npm install`
 
 ####If you need to update the dependencies you can reinstall:
 
 `npm run reinstall`
 
 ####Run the tests:
 
 `npm test`
 
 ####Build the library:
 
 `npm run build`
 
 ####Try it out locally. 
 
 We found that `npm link` doesn't fully work. You have to reference the library via `file:`. But you still need to create the link.
 
 - Start by running:
 
   `npm link dist`
 
 - Change this:
 
   `"ngx-login-client": "X.X.X"`
   
 - to this:
 
   `"ngx-login-client": "file:/[LOCATION-TO-NODE-MODULES]/.nvm/versions/node/v6.9.1/lib/node_modules/ngx-login-client"`
 
 
 ####To publish it to NPM:
 
 `npm publish dist/` (_we don't want to publish the whole repo, just the built parts_)
 
 
 
 