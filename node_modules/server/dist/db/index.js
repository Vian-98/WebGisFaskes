"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
const pg_1 = require("pg");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.pool = new pg_1.Pool({
    connectionString: process.env.NODE_ENV === "test"
        ? process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
        : process.env.DATABASE_URL,
});
exports.db = (0, node_postgres_1.drizzle)(exports.pool);
