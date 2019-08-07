const { admin, db } = require('../admin/admin');
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

const FBAuth = (req, res, next) => {
    let idToken;
    const authorization = req.headers.authorization;

    if (authorization && authorization.startsWith('Bearer ')) {
        idToken = authorization.split('Bearer ')[1];
    } else {
        console.err('No token found')
        return res.status(403).json({ error: 'Unauthorized!' });
    }

    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            //the token received here contains user data that needs to be added to the user request
            //exta data on the token form the user  in the middleware
            req.user = decodedToken;
            // console.log(decodedToken);
            return db.collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get();
        })
        .then(data => {
            req.user.handle = data.docs[0].data().handle;
            req.user.imageUrl = data.docs[0].data().imageUrl;
            return next();
        })
        .catch(err => {
            console.error(' Error while verifying token', err)
            return res.status(403).json({ err })
        })
}

const validateSignupData = (data) => {
    let errors = {}

    if (isEmpty(data.email)) {
        errors.email = 'Field must not be empty';
    } 
    else if (!isEmail(data.email)) {
        errors.email = 'Must be a valid email adress';
    }

    if (isEmpty(data.password)) { errors.password = 'Field Must not be empty' };
    if (isEmpty(data.confirmPassword)) { errors.confirmPassword = 'Field Must not be empty' };
    if (data.password !== data.confirmPassword) { errors.confirmPassword = 'Passwords must match' };
    if (isEmpty(data.handle)) { errors.handle = 'Field Must not be empty' }

    return {
        errors: errors,
        dataIsValid: Object.keys(errors).length === 0 ? true : false,
    }

}

const validateLoginData = (data) => {
    let errors = {}

    if (isEmpty(data.email)) { errors.email = 'Field must not be empty' };
    if (isEmpty(data.password)) { errors.password = 'Field must not be empty' };

    return {
        errors: errors,
        dataIsValid: Object.keys(errors).length === 0 ? true : false,
    }
}

const reduceUserDetails = (newdUserDetails) => {
    const tempUserDetails = {
        bio: '',
        website: '',
        location: ''

    };
    // check for bio
    if (!isEmpty(newdUserDetails.bio.trim())) { tempUserDetails.bio = newdUserDetails.bio };

    //check for website update with http if needed and add new version;
    if (!isEmpty(newdUserDetails.website.trim())) {
        // https://website.com || http://website.com will be posted as is if http or https not passed by user http will be added;
        if (newdUserDetails.website.trim().substring(0, 4) !== 'http') {
            tempUserDetails.website = `http://${newdUserDetails.website.trim()}`;
            console.log('temp user details', tempUserDetails.website);

        } else tempUserDetails.website = newdUserDetails.website;
    }


    // check for location
    if (!isEmpty(newdUserDetails.location.trim())) { tempUserDetails.location = newdUserDetails.location };

    return tempUserDetails;
}

module.exports = { isEmpty, isEmail, FBAuth, validateSignupData, validateLoginData, reduceUserDetails }