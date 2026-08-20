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
var WeatherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let WeatherService = WeatherService_1 = class WeatherService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(WeatherService_1.name);
        this.cache = new Map();
        this.CACHE_TTL_MS = 10 * 60 * 1000;
    }
    async getWeather(location) {
        if (!location || !location.trim()) {
            return {
                available: false,
                message: 'No location provided',
            };
        }
        const normalizedLocation = location.trim().toLowerCase();
        const now = Date.now();
        const cached = this.cache.get(normalizedLocation);
        if (cached && cached.expiresAt > now) {
            this.logger.log(`[Weather Cache Hit] Serving cached weather for "${location}"`);
            return cached.data;
        }
        const apiKey = this.configService.get('OPENWEATHER_API_KEY');
        if (!apiKey) {
            this.logger.warn(`OpenWeatherMap API key not configured. Serving mock weather for "${location}".`);
            const fallbackData = {
                available: true,
                location: location.trim(),
                temp: 22,
                feelsLike: 21,
                condition: 'Clear',
                description: 'clear sky',
                icon: '01d',
                iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png',
                humidity: 55,
                windSpeed: 3.5,
            };
            this.cache.set(normalizedLocation, {
                data: fallbackData,
                expiresAt: now + this.CACHE_TTL_MS,
            });
            return fallbackData;
        }
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location.trim())}&appid=${apiKey}&units=metric`;
            const response = await fetch(url);
            if (!response.ok) {
                this.logger.warn(`OpenWeatherMap API returned status ${response.status} for location "${location}"`);
                const errorData = {
                    available: false,
                    location: location.trim(),
                    message: `Weather data unavailable (${response.statusText})`,
                };
                return errorData;
            }
            const raw = await response.json();
            const parsedData = {
                available: true,
                location: raw.name || location.trim(),
                temp: Math.round(raw.main.temp),
                feelsLike: Math.round(raw.main.feels_like),
                condition: raw.weather?.[0]?.main || 'Unknown',
                description: raw.weather?.[0]?.description || '',
                icon: raw.weather?.[0]?.icon || '01d',
                iconUrl: `https://openweathermap.org/img/wn/${raw.weather?.[0]?.icon || '01d'}@2x.png`,
                humidity: raw.main.humidity,
                windSpeed: raw.wind?.speed,
            };
            this.cache.set(normalizedLocation, {
                data: parsedData,
                expiresAt: now + this.CACHE_TTL_MS,
            });
            return parsedData;
        }
        catch (err) {
            this.logger.error(`Failed to fetch weather from OpenWeatherMap for "${location}"`, err.message || err);
            return {
                available: false,
                location: location.trim(),
                message: 'Weather service request failed',
            };
        }
    }
};
exports.WeatherService = WeatherService;
exports.WeatherService = WeatherService = WeatherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WeatherService);
//# sourceMappingURL=weather.service.js.map