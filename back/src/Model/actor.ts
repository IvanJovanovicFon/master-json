export class Actor {
    f_name: string;
    l_name: string;
    b_year: number;

    constructor(f_name: string = '', l_name: string = '', b_year: number = 0) {
        this.f_name = f_name;
        this.l_name = l_name;
        this.b_year = b_year;
    }
}
