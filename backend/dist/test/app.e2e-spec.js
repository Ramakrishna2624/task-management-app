"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const supertest_1 = require("supertest");
const app_module_1 = require("./../src/app.module");
jest.setTimeout(30000);
describe('AppController (e2e)', () => {
    let app;
    beforeEach(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });
    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });
    it('/api/auth/login (POST) - validation failure without body', () => {
        return (0, supertest_1.default)(app.getHttpServer())
            .post('/api/auth/login')
            .expect(400);
    });
});
//# sourceMappingURL=app.e2e-spec.js.map