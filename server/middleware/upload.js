const multer  = require('multer');
const path    = require('path');
const createError = require('http-errors');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        // prefix with timestamp so filenames never collide
        const ext      = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext).replace(/\s+/g, '-');
        cb(null, `${Date.now()}-${basename}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk   = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk  = allowed.test(file.mimetype);

    if (extOk && mimeOk) {
        cb(null, true);
    } else {
        cb(createError(400, 'Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
});

module.exports = upload;
