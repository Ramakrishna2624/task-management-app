import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly cache = new Map<string, { data: WeatherData; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  constructor(private readonly configService: ConfigService) {}

  async getWeather(location: string): Promise<WeatherData> {
    if (!location || !location.trim()) {
      return {
        available: false,
        message: 'No location provided',
      };
    }

    const normalizedLocation = location.trim().toLowerCase();
    const now = Date.now();

    // Check memory cache
    const cached = this.cache.get(normalizedLocation);
    if (cached && cached.expiresAt > now) {
      this.logger.log(`[Weather Cache Hit] Serving cached weather for "${location}"`);
      return cached.data;
    }

    const apiKey = this.configService.get<string>('OPENWEATHER_API_KEY');

    // Fallback if API key is not configured
    if (!apiKey) {
      this.logger.warn(
        `OpenWeatherMap API key not configured. Serving mock weather for "${location}".`,
      );
      const fallbackData: WeatherData = {
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
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        location.trim(),
      )}&appid=${apiKey}&units=metric`;

      const response = await fetch(url);

      if (!response.ok) {
        this.logger.warn(
          `OpenWeatherMap API returned status ${response.status} for location "${location}"`,
        );
        const errorData: WeatherData = {
          available: false,
          location: location.trim(),
          message: `Weather data unavailable (${response.statusText})`,
        };
        return errorData;
      }

      const raw = await response.json();

      const parsedData: WeatherData = {
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

      // Save to cache
      this.cache.set(normalizedLocation, {
        data: parsedData,
        expiresAt: now + this.CACHE_TTL_MS,
      });

      return parsedData;
    } catch (err: any) {
      this.logger.error(
        `Failed to fetch weather from OpenWeatherMap for "${location}"`,
        err.message || err,
      );
      return {
        available: false,
        location: location.trim(),
        message: 'Weather service request failed',
      };
    }
  }
}
