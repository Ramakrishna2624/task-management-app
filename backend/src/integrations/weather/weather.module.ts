import { Module, forwardRef } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { TasksModule } from '../../tasks/tasks.module';

@Module({
  imports: [forwardRef(() => TasksModule)],
  providers: [WeatherService],
  controllers: [WeatherController],
  exports: [WeatherService],
})
export class WeatherModule {}
