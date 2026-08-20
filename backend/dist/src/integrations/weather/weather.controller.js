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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherController = void 0;
const common_1 = require("@nestjs/common");
const weather_service_1 = require("./weather.service");
const tasks_service_1 = require("../../tasks/tasks.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let WeatherController = class WeatherController {
    constructor(weatherService, tasksService) {
        this.weatherService = weatherService;
        this.tasksService = tasksService;
    }
    async getTaskWeather(userId, id) {
        const task = await this.tasksService.findOne(userId, id);
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        if (!task.location) {
            return {
                available: false,
                message: 'Task has no location specified',
            };
        }
        return this.weatherService.getWeather(task.location);
    }
};
exports.WeatherController = WeatherController;
__decorate([
    (0, common_1.Get)(':id/weather'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WeatherController.prototype, "getTaskWeather", null);
exports.WeatherController = WeatherController = __decorate([
    (0, common_1.Controller)('tasks'),
    __metadata("design:paramtypes", [weather_service_1.WeatherService,
        tasks_service_1.TasksService])
], WeatherController);
//# sourceMappingURL=weather.controller.js.map