/*** REFERENCE FILE - NOT USED IN THE ACTUAL db! ****/

let db = {
    user: [
        {
            email: 'user@email.com',
            bio: 'short desciption',
            userId: 'fjidfh8af78adaoid',
            handle: 'user',
            createdAt: '2019-08-03T12:30:39.197Z',
            imageUrl: 'created in imageUpload route',
            location: 'London, UK',
            website: 'http://user.com'
        }
    ],
    spores: [
        {
            userHandle: 'user',
            body: 'This is a spore on an Ideea',
            createdAt: '2019-08-03T12:30:39.197Z',
            likeCount: 5,
            commentCount: '2',
        }
    ],
    comments: [
        {
            userHandle: 'user',
            sporeId: 'kdjsfgdksuufhgkdsufky',
            body: 'nice one mate!',
            createdAt: '2019-03-15T10:59:52.798Z'
        }
    ],
    notifications: [
        {
            recipient: 'user',
            sender: 'john',
            read: 'true | false',
            sporeId: 'kdjsfgdksuufhgkdsufky',
            type: 'like | comment',
            createdAt: '2019-03-15T10:59:52.798Z'
        }
    ]
}

const userDetails = {
    // Redux data
    credentials: {
        userId: 'N43KJ5H43KJHREW4J5H3JWMERHB',
        email: 'user@email.com',
        handle: 'user',
        createdAt: '2019-03-15T10:59:52.798Z',
        imageUrl: 'image/dsfsdkfghskdfgs/dgfdhfgdh',
        bio: 'Hello, my name is user, nice to meet you',
        website: 'https://user.com',
        location: 'Lonodn, UK'
    },
    likes: [
        {
            userHandle: 'user',
            sporeId: 'hh7O5oWfWucVzGbHH2pa'
        },
        {
            userHandle: 'user',
            sporeId: '3IOnFoQexRcofs5OhBXO'
        }
    ]
};