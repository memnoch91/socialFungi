const { db } = require('../admin/admin');

exports.getSpores = (req, res) => {
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
                    likeCount: doc.data().likeCount,
                    userImage: doc.data().userImage // DIFFERENT FROM THE TUTORIAL
                });
            });
            return res.json(spores);
        })
        .catch(err => console.error(err));
};

exports.createSpore = (req, res) => {
    if (req.body.body.trim() === '') {
        return res.status(400).json({ body: 'Body must not be empty' });
    };
    const newSpore = {
        body: req.body.body,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };
    db.collection("spores").add(newSpore)
        .then(doc => {
            const responseSpore = newSpore;
            responseSpore.sporeId = doc.id;
            res.json(responseSpore);
        })
        .catch(err => {
            res.status(500).json({ error: 'please look at the console for the error' });
            console.error(err);
        });
}

exports.getSpore = (req, res) => {
    let sporeComposition = {};
    db.doc(`/spores/${req.params.sporeId}`).get()
        .then(sporeShanpshot => {
            if (!sporeShanpshot.exists) {
                return res.status(404).json({ error: `Spore not found` });
            }
            sporeComposition = sporeShanpshot.data();
            sporeComposition.sporeId = sporeShanpshot.id;
            return db.collection('comments')
                .orderBy('createdAt', 'desc')
                .where('sporeId', '==', req.params.sporeId)
                .get();
        })
        .then(sporeComments => {
            sporeComposition.comments = [];
            sporeComments.forEach(comment => {
                sporeComposition.comments.push(comment.data());
            });
            return res.json(sporeComposition);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })

}

exports.createCommentForSpore = (req, res) => {
    if (req.body.body.trim() === '') { return res.status(400).json({ comment: "Field must not be empty" }) };
    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        sporeId: req.params.sporeId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    }

    db.doc(`/spores/${req.params.sporeId}`)
        .get()
        .then(sporeDoc => {
            if (!sporeDoc.exists) {
                return res.status(404).json({ error: 'Spore not found' });
            }
            return sporeDoc.ref.update({ commentCount: sporeDoc.data().commentCount + 1});
        })
        .then(() => {
            return db.collection('comments').add(newComment);
        })
        .then(() => {
            res.status(200).json(newComment);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Something went wrong' })
        })
}
// Like Spore
exports.likeSpore = (req, res) => {
    const likeDocument = db
        .collection('likes')
        .where('userHandle', '==', req.user.handle)
        .where('sporeId', '==', req.params.sporeId)
        .limit(1);

    const sporeDocument = db
        .doc(`/spores/${req.params.sporeId}`);

    let sporeData = {};

    sporeDocument
        .get()
        .then(sporeDoc => {
            if (sporeDoc.exists) {
                sporeData = sporeDoc.data();
                sporeData.sporeId = sporeDoc.id;
                return likeDocument.get();
            } else {
                return res.status(404).json({ error: 'Spore not found' });
            }
        })
        .then(likeDoc => {
            if (likeDoc.empty) {
                return db
                    .collection('likes')
                    .add({
                        sporeId: req.params.sporeId,
                        userHandle: req.user.handle
                    })
                    .then(() => {
                        sporeData.likeCount++
                        return sporeDocument.update({ likeCount: sporeData.likeCount })
                    })
                    .then(() => {
                        return res.json(sporeData)
                    })
                    .catch(err => {
                        console.error(err);
                        // return res.status(500).json({ error: err.code });
                    });
            } else {
                return res.status(400).json({ error: 'Spore already liked!' })
            }
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code })
        });
}

exports.unlikeSpore = (req, res) => {
    const likeDocument = db
        .collection('likes')
        .where('userHandle', '==', req.user.handle)
        .where('sporeId', '==', req.params.sporeId)
        .limit(1);
    
    const sporeDocument = db
        .doc(`/spores/${req.params.sporeId}`);

    let sporeData = {};

    sporeDocument
        .get()
        .then(sporeDoc => {
            if (sporeDoc.exists) {
                sporeData = sporeDoc.data();
                sporeData.sporeId = sporeDoc.id;
                return likeDocument.get();
            } else {
                return res.status(404).json({ error: 'Spore not found' });
            }
        })
        .then(likeDoc => {
            if (likeDoc.empty) {
                console.error(err);
                return res.status(400).res({ error: 'Spore not liked' });
            } else {
                return db
                    .doc(`/likes/${likeDoc.docs[0].id}`)
                    .delete()
                    .then(() => {
                        sporeData.likeCount--;
                        return sporeDocument.update({ likeCount: sporeData.likeCount })
                    })
                    .then(() => {
                        res.status(200).json(sporeData)
                    })
                    .catch(err => {
                        console.error(err);
                        return res.status(500).json({ error: err.code });
                    });
            }
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
}

// Delete Spore;
exports.deleteSpore = (req, res) => {
    const document = db.doc(`/spores/${req.params.sporeId}`);
    document.get()
        .then(sporeDoc => {
            if(!sporeDoc.exists) {
                return res.status(404).json({error: 'Spore not found'});
            } 
            //check if user sending the delete request is the owner of the spore 
            //a.k.a if the user handle decoded from the token 
            //is the same with the handle of the user handle present on the doc that is about to be deleted
            if (sporeDoc.data().userHandle !== req.user.handle) { 
                return res.status(403).json({error: "Unauthorized request"})
            } else {
                return document.delete();
            }
        })
        .then(() => {
            res.status(200).json({message: 'Spore deleted successfully'})
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({error: err.code})
        })
} 
