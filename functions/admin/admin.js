const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.env.json');

const firebase = require('firebase');
const firebaseConfig = require('./firebaseConfig.env.js')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://socialfungi.firebaseio.com"
});
const db = admin.firestore()

firebase.initializeApp(firebaseConfig);

module.exports = { admin, db, firebase}