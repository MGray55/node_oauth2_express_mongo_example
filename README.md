# Example of OAuth2 node with Express and Mongo

### Purpose:
I was looking to do something with Express & Mongo that I hadn't done before.
It occurred to me that many people may want to do the same.
And that's to use authentication and authorization using OAuth2.

I ended up putting together this sample application.
Please feel to use this as a spring board for your own projects
The target audience for this is the Harvard Extension CSCIE-31 class, but I kept it generic enough that anyone could use this as a reference.

### What this covers
I didn't add a Rest API, or a client application, or a way to persist auth tokens on the client. I'm trying to keep things agnostic, as you may use Jade, Pug, Angular, React, or just plain old Javascript to use these services.

### Documentation and help
I compiled this project from a variety of sources, and among them you'll want to look at:
https://blog.cloudboost.io/how-to-make-an-oauth-2-server-with-node-js-a6db02dc2ce7
https://github.com/oauthjs/node-oauth2-server
https://github.com/oauthjs/express-oauth-server/tree/master/examples
https://oauth2-server.readthedocs.io/en/latest/
And most importantly, the Model Specification:
https://oauth2-server.readthedocs.io/en/latest/model/spec.html

### Basic Assumptions
- You have a node server with Express set-up.
- You are using MongoDB for persisting information.
- You have configured a connection to Mongo DB.
- You are familiar with setting up express routes.

We'll be using this npm package in particular
https://www.npmjs.com/package/node-oauth2-server
https://github.com/oauthjs/node-oauth2-server

For convenience, I have generated my base node app using WebStorm.
There are some other great ones using Yeoman you can check out.

In all of these examples, I did not use TypeScript, though one could easily port it over.
I'm not using a Javascript framework, but you can test your work directly using Postman.

### node-oauth2-server
The node-oauth2-server npm package is built on top of the oauth2-server API.
Though the Readme on the GitHub project page says that it has been changed from 2.x to 3.x, I found this not to be the case.
There are certain functions that you must implement to work with OAuth2.
Within those functions, there are expected responses that are sent back to the OAuth-server API. As far as flow, think of it like a middleware, where you would call next() to continue the operations. Without the expected responses, the flow would stop.
That's something to keep in mind while you are building this.
If in your development, you send an HTTP request that uses the oauth code, and it never responds, with an error, or success, or anything, you may want to look that the chain isn't stuck because one of your functions did not return control back to the OAuth API.

The core API that node-oauth2-server is built from, does support callbacks, promises and async/await in ES6. However, the implementation of node-oauth2-server uses callbacks. I personally would rather use async/await, and keep things a little more de-coupled, but hey, it works.

### OK - let's get to it
### Create documents needed in Mongo
I first created tables in the Mongo db (using the Compass client)
- oauthclients - A list of client applications and 'secrets'
- oauthusers - User accounts with a username and password
- oauthtokens - A table to persist authtokens attached to a username, and (optionally) refresh tokens

### Create javascript files that map to the new documents
Once the tables are set up, I next create Javascript 'model' classes to reflect the schema. As an example,
```
const OAuthClientsSchema = new Schema({
  client_id: { type: String, required: true},
  client_secret: { type: String, required: true },
  createdOn: {type: Date, default: Date.now}
});

// Export the model
module.exports = mongoose.model('OAuthClients', OAuthClientsSchema);
```
(I like to set a default time stamp on my Mongo entries. This can be helpful down the road if you ever need to do database cleanup, or you want a peek into what users are doing).

### Set up express to use OAuth2
Back in app.js in the root of my node app, tell the app instance we are going to use node-oauth2-server.
We are going to import 'node-oauth2-server' and create an instance of it.
We need to configure it with some info,
1) the model, which is the oauth.model.js with the expected functions we just created.
2) The grants, for now we'll use 'password'
3) A debug flag. We may want to set this up with a env or node param to switch it off in production, but for now we'll just say 'true'
```
const app = express();
app.oauth = oAuth2Server({
  model: oAuthModel,
  grants: ['password'],
  debug: true // This you may want to set up with an ENV var for production
});
```
With grants, we are telling oauth2 to key off the password field - Later I'll show you a neat trick with this.

***Tip*** - you may notice in app.js that I'm setting bodyParser to extended = true.
You may need to do this to support more deeply built JSON objects.
Reading up on this, I found that this can be a "gotcha"

### Create express routes
I am setting up two (2) routes for
user and authentication operations just for clarity.
You may notice that we inject the express app into the routes.
We'll need that reference to work with the OAuth2 that we configured and attached to the app at startup.
```
const authRouter = require('./routes/auth')(app);
const restrictedRouter = require('./routes/restricted')(app);
```

### Create a special model just for node-oauth2-server
I am going to create a special file in the models directory that is the required Model for oauth2 API. This contains the required callbacks for the OAuth2 API to work

The functions we are going to provide are the following:
- ***getClient*** - This will get the client, or your application definition based on an id and secret. You may want to keep the secret hidden, so you could set up environment or node params to pass in the values.
- ***getUser*** - this is returns a boolean to see if the user/pwd combination exists in the db already
- ***saveAccessToken*** - On successful authentication, a unique bearer token with an expiration time is generated, that must be saved in the db. The idea is, the same token is sent to the client to include in future requests. You can compare the client request to the token in the db to validate if the user is allowed to pass.
- ***getAccessToken*** - This is the complementary function to the last item. It is invoked to retrieve an existing token that was previously saved.
- ***grantTypeAllowed*** - This function allows you to return true if you want to allow the grant type. In our case, we are granting based off the password field, so we can check for that. (deprecated in OAuht2 v3.0, but you still need it for node-oauth2-server).
- - ***saveRefreshToken*** - An optional call that is run if grant type of 'refresh_token' is set on startup. If enabled, a refresh token is generated at the same time as the access token. The user can use this generated refresh token to request a new token with a new expiration time on every call. Save the refresh token somewhere for later use in this call.
- ***getRefreshToken*** - An optional call that is run if grant type of 'refresh_token' is set on startup. A place to give you a chance to retrieve the refresh token that was persisted to Mongo earlier. OAuth will check the client's refresh token with the one in the db to see if it's ok to proceed.

If you want to get deeper, you can do some more advanced things, like create your own auth code algorithm, or do custom handling of data, like obfuscation of items being persisted.

### Create express routes
Further down in app.js, we'll define
app.use('/users', usersRouter);
app.use('/auth', authRouter);

I've created definitions of these routes under the 'routes' folder
I like to separate concerns, so the routes are very simple mappings, and any logic needed for them are in controller files found under /controllers.

### Create user
The first route we're going to set up is adding a user and password.
We do a check on the existence of the user in the db.
By trying to add a second entry from the same user, we return a message that the user already exists

### Login
Once the user is created, we can attempt to login.
We need some more information for this.
In the POST request, we send the user name, pasword, the grant type, and the client id and secret.

When we attempt to login, it checks if we will allow them to be authorized based on password, we'll return yes.
OAth2 API will next call the getUser() function we implemented.
It looks up the user based on username and password,
Once it's found, it calls the next callback in the chain
That tells OAuth2 to create a bearer token, which is returned to us in the saveAccessToken implementation. We will save this in the db for future reference.
After the async save is made to the db, we return it to the caller.

The client receives the token info,
    "token_type": "bearer",
    "access_token": "78951a8a46179e4f828aa9189c43d97186014867",
    "expires_in": 3600,

This will then call the following on your model (in this order):
getClient (clientId, clientSecret, callback)
grantTypeAllowed (clientId, grantType, callback)
getUser (username, password, callback)
saveAccessToken (accessToken, clientId, expires, user, callback)
(if grant of 'refresh_token' is added:
saveRefreshToken (refreshToken, clientId, expires, user, callback) (if using)

### Protected route
For paths that are protected on Express by OAUTH, the user will now need to provide the bearer token as the 'Authorization' key in the POST request in the following format:
``` Bearer 1e1b22895b2516dfbc0a7434ee4f5678297eb353 ```








