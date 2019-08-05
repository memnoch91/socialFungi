//https://baseUrl.com/api/ - beacuse on the baseUrl you have your app 
const functions = require('firebase-functions');
const app = require('express')();

const { FBAuth } = require('./utils/validationUtils');

const { getSpores, createSpore } = require('./routeHandlers/spores');
const { signUp, logIn, uploadImage } = require('./routeHandlers/user')

/**
 * ROUTES
 */
app.get('/spores', getSpores);
app.post('/spore', FBAuth, createSpore );

/********* User Routes *********/

//Signup Route
app.post('/signup', signUp);

//Login Route
app.post('/login', logIn);

//Image Route
// aprox 1:50;00 onwards 
app.post('/user/image', FBAuth, uploadImage)


exports.api = functions.region('europe-west1').https.onRequest(app);