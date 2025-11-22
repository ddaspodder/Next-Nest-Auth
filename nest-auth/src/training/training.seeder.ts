import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Training } from './entities/training.entity';

@Injectable()
export class TrainingSeeder implements OnModuleInit {
  private readonly logger = new Logger(TrainingSeeder.name);

  constructor(
    @InjectRepository(Training)
    private readonly trainingRepo: Repository<Training>,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.trainingRepo.count();
      if (count > 0) {
        this.logger.debug(
          `Training table already has ${count} records — skipping seeding.`,
        );
        return;
      }

      const defaults: Partial<Training>[] = [
        {
          title: 'Yoga',
          image: '/yoga.jpg',
          description: 'A gentle way to improve flexibility and balance.',
        },
        {
          title: 'Boxing',
          image: '/boxing.jpg',
          description:
            'A high-energy workout that improves strength and speed.',
        },
        {
          title: 'Running',
          image: '/running.jpg',
          description:
            'A great way to improve cardiovascular health and endurance.',
        },
        {
          title: 'Weightlifting',
          image: '/weightlifting.jpg',
          description: 'A strength-building workout that helps tone muscles.',
        },
        {
          title: 'Cycling',
          image: '/cycling.jpg',
          description:
            'A low-impact workout that improves cardiovascular health and endurance.',
        },
        {
          title: 'Gaming',
          image: '/gaming.jpg',
          description:
            'A fun way to improve hand-eye coordination and reflexes.',
        },
        {
          title: 'Sailing',
          image: '/sailing.jpg',
          description:
            'A relaxing way to enjoy the outdoors and improve balance.',
        },
      ];

      const entities = this.trainingRepo.create(defaults as Training[]);
      await this.trainingRepo.save(entities);
      this.logger.log(`Seeded ${entities.length} training records.`);
    } catch (err) {
      this.logger.error('Failed to seed training data', err);
    }
  }
}
