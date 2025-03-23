```javascript
let data = {
    users: [   
        {
            uId: 1,
            nameFirst: 'Hayden',
            nameLast: 'Smith',
            email: 'hayhay123@gmail.com',
            handleStr: 'haydensmith',
            password: '123456',
            globalPermissionId: 1,
        },

        {
            uId: 2,
            nameFirst: 'Phil',
            nameLast: 'Foden',
            email: 'philfoden47@gmail.com',
            handleStr: 'philfoden',
            password: 'Hardly_Secure',
            globalPermissionId: 2,
        },
    ],
    
    channels: [
        {
            channelId: 1,
            name: 'My Channel',
            isPublic: true,
            ownerMembers: [
                {
                    uId: 1,
                    nameFirst: 'Hayden',
                    nameLast: 'Smith',
                    email: 'hayhay123@gmail.com',
                    handleStr: 'haydensmith',
                },
            ],
            allMembers: [
                {
                    uId: 1,
                    nameFirst: 'Hayden',
                    nameLast: 'Smith',
                    email: 'hayhay123@gmail.com',
                    handleStr: 'haydensmith',
                },

                {
                    uId: 2,
                    nameFirst: 'Phil',
                    nameLast: 'Foden',
                    email: 'philfoden47@gmail.com',
                    handleStr: 'philfoden',
                },
            ],
            messages: [
                {
                    messageId: 1,
                    uId: 1,
                    message: "Hello World!",
                    timeSent: 1664321899 //get unix timestamp using "Math.floor((new Date()).getTime() / 1000)"
                },
                {
                    messageId: 2,
                    uId: 2,
                    message: "Have a nice day",
                    timeSent: 1664321109 
                }
            ]
        },

        {
            channelId: 2,
            name: 'Moodle',
            isPublic: false,
            ownerMembers: [
                {
                    uId: 1,
                    nameFirst: 'Hayden',
                    nameLast: 'Smith',
                    email: 'hayhay123@gmail.com',
                    handleStr: 'haydensmith',
                }
            ],
            allMembers: [
                {
                    uId: 1,
                    nameFirst: 'Hayden',
                    nameLast: 'Smith',
                    email: 'hayhay123@gmail.com',
                    handleStr: 'haydensmith',
                },

                {
                    uId: 2,
                    nameFirst: 'Phil',
                    nameLast: 'Foden',
                    email: 'philfoden47@gmail.com',
                    handleStr: 'philfoden',
                }
            ],
            messages: [
                {
                    messageId: 1,
                    uId: 1,
                    message: "Another message",
                    timeSent: 1664321899 
                },
                {
                    messageId: 2,
                    uId: 1,
                    message: "Yet another message",
                    timeSent: 1664321109
                }
            ]
        }
    ]
}
```

<h2>Short Description:</h2>

Users and Channels are arrays of objects with each object containing various data types.
'users' and 'channels' are object properties of 'data'.
'users' contains an array that stores the information of our user in objects (An array of objects)
'channels' contains an array that stores the information of our channels in objects (An array of objects), in which the
members and their information are also stored in an array of objects

<h3>Why are we using arrays of objects?</h3>

With an array of objects, we are able to store multiple objects under a single name like 'users', we can then iterate
through the array using an numbers as indexes and store data at certain indexes of this array, instead of using
strings/names as indexes when using an object of objects.
Moreover, there are many built-in methods (e.g. .sort(), .push()) that let us access and alter the array of objects,
this allows us to make changes to our data with more ease.