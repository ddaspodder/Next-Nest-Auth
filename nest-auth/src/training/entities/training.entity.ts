import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';

@Entity()
export class Training {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  title: string;
  @Column()
  description: string;
  @Column()
  image: string;
}
