//https://baseUrl.com/api/ - beacuse on the baseUrl you have your app 
const functions = require('firebase-functions');
const app = require('express')();

const { FBAuth } = require('./utils/validationUtils'); // FBAuth stands for fireBase authentication

const { getSpores, createSpore, getSpore, createCommentForSpore, likeSpore, unlikeSpore, deleteSpore } = require('./routeHandlers/spores');
const { signUp, logIn, uploadImage, addUserDetails, getAuthenticatedUser } = require('./routeHandlers/users')

/**
 * ROUTES
 */
app.get('/spores', getSpores);
app.get('/spores/:sporeId', getSpore);

app.post('/spore', FBAuth, createSpore );
app.post('/spore/:sporeId/comment', FBAuth, createCommentForSpore);

app.get('/spore/:sporeId/like', FBAuth, likeSpore);
app.get('/spore/:sporeId/unlike', FBAuth, unlikeSpore);

//Delete SPore!
app.delete('/spore/:sporeId', FBAuth, deleteSpore)

/*** TODO's ***/
//delete spore
//like spore
//unlike spore
//comment spore


/********* User Routes *********/

//Signup Route
app.post('/signup', signUp);

//Login Route
app.post('/login', logIn);

//Image Route
app.post('/user/image', FBAuth, uploadImage);

// updated User details
app.post('/user', FBAuth, addUserDetails);

//ged authUser Credetials and likes
app.get('/user', FBAuth, getAuthenticatedUser);


exports.api = functions.region('europe-west1').https.onRequest(app);