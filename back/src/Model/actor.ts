export class Actor {
    f_name: string;
    l_name: string;
    role: string;

    constructor(f_name: string = '', l_name: string = '', role: string = '') {
        this.f_name = f_name;
        this.l_name = l_name;
        this.role = role;
    }
}
