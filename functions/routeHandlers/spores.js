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
                    likeCount: doc.data().likeCount
                });
            });
            return res.json(spores);
        })
        .catch(err => console.error(err));
};

exports.createSpore = (req, res) => {
    const newSpore = {
        body: req.body.body,
        userHandle: req.user.handle,
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
}

