import multer from "multer";
import storage from "../lib/cloudinary.js";

const upload = multer({ storage });

export default upload;
