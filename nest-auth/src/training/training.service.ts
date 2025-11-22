import { Injectable } from '@nestjs/common';
import { Training } from './entities/training.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(Training)
    private readonly trainingRepo: Repository<Training>,
  ) {}

  async findAll(): Promise<Training[]> {
    try {
      return this.trainingRepo.find();
    } catch {
      return [];
    }
  }
}
