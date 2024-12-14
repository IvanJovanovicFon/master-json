import { Test, TestingModule } from '@nestjs/testing';
import { MoviesServiceOracle } from './movies.service.oracle';

describe('MoviesService', () => {
  let service: MoviesServiceOracle;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MoviesServiceOracle],
    }).compile();

    service = module.get<MoviesServiceOracle>(MoviesServiceOracle);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
