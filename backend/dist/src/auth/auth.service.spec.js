"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const auth_service_1 = require("./auth.service");
const users_service_1 = require("../users/users.service");
describe('AuthService', () => {
    let authService;
    let usersService;
    let jwtService;
    const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        password: '$2a$10$hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    beforeEach(async () => {
        const mockUsersService = {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findByEmailWithPassword: jest.fn(),
            findById: jest.fn(),
        };
        const mockJwtService = {
            sign: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: users_service_1.UsersService, useValue: mockUsersService },
                { provide: jwt_1.JwtService, useValue: mockJwtService },
            ],
        }).compile();
        authService = module.get(auth_service_1.AuthService);
        usersService = module.get(users_service_1.UsersService);
        jwtService = module.get(jwt_1.JwtService);
    });
    describe('register', () => {
        it('should successfully register a user and return access token + user info', async () => {
            usersService.create.mockResolvedValue(mockUser);
            jwtService.sign.mockReturnValue('mock_jwt_token');
            const result = await authService.register({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
            });
            expect(usersService.create).toHaveBeenCalled();
            expect(jwtService.sign).toHaveBeenCalledWith({
                sub: 'user123',
                email: 'john@example.com',
            });
            expect(result).toEqual({
                accessToken: 'mock_jwt_token',
                user: {
                    id: 'user123',
                    name: 'John Doe',
                    email: 'john@example.com',
                    createdAt: mockUser.createdAt,
                    updatedAt: mockUser.updatedAt,
                },
            });
            expect(result.user).not.toHaveProperty('password');
        });
        it('should throw ConflictException on duplicate email registration', async () => {
            usersService.create.mockRejectedValue(new common_1.ConflictException('Email already registered'));
            await expect(authService.register({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
            })).rejects.toThrow(common_1.ConflictException);
        });
    });
    describe('login', () => {
        it('should successfully authenticate user with valid credentials', async () => {
            const hashedPassword = await bcrypt.hash('password123', 10);
            const userWithValidHash = { ...mockUser, password: hashedPassword };
            usersService.findByEmailWithPassword.mockResolvedValue(userWithValidHash);
            jwtService.sign.mockReturnValue('mock_jwt_token');
            const result = await authService.login({
                email: 'john@example.com',
                password: 'password123',
            });
            expect(result).toEqual({
                accessToken: 'mock_jwt_token',
                user: {
                    id: 'user123',
                    name: 'John Doe',
                    email: 'john@example.com',
                    createdAt: mockUser.createdAt,
                    updatedAt: mockUser.updatedAt,
                },
            });
            expect(result.user).not.toHaveProperty('password');
        });
        it('should throw UnauthorizedException if user email is not found', async () => {
            usersService.findByEmailWithPassword.mockResolvedValue(null);
            await expect(authService.login({
                email: 'nonexistent@example.com',
                password: 'password123',
            })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should throw UnauthorizedException if password does not match', async () => {
            const hashedPassword = await bcrypt.hash('correctpassword', 10);
            const userWithHash = { ...mockUser, password: hashedPassword };
            usersService.findByEmailWithPassword.mockResolvedValue(userWithHash);
            await expect(authService.login({
                email: 'john@example.com',
                password: 'wrongpassword',
            })).rejects.toThrow(common_1.UnauthorizedException);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map