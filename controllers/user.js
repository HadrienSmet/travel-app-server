require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const UserModel = require("../models/User");

//Handles what happens when the user submits the sign up form
//Starts by hashing the password --> 10 times
// --> Warning: bcrypt.hash is async function
//If hash succes: -create a new Object to post to the database with the password hashed
exports.signup = (req, res, next) => {
    bcrypt
        .hash(req.body.password, 10)
        .then((hash) => {
            const user = new UserModel({
                email: req.body.email,
                password: hash,
                pseudo: req.body.pseudo,
                description: req.body.description,
                dreamTrips: req.body.dreamTrips,
                previousTrips: req.body.previousTrips,
                userData: {
                    firstName: req.body.userData.firstName,
                    lastName: req.body.userData.lastName,
                    age: req.body.userData.age,
                    gender: req.body.userData.gender,
                    country: req.body.userData.country,
                },
            });
            user.save()
                .then(() => {
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            process.env.ACCESS_TOKEN_SECRET,
                            { expiresIn: "24h" }
                        ),
                    });
                })
                .catch((error) => res.status(400).json({ error }));
        })
        .catch((error) => res.status(500).json({ error }));
};

//This function handles the uploading of the profile picture inside the data base and inside the API
//It starts by taking the file in the request in order to put it into a variable with the appropriate name
//Then we start searching in the data base for a user whose id matches with the one from the request url
//If the user is found we take care to be sure about the authentification by comparing the user's id and the one from the auth middleware
//If everything is ok we can set the new key a the root of the user object
exports.uploadUserPictures = (req, res, next) => {
    UserModel.findOne({ _id: req.params.id })
        .then((user) => {
            if (user._id != req.auth.userId) {
                res.status(403).json({ error });
            } else {
                let urlProfilePicture = `${req.protocol}://${req.get(
                    "host"
                )}/images/${req.files[0].filename}`;
                let urlsAlbumPictures = [];
                for (let i = 1; i < req.files.length; i++) {
                    urlsAlbumPictures.push(
                        `${req.protocol}://${req.get("host")}/images/${
                            req.files[i].filename
                        }`
                    );
                }
                UserModel.updateOne(
                    { _id: req.auth.userId },
                    {
                        $set: {
                            profilePicture: urlProfilePicture,
                            albums: [
                                {
                                    name: req.body.albumName,
                                    pictures: urlsAlbumPictures,
                                },
                            ],
                        },
                    }
                )
                    .then(() => {
                        res.status(200).json({
                            email: user.email,
                            profilePicture: urlProfilePicture,
                            pseudo: user.pseudo,
                            country: user.userData.country,
                            firstName: user.userData.firstName,
                            lastName: user.userData.lastName,
                            age: user.userData.age,
                            gender: user.userData.gender,
                            description: user.description,
                            dreamTrips: user.dreamTrips,
                            previousTrips: user.previousTrips,
                            following: user.following,
                            followers: user.followers,
                            albums: [
                                {
                                    name: req.body.albumName,
                                    pictures: urlsAlbumPictures,
                                },
                            ],
                        });
                    })
                    .catch((error) => res.status(401).json({ error }));
            }
        })
        .catch((error) => res.status(402).json({ error }));
};

//Handles what happens when the user submits the sign in form
//Starts by searching an email in the data matching whit one provided by the user
//Error if the mailadress can't be found
//If not we compare the password provided by the user with the one in the database
//Warning --> bcrypt.compare is async function
//If passwords match: provides an authorisation token to the user
exports.login = (req, res, next) => {
    UserModel.findOne({ email: req.body.email })
        .then((user) => {
            if (!user) {
                return res
                    .status(401)
                    .json({
                        message:
                            "Cet email n'est pas présent dans notre base de donnée",
                    });
            }
            bcrypt
                .compare(req.body.password, user.password)
                .then((valid) => {
                    if (!valid) {
                        return res
                            .status(401)
                            .json({
                                message: "Paire login/mot de passe incorrecte",
                            });
                    }
                    res.status(200).json({
                        email: user.email,
                        profilePicture: user.profilePicture,
                        coverPicture: user.coverPicture,
                        pseudo: user.pseudo,
                        country: user.userData.country,
                        firstName: user.userData.firstName,
                        lastName: user.userData.lastName,
                        age: user.userData.age,
                        gender: user.userData.gender,
                        description: user.description,
                        dreamTrips: user.dreamTrips,
                        previousTrips: user.previousTrips,
                        albums: user.albums,
                        following: user.following,
                        followers: user.followers,
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            process.env.ACCESS_TOKEN_SECRET,
                            { expiresIn: "24h" }
                        ),
                    });
                })
                .catch((error) => res.status(500).json({ error }));
        })
        .catch((error) => res.status(500).json({ error }));
};

exports.uploadAlbum = (req, res, next) => {
    UserModel.findOne({ _id: req.params.userId })
        .then((user) => {
            if (user._id != req.auth.userId) {
                return res
                    .status(401)
                    .json({ message: "Requête non-autorisée" });
            } else {
                let urlsAlbumPictures = [];
                for (let i = 0; i < req.files.length; i++) {
                    urlsAlbumPictures.push(
                        `${req.protocol}://${req.get("host")}/images/${
                            req.files[i].filename
                        }`
                    );
                }
                let album = {
                    name: req.body.name,
                    pictures: urlsAlbumPictures,
                };
                UserModel.updateOne(
                    { _id: req.auth.userId },
                    { $push: { albums: album } }
                )
                    .then((updatedUser) =>
                        res.status(201).json({
                            message: "Album sauvegardé dans la base de donnée!",
                            newAlbum: album,
                        })
                    )
                    .catch((error) =>
                        res
                            .status(400)
                            .json({
                                message:
                                    "Quelque chose a planté durant la modification..",
                            })
                    );
            }
        })
        .catch((error) =>
            res
                .status(400)
                .json({
                    message: "On ne trouve pas d'utilisateur possédant cet id",
                })
        );
};

exports.addNewTrip = (req, res, next) => {
    UserModel.findOne({ _id: req.params.userId })
        .then((user) => {
            if (user._id != req.auth.userId) {
                return res
                    .status(401)
                    .json({ message: "Requête non-autorisée" });
            } else {
                let trip = { ...req.body };
                UserModel.updateOne(
                    { _id: req.auth.userId },
                    { $push: { previousTrips: trip } }
                )
                    .then((updatedUser) =>
                        res.status(201).json({
                            message:
                                "Voyage sauvegardé dans la base de donnée!",
                            newTrip: trip,
                        })
                    )
                    .catch((error) =>
                        res
                            .status(400)
                            .json({
                                message:
                                    "Quelque chose a planté durant la modification..",
                            })
                    );
            }
        })
        .catch((error) =>
            res
                .status(400)
                .json({
                    message: "On ne trouve pas d'utilisateur possédant cet id",
                })
        );
};

exports.getProfile = (req, res, next) => {
    UserModel.findOne({ pseudo: req.params.pseudo }, (error, data) => {
        if (error) {
            res.status(404).json({ error });
        } else {
            return res.status(200).json(data);
        }
    });
};

exports.followUser = (req, res, next) => {
    UserModel.findOne({ _id: req.params.id })
        .then((user) => {
            if (user._id != req.auth.userId) {
                return res
                    .status(401)
                    .json({ message: "Requête non-autorisée" });
            } else {
                UserModel.updateOne(
                    { _id: req.auth.userId },
                    { $push: { following: req.body.pseudo } }
                )
                    .then((userModified) =>
                        res
                            .status(201)
                            .json({
                                message:
                                    "Vous suivez maintenant cet utilisateur",
                            })
                    )
                    .catch((err) =>
                        res
                            .status(500)
                            .json({
                                message:
                                    "Notre serveur ne souhaite pas que vous vous socialisez",
                            })
                    );
            }
        })
        .catch((err) =>
            res
                .status(404)
                .json({
                    message:
                        "Nous ne retrouvons pas cet utilisateur dans notre base de données",
                })
        );
};

exports.unfollowUser = (req, res, next) => {
    UserModel.findOne({ _id: req.params.id })
        .then((user) => {
            if (user._id != req.auth.userId) {
                return res
                    .status(401)
                    .json({ message: "Requête non-autorisée" });
            } else {
                UserModel.updateOne(
                    { _id: req.auth.userId },
                    { $pull: { following: req.body.pseudo } }
                )
                    .then((userModified) =>
                        res
                            .status(201)
                            .json({
                                message: "Vous ne suivez plus cet utilisateur",
                            })
                    )
                    .catch((err) =>
                        res
                            .status(500)
                            .json({
                                message:
                                    "Notre serveur souhaite que vous vous socialisez un peu plus...",
                            })
                    );
            }
        })
        .catch((err) =>
            res
                .status(404)
                .json({
                    message:
                        "Nous ne retrouvons pas cet utilisateur dans notre base de données",
                })
        );
};

exports.newFollower = (req, res, next) => {
    UserModel.findOne({ _id: req.params.id })
        .then((user) => {
            UserModel.updateOne(
                { _id: req.params.id },
                { $push: { followers: req.body.pseudo } }
            )
                .then((userModified) =>
                    res
                        .status(201)
                        .json({
                            message: "Un utilisateur a commencé à vous suivre!",
                        })
                )
                .catch((err) =>
                    res
                        .status(500)
                        .json({
                            message:
                                "Notre serveur ne souhaite pas que la popularité vous monte à la tête",
                        })
                );
        })
        .catch((err) =>
            res
                .status(404)
                .json({
                    message:
                        "Nous ne retrouvons pas cet utilisateur dans notre base de données",
                })
        );
};

exports.lostFollower = (req, res, next) => {
    UserModel.findOne({ _id: req.params.id })
        .then((user) => {
            UserModel.updateOne(
                { _id: req.params.id },
                { $pull: { followers: req.body.pseudo } }
            )
                .then((userModified) =>
                    res
                        .status(201)
                        .json({
                            message: "Un utilisateur a arrêté à vous suivre!",
                        })
                )
                .catch((err) =>
                    res
                        .status(500)
                        .json({
                            message:
                                "Notre serveur ne souhaite pas voir votre popularité défaillir",
                        })
                );
        })
        .catch((err) =>
            res
                .status(404)
                .json({
                    message:
                        "Nous ne retrouvons pas cet utilisateur dans notre base de données",
                })
        );
};

exports.checkMail = (req, res, next) => {
    UserModel.findOne({ email: req.params.email })
        .then((user) => res.status(200).json(user))
        .catch((err) =>
            res
                .status(400)
                .json({
                    message:
                        "Cette adresse email n'est pas encore présente dans la base donnée",
                })
        );
};

exports.checkPseudo = (req, res, next) => {
    UserModel.findOne({ pseudo: req.params.pseudo })
        .then((user) => res.status(200).json(user))
        .catch((err) =>
            res
                .status(400)
                .json({
                    message:
                        "Ce pseudo n'est pas encore présent dans la base donnée",
                })
        );
};

exports.setCoverPicture = (req, res, next) => {
    UserModel.findOne({ _id: req.params.id })
        .then((user) => {
            if (user._id != req.auth.userId) {
                return res
                    .status(401)
                    .json({ message: "Requête non-autorisée" });
            } else {
                if (
                    user.coverPicture === undefined ||
                    user.coverPicture === null
                ) {
                    let urlCoverPicture = `${req.protocol}://${req.get(
                        "host"
                    )}/images/${req.files[0].filename}`;
                    UserModel.updateOne(
                        { _id: req.params.id },
                        { $set: { coverPicture: urlCoverPicture } }
                    )
                        .then((userModified) =>
                            res.status(201).json({
                                message: "Photo de couverture mise à jour!",
                                coverPicture: urlCoverPicture,
                            })
                        )
                        .catch((err) =>
                            res
                                .status(400)
                                .json({
                                    message:
                                        "Mauvaise requete l'update a mal tourné",
                                })
                        );
                } else {
                    const filename = user.coverPicture.split("/images/")[1];
                    fs.unlink(`images/${filename}`, () => {
                        let urlCoverPicture = `${req.protocol}://${req.get(
                            "host"
                        )}/images/${req.files[0].filename}`;
                        UserModel.updateOne(
                            { _id: req.params.id },
                            { $set: { coverPicture: urlCoverPicture } }
                        )
                            .then(() =>
                                res.status(201).json({
                                    message: "Photo de couverture mise à jour!",
                                    coverPicture: urlCoverPicture,
                                })
                            )
                            .catch((err) =>
                                res
                                    .status(400)
                                    .json({
                                        message:
                                            "Mauvaise requete l'update a mal tourné",
                                    })
                            );
                    });
                }
            }
        })
        .catch((err) =>
            res
                .status(404)
                .json({
                    message:
                        "Notre serveur ne trouve aucun utilisateur possédant cet id",
                })
        );
};
