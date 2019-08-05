//https://baseUrl.com/api/ - beacuse on the baseUrl you have your app 
const functions = require('firebase-functions');
const app = require('express')();

const { db } = require('./admin/admin')

const { FBAuth } = require('./utils/validationUtils'); // FBAuth stands for fireBase authentication

const { getSpores, createSpore, getSpore, createCommentForSpore, likeSpore, unlikeSpore, deleteSpore } = require('./routeHandlers/spores');
const { signUp, logIn, uploadImage, addUserDetails, getAuthenticatedUser } = require('./routeHandlers/users')

/**
 * ROUTES
 */
app.get('/spores', getSpores);
app.get('/spores/:sporeId', getSpore);

app.post('/spore', FBAuth, createSpore);
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


// exports.api = functions.region('europe-west1').https.onRequest(app);
exports.api = functions.region('us-central1').https.onRequest(app);

exports.createNotificationOnLike = functions.region('us-central1').firestore.document('likes/{id}')
    .onCreate(snapshot => {
        db.doc(`/spores/${snapshot.data().sporeId}`)
            .get()
            .then(sporeDoc => {
                if (sporeDoc.exists) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                            createdAt: new Date().toISOString(),
                            recipient: sporeDoc.data().userHandle,
                            sender: snapshot.data().userHandle,
                            type: 'like',
                            read: false,
                            sporeId: sporeDoc.id
                        });
                }
            })
            .catch(() => {
                console.error(err);
                return;
            });
    });

exports.deleteNotificationOnUnlike = functions
    .region('us-central1')
    .firestore
    .document('likes/{id}')
    .onDelete(snapshot => {
        db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .then(() => {
                return;
            })
            .catch(err => {
                console.error(err);
                return;
            });
    });

exports.createNotificationOnComment = functions.region('us-central1').firestore.document('comments/{id}')
    .onCreate(snapshot => {
        db.doc(`/spores/${snapshot.data().sporeId}`)
            .get()
            .then(sporeDoc => {
                if (sporeDoc.exists && sporeDoc.data().userHandle !== snapshot.data().userHandle) {
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: sporeDoc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'comment',
                        read: false,
                        sporeId: sporeDoc.id
                    });
                }
            })
            .catch(() => {
                console.error(err);
                return;
            });
    });


