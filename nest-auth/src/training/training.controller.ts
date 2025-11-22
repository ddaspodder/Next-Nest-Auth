import { Controller, Get, UseGuards } from '@nestjs/common';
import { TrainingService } from './training.service';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}
  @Get()
  @UseGuards(AuthGuard)
  getAllTrainings() {
    return this.trainingService.findAll();
  }
}
