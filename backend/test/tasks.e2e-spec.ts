import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

jest.setTimeout(30000);

describe('Task Management API (e2e)', () => {
  let app: INestApplication;
  let userAToken: string;
  let userBToken: string;
  let userATaskId: string;

  const userA = {
    name: 'User Alpha',
    email: `alpha_query_${Date.now()}@example.com`,
    password: 'password123',
  };

  const userB = {
    name: 'User Beta',
    email: `beta_query_${Date.now()}@example.com`,
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    // Register User A
    const resA = await (request(app.getHttpServer()) as any)
      .post('/api/auth/register')
      .send(userA);
    userAToken = resA.body.data.accessToken;

    // Register User B
    const resB = await (request(app.getHttpServer()) as any)
      .post('/api/auth/register')
      .send(userB);
    userBToken = resB.body.data.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/tasks (Create Task)', () => {
    it('1. should create task for User A including due date and location', async () => {
      const payload = {
        title: 'User A Task 1',
        description: 'First paginated task',
        status: 'PENDING',
        priority: 'HIGH',
        dueDate: '2026-10-15T00:00:00.000Z',
        location: 'HQ Office',
      };

      const res = await (request(app.getHttpServer()) as any)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(payload)
        .expect(201);

      expect(res.body).toHaveProperty('data');
      const task = res.body.data;
      expect(task.title).toBe(payload.title);
      userATaskId = task.id;
    });

    it('2. should create second task for User A with status DONE', async () => {
      const payload = {
        title: 'User A Task 2',
        description: 'Second task done',
        status: 'DONE',
        priority: 'LOW',
        dueDate: '2026-11-20T00:00:00.000Z',
      };

      await (request(app.getHttpServer()) as any)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(payload)
        .expect(201);
    });
  });

  describe('GET /api/tasks (Paginated & Filtered Query API)', () => {
    it('3. should return paginated response with data array and meta object', async () => {
      const res = await (request(app.getHttpServer()) as any)
        .get('/api/tasks?page=1&limit=10')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page', 1);
      expect(res.body.meta).toHaveProperty('limit', 10);
      expect(res.body.meta).toHaveProperty('totalPages');
      expect(res.body.data.length).toBe(2);
    });

    it('4. should filter tasks by status (status=DONE)', async () => {
      const res = await (request(app.getHttpServer()) as any)
        .get('/api/tasks?status=DONE')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('DONE');
    });

    it('5. should filter tasks by due-date range', async () => {
      const res = await (request(app.getHttpServer()) as any)
        .get('/api/tasks?startDate=2026-10-01T00:00:00.000Z&endDate=2026-10-31T23:59:59.999Z')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('User A Task 1');
    });

    it('6. should reject query if startDate is after endDate with 400 Bad Request', async () => {
      await (request(app.getHttpServer()) as any)
        .get('/api/tasks?startDate=2026-12-01T00:00:00.000Z&endDate=2026-08-01T00:00:00.000Z')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(400);
    });

    it('7. should enforce data isolation: User B receives total=0 in metadata', async () => {
      const res = await (request(app.getHttpServer()) as any)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(0);
      expect(res.body.meta.total).toBe(0);
    });
  });
});
