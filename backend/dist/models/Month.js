"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Month = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ExpenseSchema = new mongoose_1.Schema({
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
        type: String,
        required: true,
        enum: [
            'Food & Dining',
            'Transportation',
            'Housing & Rent',
            'Utilities',
            'Entertainment',
            'Healthcare',
            'Shopping',
            'Education',
            'Savings & Investment',
            'Personal Care',
            'Other',
        ],
        default: 'Other',
    },
    date: { type: Date, required: true, default: Date.now },
});
const MonthSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    salary: { type: Number, required: true, min: 0 },
    salaryDate: { type: Number, default: 7, min: 1, max: 28 }, // day of month
    expenses: [ExpenseSchema],
}, { timestamps: true });
// Scoped per user now, not globally: two different accounts can both
// have a March 2026 entry. Was previously { year: 1, month: 1 } unique
// globally, which would break as soon as a second user existed.
MonthSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });
exports.Month = mongoose_1.default.model('Month', MonthSchema);
