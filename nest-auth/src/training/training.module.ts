import { Module } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Training } from './entities/training.entity';
import { TrainingSeeder } from './training.seeder';

@Module({
  controllers: [TrainingController],
  providers: [TrainingService, TrainingSeeder],
  imports: [TypeOrmModule.forFeature([Training])],
})
export class TrainingModule {}
