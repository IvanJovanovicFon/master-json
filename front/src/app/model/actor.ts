import {Agency} from './agency';

export class Actor {
  constructor(
    public f_name: string = '',
    public l_name: string = '',
    public b_year: number = 0,
    public agency: Agency = new Agency()
  ) {}
}
