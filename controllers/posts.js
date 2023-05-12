const Post = require("../models/Post");
const { Storage } = require("@google-cloud/storage");
const path = require("path");

const googleCloud = new Storage({
    keyFilename: path.join(
        __dirname,
        `../${process.env.GOOGLE_APPLICATION_CREDENTIALS}`
    ),
    projectId: process.env.GCS_ID,
});

const gcFiles = googleCloud.bucket("travel-app-bucket");

const handlePostRating = (
    req,
    res,
    usersList,
    propertyName,
    value,
    mongoOperator
) => {
    Post.updateOne(
        { _id: req.params.id },
        {
            [mongoOperator]: { [usersList]: req.auth.userId },
            $inc: { [propertyName]: value },
        }
    )
        .then((newPost) => res.status(200).json(newPost))
        .catch((error) => res.status(400).json({ error }));
};
const handleDelePost = (req, res) => {
    Post.deleteOne({ _id: req.params.id })
        .then(() => res.status(200).json({ message: "Post supprimé !" }))
        .catch((error) => res.status(401).json({ error }));
};
const handlePostModif = (id, postObject, res) => {
    Post.updateOne({ _id: id }, { ...postObject, id: id })
        .then(() => res.status(200).json({ message: "Post modifié!" }))
        .catch((error) => res.status(401).json({ error }));
};
const handlePostObject = (req) => {
    let postObject;
    if (req.body.file == "") {
        postObject = { ...req.body };
    } else if (req.file) {
        const url = `${process.env.GCS_URL}${req.file.filename}`;
        postObject = {
            ...req.body,
            imageUrl: url,
        };
    } else if (req.files) {
        let url;
        for (let i = 0; i < req.files.length; i++) {
            if (req.files[i].filename !== undefined)
                url = `${process.env.GCS_URL}${req.files[i].filename}`;
        }
        postObject = {
            ...req.body,
            imageUrl: url,
        };
    } else {
        postObject = { ...req.body };
    }
    delete postObject._userId;
    return { postObject };
};

//Creates a new post : --> Gets the data from the request
//Deletes id and user id for security reasons
//Creates a new object before sending it to the data base
exports.createPost = (req, res, next) => {
    const postObject = JSON.stringify(req.body);
    let url;
    if (req.files[0] === undefined) {
        url = "";
    } else {
        for (let i = 0; i < req.files.length; i++) {
            if (req.files[i].filename !== undefined)
                url = `${process.env.GCS_URL}${req.files[i].filename}`;
        }
    }
    delete postObject._userId;
    let { country, pseudo, profilePicture, text, date } =
        JSON.parse(postObject);
    const post = new Post({
        userId: req.auth.userId,
        country,
        pseudo,
        profilePicture,
        text,
        imageUrl: url,
        date,
    });

    post.save()
        .then(() => {
            res.status(201).json({ message: "Post enregistré!" });
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

//Changes a post already sent to the data base
//Gets the data from the request and checks if it contains a file
//If there is a file we get request's body but we change the value on the imageUrl's property
//If there is no file we keep the request's body intact
exports.modifyPost = (req, res, next) => {
    const { postObject } = handlePostObject(req);
    Post.findOne({ _id: req.params.id })
        .then((post) => {
            if (
                post.userId == req.auth.userId ||
                process.env.ADMIN_ACCOUNT_ID == req.auth.userId
            ) {
                if (req.files || req.file) {
                    if (post.imageUrl !== "") {
                        const originalname = post.imageUrl.split(
                            "/travel-app-bucket/"
                        )[1];
                        const file = gcFiles.file(originalname);
                        file.delete()
                            .then(() => {
                                handlePostModif(req.params.id, postObject, res);
                            })
                            .catch((error) => res.status(401).json({ error }));
                    } else {
                        handlePostModif(req.params.id, postObject, res);
                    }
                } else {
                    handlePostModif(req.params.id, postObject, res);
                }
            } else {
                res.status(403).json({ error });
            }
        })
        .catch((error) => res.status(400).json({ error }));
};

exports.deletePost = (req, res, next) => {
    Post.findOne({ _id: req.params.id })
        .then((post) => {
            if (
                post.userId == req.auth.userId ||
                process.env.ADMIN_ACCOUNT_ID == req.auth.userId
            ) {
                if (post.imageUrl !== "") {
                    const originalname = post.imageUrl.split(
                        "/travel-app-bucket/"
                    )[1];
                    const file = gcFiles.file(originalname);
                    file.delete()
                        .then(() => {
                            handleDelePost(req, res);
                        })
                        .catch((error) => res.status(401).json({ error }));
                } else {
                    handleDelePost(req, res);
                }
            } else {
                res.status(403).json({ message: "Not authorized" });
            }
        })
        .catch((error) =>
            res.status(500).json({ message: "Je trouve pas le post.." })
        );
};

exports.getOnePost = (req, res, next) => {
    Post.findOne({ _id: req.params.id })
        .then((post) => {
            res.status(200).json(post);
        })
        .catch((error) => res.status(404).json({ error }));
};

exports.getAllPosts = (req, res, next) => {
    Post.find()
        .then((posts) => res.status(200).json(posts))
        .catch((error) => res.status(400).json({ error }));
};

exports.getPostsCountry = (req, res, next) => {
    Post.find({ country: req.params.country })
        .then((posts) => res.status(200).json(posts))
        .catch((error) => res.status(400).json({ error }));
};

exports.getPostsUser = (req, res, next) => {
    Post.find({ userId: req.params.userId })
        .then((posts) => res.status(200).json(posts))
        .catch((error) => res.status(400).json({ error }));
};

exports.ratingPost = (req, res, next) => {
    const object = req.body;
    if (object.like === 0) {
        Post.findOne({ _id: req.params.id })
            .then((post) => {
                if (post.usersLiked.includes(req.auth.userId)) {
                    handlePostRating(
                        req,
                        res,
                        "usersLiked",
                        "likes",
                        -1,
                        "$pull"
                    );
                }
                if (post.usersDisliked.includes(req.auth.userId)) {
                    handlePostRating(
                        req,
                        res,
                        "usersDisliked",
                        "dislikes",
                        -1,
                        "$pull"
                    );
                }
            })
            .catch((error) => res.status(400).json({ error }));
    } else if (object.like === 1) {
        handlePostRating(req, res, "usersLiked", "likes", 1, "$push");
    } else if (object.like === -1) {
        handlePostRating(req, res, "usersDisliked", "dislikes", 1, "$push");
    }
};
