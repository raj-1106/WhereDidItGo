"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
// Fail fast at boot instead of surfacing a cryptic error on the first request.
// A hardcoded credential used to live here as a fallback default; it was
// removed because it was committed to a public repo. Rotate that DB
// password in Atlas if you haven't already.
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set.');
    process.exit(1);
}
if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET is not set.');
    process.exit(1);
}
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => {
    console.log('✅ Connected to MongoDB');
    app_1.default.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
})
    .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
});
