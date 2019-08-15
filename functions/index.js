//https://baseUrl.com/api/ - beacuse on the baseUrl you have your app 
const functions = require('firebase-functions');
const app = require('express')();

const { db } = require('./admin/admin')

const { FBAuth } = require('./utils/validationUtils'); // FBAuth stands for fireBase authentication

const { getSpores, createSpore, getSpore, createCommentForSpore, likeSpore, unlikeSpore, deleteSpore } = require('./routeHandlers/spores');
const { signUp, logIn, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead } = require('./routeHandlers/users')

const cors = require ('cors');
app.use(cors());

/**
 * ROUTES
 */
app.get('/spores', getSpores);

app.get('/spore/:sporeId', getSpore);
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

// get other user details
app.get('/user/:handle', getUserDetails);

//mark notifications read
app.post('/notifications', FBAuth, markNotificationsRead);

// exports.api = functions.region('europe-west1').https.onRequest(app);
exports.api = functions.region('us-central1').https.onRequest(app);

exports.createNotificationOnLike = functions.region('us-central1').firestore.document('likes/{id}')
    .onCreate(snapshot => {
        return db.doc(`/spores/${snapshot.data().sporeId}`)
            .get()
            .then(sporeDoc => {
                if (sporeDoc.exists && sporeDoc.data().userHandle !== snapshot.data().userHandle) {
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
            });
    });

exports.deleteNotificationOnUnlike = functions
    .region('us-central1')
    .firestore
    .document('likes/{id}')
    .onDelete(snapshot => {
        return db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .catch(err => {
                console.error(err);
            });
    });

exports.createNotificationOnComment = functions.region('us-central1').firestore.document('comments/{id}')
    .onCreate(snapshot => {
        return db.doc(`/spores/${snapshot.data().sporeId}`)
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
            });
    });

exports.onUserImageChange = functions.region('us-central1').firestore.document(`/users/{userId}`)
    .onUpdate((change) => {
        console.log(change.before.data());
        console.log(change.after.data());

        if (change.before.data().imageUrl !== change.after.data().imageUrl) {
            const batch = db.batch();
            return db
                .collection('spores')
                .where('userHandle', '==', change.before.data().handle)
                .get()
                .then(data => {
                    data.forEach(doc => {
                        const spore = db.doc(`/spores/${doc.id}`);
                        batch.update(spore, { userImage: change.after.data().imageUrl });
                    });
                    return batch.commit();
                });
        } else  {
            return true;
        }
        ;
    });

exports.onSporeDelete = functions.region('us-central1').firestore.document(`/spores/{sporeId}`)
    .onDelete((snapshot, context) => {
        const sporeId = context.params.sporeId;
        const batch = db.batch();

        return db
            .collection('comments')
            .where('sporeId', '==', sporeId)
            .get()
            .then(commentsData => {
                commentsData.forEach(comment => {
                    batch.delete(db.doc(`/comments/${comment.id}`));
                });
                return db
                    .collection('likes')
                    .where('sporeId', '==', sporeId)
                    .get();
            })
            .then(likesData => {
                likesData.forEach(like => {
                    batch.delete(db.doc(`/likes/${like.id}`));
                });
                return db
                    .collection('notifications')
                    .where('sporeId', '==', sporeId)
                    .get();
            })
            .then(notificationsData => {
                notificationsData.forEach(notification => {
                    batch.delete(db.doc(`/notifications/${notification.id}`));
                });
                return batch.commit();
            })
            .catch(err => console.error(err));
    });
