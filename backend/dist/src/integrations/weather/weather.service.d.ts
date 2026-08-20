import { ConfigService } from '@nestjs/config';
export interface WeatherData {
    available: boolean;
    location?: string;
    temp?: number;
    feelsLike?: number;
    condition?: string;
    description?: string;
    icon?: string;
    iconUrl?: string;
    humidity?: number;
    windSpeed?: number;
    message?: string;
}
export declare class WeatherService {
    private readonly configService;
    private readonly logger;
    private readonly cache;
    private readonly CACHE_TTL_MS;
    constructor(configService: ConfigService);
    getWeather(location: string): Promise<WeatherData>;
}
