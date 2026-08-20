"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const weather_service_1 = require("./weather.service");
describe('WeatherService', () => {
    let service;
    let configService;
    beforeEach(async () => {
        const mockConfigService = {
            get: jest.fn().mockImplementation((key) => {
                if (key === 'OPENWEATHER_API_KEY')
                    return 'test_api_key_123';
                return null;
            }),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                weather_service_1.WeatherService,
                { provide: config_1.ConfigService, useValue: mockConfigService },
            ],
        }).compile();
        service = module.get(weather_service_1.WeatherService);
        configService = module.get(config_1.ConfigService);
    });
    describe('getWeather', () => {
        it('should return available: false if location is missing or empty', async () => {
            const result = await service.getWeather('');
            expect(result).toEqual({
                available: false,
                message: 'No location provided',
            });
        });
        it('should fetch weather details from OpenWeatherMap API and cache result', async () => {
            const mockOpenWeatherResponse = {
                name: 'San Francisco',
                main: {
                    temp: 18.6,
                    feels_like: 18.2,
                    humidity: 70,
                },
                weather: [
                    {
                        main: 'Clear',
                        description: 'clear sky',
                        icon: '01d',
                    },
                ],
                wind: {
                    speed: 4.5,
                },
            };
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockOpenWeatherResponse),
            });
            const result1 = await service.getWeather('San Francisco');
            expect(result1).toEqual({
                available: true,
                location: 'San Francisco',
                temp: 19,
                feelsLike: 18,
                condition: 'Clear',
                description: 'clear sky',
                icon: '01d',
                iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png',
                humidity: 70,
                windSpeed: 4.5,
            });
            expect(global.fetch).toHaveBeenCalledTimes(1);
            const result2 = await service.getWeather('San Francisco');
            expect(result2).toEqual(result1);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
        it('should handle OpenWeatherMap API errors gracefully without throwing exceptions', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
            });
            const result = await service.getWeather('UnknownCity12345');
            expect(result.available).toBe(false);
            expect(result.message).toContain('unavailable');
        });
        it('should return simulated fallback weather when API key is missing', async () => {
            configService.get.mockReturnValue(null);
            const result = await service.getWeather('Seattle');
            expect(result.available).toBe(true);
            expect(result.location).toBe('Seattle');
        });
    });
});
//# sourceMappingURL=weather.service.spec.js.map