const { admin, db, firebase } = require('../admin/admin');
const { validateSignupData, validateLoginData, reduceUserDetails } = require('../utils/validationUtils');
const firebaseConfig = require('../admin/firebaseConfig.env.js');


const storageBucket = firebaseConfig.storageBucket;
// const firebaseStorage = admin.storage().bucket(storageBucket);


exports.signUp = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    }
    /*** validate data ***/
    const { dataIsValid, errors } = validateSignupData(newUser);
    if (!dataIsValid) return res.status(400).json({ errors })

    /*** default image added to imageUrl below ***/
    const noImg = 'no-img.png'

    let token, userId, dtk;
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
            return data.user.getIdToken();
        })
        .then(idToken => {
            admin.auth().verifyIdToken(idToken)
                .then(decodedToken => {
                    dtk = decodedToken;
                })
            return idToken;
        })
        .then(idToken => {
            // console.log(dtk)
            token = idToken
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toDateString(),
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${noImg}?alt=media&token=9e0388e0-e22e-4e5a-bc02-0359933ed8db`,
                userId
                //`https://firebasestorage.googleapis.com/v0/b/${ storageBucket}/ o / ${ noImg }?alt = media`
                // https://firebasestorage.gooleapis.com/v2/b/socialfungi.appspot.com/o/no-img.png?alt=media
                // https://firebasestorage.googleapis.com/v0/b/socialfungi.appspot.com/o/no-img.png?alt=media&token=9e0388e0-e22e-4e5a-bc02-0359933ed8db
            }
            return db.doc(`/users/${newUser.handle}`).set(userCredentials)
        })
        .then(() => {
            return res.status(201).json({ token })
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ email: 'Email is already in use' })
            } else {
                return res.status(500).json({ error: err.code });
            }
        });
}

exports.logIn = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password,
    };

    const { dataIsValid, errors } = validateLoginData(user);
    if (!dataIsValid) return res.status(400).json({ errors })

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            // console.log(token)
            return res.json({ token });
        })
        .catch(err => {
            console.error(err);
            if (err.code === "auth/wrong-password") {
                return res.status(403).json({ general: 'Wrong credentials, please try again' });
            } else return res.status(500).json({ error: err.code })
        })
}

/*** UPLOAD PROFILE IMAGE ***/

exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers });

    let imageFileName;
    let imageToBeUploaded = {};

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        //below constant extracts the  file extension
        // console.log(fieldname);
        // console.log(filename);
        // console.log(mimetype);

        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({ error: "Wrong file type submitted" })
        }

        const imgExtension = filename.split('.')[filename.split('.').length - 1];
        imageFileName = `${Math.round(Math.random() * 100000)}.${imgExtension}`;

        const filePath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filePath, mimetype };

        file.pipe(fs.createWriteStream(filePath));
    });

    busboy.on('finish', () => {
        admin.storage().bucket(storageBucket).upload(imageToBeUploaded.filePath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
            .then(() => {
                const imageUrl = `https://firebasestorage.gooleapis.com/v0/b/${storageBucket}/o/${imageFileName}?alt=media`;
                return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
            })
            .then(() => {
                return res.json({ message: 'Image uploaded successfully' });
            })
            .catch(err => {
                console.log(err);
                return res.status(500).json({ error: err.code });
            })

    });
    busboy.end(req.rawBody);

}

/*** ADD USER DETAILS ***/

exports.addUserDetails = (req, res) => {
    let newUserDetails = reduceUserDetails(req.body)
    db.doc(`/users/${req.user.handle}`).update(newUserDetails)
        .then(() => {
            return res.status(200).json({ message: 'Details updated successfully' });
        })
        .catch(err => {
            console.error(err);
            return req.status(500).json({ error: err.code })
        })
}

/*** GET OWN USER DETAILS ***/

exports.getAuthenticatedUser = (req, res) => {
    const resUserData = {}; // response user data
    // console.log('user badle', req);
    
    db.doc(`/users/${req.user.handle}`).get() //get returns a documentSnapshot
        .then(doc => {
            if(doc.exists) {
                resUserData.credentials = doc.data();
                return db.collection('likes').where('userHandle', '==', req.user.handle).get();
            };
        })
        .then(likes => {
            resUserData.likes = [];
            likes.forEach(like => {
                resUserData.likes.push(like.data());
            });
            return db.collection('notifications')
                .where('recipient', '==', req.user.handle)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({error: err.code});
        })
}