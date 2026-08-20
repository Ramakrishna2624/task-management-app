import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { WeatherService, WeatherData } from './weather.service';
import { TasksService } from '../../tasks/tasks.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('tasks')
export class WeatherController {
  constructor(
    private readonly weatherService: WeatherService,
    private readonly tasksService: TasksService,
  ) {}

  @Get(':id/weather')
  async getTaskWeather(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ): Promise<WeatherData> {
    const task = await this.tasksService.findOne(userId, id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.location) {
      return {
        available: false,
        message: 'Task has no location specified',
      };
    }

    return this.weatherService.getWeather(task.location);
  }
}
