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

/**
 * UTILS
 * @param {*} string 
 */
const isEmpty = (string) => {
    if (string.trim() === '') return true;
    else return false;
}

const isEmail = (email) => {
    // regular expression that matches the pattern of an email;
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.trim().match(emailRegEx)) return true;
    else return false;
}


/**
 * ROUTES
 */

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

    let errors = {}

    if (isEmpty(newUser.email)) {
        errors.email = 'Field must not be empty';
    } else if (!isEmail(newUser.email)) {
        errors.email = 'Must be a valid email adress';
    }

    if (isEmpty(newUser.password)) { errors.password = 'Field Must not be empty' };
    if (newUser.password !== newUser.confirmPassword) { errors.confirmPassword = 'Passwords must match' };
    if (isEmpty(newUser.handle)) { errors.handle = 'Field Must not be empty' }

    if (Object.keys(errors).length > 0) return res.status(400).json(errors)

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
                createdAt: new Date().toDateString(),
                userId
            }
            return db.doc(`/users/${newUser.handle}`).set(userCredentials)
        })
        .then(() => {
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

//Login Route

app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password,
    };

    let errors = {}

    if (isEmpty(user.email)) { errors.email = 'Field must not be empty' };
    if (isEmpty(user.password)) { errors.password = 'Field must not be empty' };

    if (Object.keys(errors).length > 0) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({ token });
        })
        .catch(err => {
            console.error(err);
            if (err.code === "auth/wrong-password") {
                return res.status(403).json({ general: 'Wrong credentials, please try again' });
            } else return res.status(500).json({ error: err.code })
        })
});


exports.api = functions.region('europe-west1').https.onRequest(app);