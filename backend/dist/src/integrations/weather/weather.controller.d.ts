import { WeatherService, WeatherData } from './weather.service';
import { TasksService } from '../../tasks/tasks.service';
export declare class WeatherController {
    private readonly weatherService;
    private readonly tasksService;
    constructor(weatherService: WeatherService, tasksService: TasksService);
    getTaskWeather(userId: string, id: string): Promise<WeatherData>;
}
