"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const supertest_1 = require("supertest");
const app_module_1 = require("../src/app.module");
jest.setTimeout(30000);
describe('Auth System (e2e)', () => {
    let app;
    let registeredToken;
    const testUser = {
        name: 'Test E2E User',
        email: `e2e_${Date.now()}@example.com`,
        password: 'password123',
    };
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }));
        await app.init();
    });
    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });
    describe('POST /api/auth/register', () => {
        it('1. should successfully register a new user and return JWT + user profile', async () => {
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);
            expect(response.body).toHaveProperty('data');
            const data = response.body.data;
            expect(data).toHaveProperty('accessToken');
            expect(data).toHaveProperty('user');
            expect(data.user.email).toBe(testUser.email.toLowerCase());
            expect(data.user).not.toHaveProperty('password');
            registeredToken = data.accessToken;
        });
        it('2. should reject registration with a duplicate email with 409 Conflict', async () => {
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .post('/api/auth/register')
                .send(testUser)
                .expect(409);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('already registered');
        });
    });
    describe('POST /api/auth/login', () => {
        it('3. should successfully log in with valid credentials', async () => {
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            })
                .expect(201);
            expect(response.body).toHaveProperty('data');
            const data = response.body.data;
            expect(data).toHaveProperty('accessToken');
            expect(data.user.email).toBe(testUser.email.toLowerCase());
            expect(data.user).not.toHaveProperty('password');
        });
        it('4. should reject login with invalid credentials with 401 Unauthorized', async () => {
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                email: testUser.email,
                password: 'wrong_password_123',
            })
                .expect(401);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Invalid email or password');
        });
    });
    describe('GET /api/auth/profile (Protected Route)', () => {
        it('5. should reject access to protected route without Bearer token with 401 Unauthorized', async () => {
            await (0, supertest_1.default)(app.getHttpServer())
                .get('/api/auth/profile')
                .expect(401);
        });
        it('6. should reject access to protected route with invalid token with 401 Unauthorized', async () => {
            await (0, supertest_1.default)(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid_malformed_token')
                .expect(401);
        });
        it('7. should grant access to protected route with valid Bearer token', async () => {
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${registeredToken}`)
                .expect(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('email', testUser.email.toLowerCase());
        });
    });
});
//# sourceMappingURL=auth.e2e-spec.js.map