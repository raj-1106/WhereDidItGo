"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
const app_1 = __importDefault(require("../app"));
const testDb_1 = require("./testDb");
beforeAll(testDb_1.connectTestDb);
afterEach(testDb_1.clearTestDb);
afterAll(testDb_1.disconnectTestDb);
async function registerAndLogin(email) {
    const res = await (0, supertest_1.default)(app_1.default)
        .post('/api/auth/register')
        .send({ email, password: 'correct-horse' });
    return res.body.token;
}
describe('month data isolation between accounts', () => {
    it('failure case: an unauthenticated request is rejected before touching the DB', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/months');
        expect(res.status).toBe(401);
    });
    it('main case: two different users can each save salary for the same year/month', async () => {
        const tokenA = await registerAndLogin('alice@example.com');
        const tokenB = await registerAndLogin('bob@example.com');
        const resA = await (0, supertest_1.default)(app_1.default)
            .post('/api/months')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ year: 2026, month: 8, salary: 50000 });
        const resB = await (0, supertest_1.default)(app_1.default)
            .post('/api/months')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ year: 2026, month: 8, salary: 90000 });
        // This is the case that would have thrown a duplicate-key error against
        // the old { year, month } global unique index.
        expect(resA.status).toBe(201);
        expect(resB.status).toBe(201);
        expect(resA.body.salary).toBe(50000);
        expect(resB.body.salary).toBe(90000);
    });
    it("failure case: user B cannot read user A's month by guessing year/month", async () => {
        const tokenA = await registerAndLogin('alice@example.com');
        const tokenB = await registerAndLogin('bob@example.com');
        await (0, supertest_1.default)(app_1.default)
            .post('/api/months')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ year: 2026, month: 8, salary: 50000 });
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/months/2026/8')
            .set('Authorization', `Bearer ${tokenB}`);
        // Should look like "doesn't exist" to Bob, not leak Alice's salary.
        expect(res.status).toBe(404);
    });
    it("edge case: user A's month list never includes user B's months", async () => {
        const tokenA = await registerAndLogin('alice@example.com');
        const tokenB = await registerAndLogin('bob@example.com');
        await (0, supertest_1.default)(app_1.default)
            .post('/api/months')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ year: 2026, month: 1, salary: 10000 });
        await (0, supertest_1.default)(app_1.default)
            .post('/api/months')
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ year: 2026, month: 2, salary: 20000 });
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/months')
            .set('Authorization', `Bearer ${tokenA}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].month).toBe(1);
    });
});
