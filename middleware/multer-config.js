// const multer = require("multer");

// const MIME_TYPES = {
//     "image/jpg": "jpg",
//     "image/jpeg": "jpg",
//     "image/png": "png",
// };

// const storage = multer.diskStorage({
//     destination: (req, file, callback) => {
//         callback(null, "images");
//     },
//     filename: (req, file, callback) => {
//         const name = file.originalname.split(" ").join("_");
//         const extension = MIME_TYPES[file.mimetype];
//         const nameWithoutExtension = name.split(".")[0];
//         callback(null, nameWithoutExtension + Date.now() + "." + extension);
//     },
// });
// console.log("multer: " + storage);

// module.exports = multer({ storage }).any("file");

const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const path = require("path");

const MIME_TYPES = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png",
};

const googleCloud = new Storage({
    keyFilename: path.join(
        __dirname,
        "./positive-nuance-384615-ccbb6d20f605.json"
    ),
    projectId: "positive-nuance-384615",
});

const gcFiles = googleCloud.bucket("travel-app-bucket");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (MIME_TYPES[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type."), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
});

const uploadMiddleware = upload.any("file");

const uploadToGCS = (file) => {
    const blob = gcFiles.file(file.originalname);
    const stream = blob.createWriteStream({
        metadata: {
            contentType: file.mimetype,
        },
    });
    stream.on("error", (err) => {
        console.error(`Error uploading file ${file.originalname}:`, err);
    });
    stream.on("finish", () => {
        console.log(`File ${file.originalname} uploaded.`);
        // Supprimez le fichier une fois qu'il a été téléchargé
        fs.unlink(file.path, (err) => {
            if (err) {
                console.error(err);
            }
        });
    });
    stream.end(file.buffer);
};

module.exports = (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        req.files.forEach((file) => {
            uploadToGCS(file);
        });
        next();
    });
};
