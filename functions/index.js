//https://baseUrl.com/api/ - beacuse on the baseUrl you have your app 

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.env.json');
const app = require('express')();
const firebase = require('firebase');

const firebaseConfig = require('./firebaseConfig.env.js')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://socialfungi.firebaseio.com"
});
const db = admin.firestore()

firebase.initializeApp(firebaseConfig)


app.get('/spores', (req, res) => {
    db.collection("spores")
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            const spores = []
            data.forEach(doc => {
                spores.push({
                    sporeId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createdAt,
                    commentCount: doc.data().commentCount,
                    likeCount: doc.data().likeCount
                });
            });
            return res.json(spores);
        })
        .catch(err => console.error(err));
});


app.post('/spore', (req, res) => {
    const newSpore = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };
    db.collection("spores").add(newSpore)
        .then(doc => {
            res.json({ message: `document ${doc.id} created successfully` });
        })
        .catch(err => {
            res.status(500).json({ error: 'please look at the console for the error' });
            console.error(err);
        });
});


//Signup Route

app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    }
    //TO DO validate data
    let token, userId;
    db.doc(`/users/${newUser.handle}`)
        .get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({ handle: 'this handle is already taken' })
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken()
        })
        .then(idToken => {
            token = idToken
            const userCredentials = { 
                handle: newUser.handle,
                email: newUser.email,
                createdAt:  new Date().toDateString(),
                userId
            }
            return db.doc(`/users/${newUser.handle}`).set(userCredentials)
        })
        .then(()=> {
            return res.status(201).json({ token })
        })
        .catch(err => {
            console.log(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ email: 'Email is already in use' })
            } else {
                return res.status(500).json({ error: err.code });
            }
        });
});


exports.api = functions.region('europe-west1').https.onRequest(app);