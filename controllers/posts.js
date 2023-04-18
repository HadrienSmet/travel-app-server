const Post = require("../models/Post");
const fs = require("fs");
const { log } = require("console");

//Creates a new post : --> Gets the data from the request
//Deletes id and user id for security reasons
//Creates a new object before sending it to the data base
exports.createPost = (req, res, next) => {
    const postObject = JSON.stringify(req.body);
    let url;
    if (req.files[0] === undefined) {
        url = "";
    } else {
        url = `${req.protocol}://${req.get("host")}/images/${
            req.files[0].filename
        }`;
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
    let postObject;
    if (req.body.file == "") {
        postObject = {
            ...req.body,
            imageUrl: "",
        };
    } else if (req.file) {
        postObject = {
            ...req.body,
            imageUrl: `${req.protocol}://${req.get("host")}/images/${
                req.file.filename
            }`,
        };
    } else if (req.files) {
        postObject = {
            ...req.body,
            imageUrl: `${req.protocol}://${req.get("host")}/images/${
                req.files[0].filename
            }`,
        };
    } else {
        postObject = { ...req.body };
    }
    delete postObject._userId;
    Post.findOne({ _id: req.params.id })
        .then((post) => {
            if (
                post.userId == req.auth.userId ||
                process.env.ADMIN_ACCOUNT_ID == req.auth.userId
            ) {
                const filename = post.imageUrl.split("/images/")[1];
                if (req.files) {
                    fs.unlink(`images/${filename}`, () => {
                        Post.updateOne(
                            { _id: req.params.id },
                            { ...postObject, id: req.params.id }
                        )
                            .then(() =>
                                res
                                    .status(200)
                                    .json({ message: "Post modifié!" })
                            )
                            .catch((error) => res.status(401).json({ error }));
                    });
                } else {
                    Post.updateOne(
                        { _id: req.params.id },
                        { ...postObject, id: req.params.id }
                    )
                        .then(() =>
                            res.status(200).json({ message: "Post modifié!" })
                        )
                        .catch((error) => res.status(401).json({ error }));
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
                const filename = post.imageUrl.split("/images/")[1];
                fs.unlink(`images/${filename}`, () => {
                    Post.deleteOne({ _id: req.params.id })
                        .then(() =>
                            res.status(200).json({ message: "Post supprimé !" })
                        )
                        .catch((error) => res.status(401).json({ error }));
                });
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
    const ratingHandler = () => {
        if (object.like === 0) {
            Post.findOne({ _id: req.params.id })
                .then((post) => {
                    if (post.usersLiked.includes(req.auth.userId)) {
                        Post.updateOne(
                            { _id: req.params.id },
                            {
                                $pull: { usersLiked: req.auth.userId },
                                $inc: { likes: -1 },
                            }
                        )
                            .then((newPost) => res.status(200).json(newPost))
                            .catch((error) => res.status(400).json({ error }));
                    }
                    if (post.usersDisliked.includes(req.auth.userId)) {
                        Post.updateOne(
                            { _id: req.params.id },
                            {
                                $pull: { usersDisliked: req.auth.userId },
                                $inc: { dislikes: -1 },
                            }
                        )
                            .then((newPost) => res.status(200).json(newPost))
                            .catch((error) => res.status(400).json({ error }));
                    }
                })
                .catch((error) => res.status(400).json({ error }));
        } else if (object.like === 1) {
            Post.updateOne(
                { _id: req.params.id },
                { $push: { usersLiked: req.auth.userId }, $inc: { likes: 1 } }
            )
                .then((post) => res.status(200).json(post))
                .catch((error) => res.status(400).json({ error }));
        } else if (object.like === -1) {
            Post.updateOne(
                { _id: req.params.id },
                {
                    $push: { usersDisliked: req.auth.userId },
                    $inc: { dislikes: 1 },
                }
            )
                .then((post) => res.status(200).json(post))
                .catch((error) => res.status(400).json({ error }));
        }
    };
    ratingHandler();
};
