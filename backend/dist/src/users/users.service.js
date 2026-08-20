"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schemas/user.schema");
let UsersService = UsersService_1 = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async create(userData) {
        const normalizedEmail = userData.email.toLowerCase().trim();
        const existing = await this.userModel.findOne({ email: normalizedEmail }).exec();
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
        }
        const user = new this.userModel({
            name: userData.name.trim(),
            email: normalizedEmail,
            password: userData.password,
        });
        return user.save();
    }
    async findByEmail(email) {
        const normalizedEmail = email.toLowerCase().trim();
        return this.userModel.findOne({ email: normalizedEmail }).exec();
    }
    async findByEmailWithPassword(email) {
        const normalizedEmail = email.toLowerCase().trim();
        return this.userModel
            .findOne({ email: normalizedEmail })
            .select('+password')
            .exec();
    }
    async findById(id) {
        try {
            return await this.userModel.findById(id).exec();
        }
        catch {
            return null;
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map