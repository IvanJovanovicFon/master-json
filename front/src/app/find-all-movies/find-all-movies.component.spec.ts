import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FindAllMoviesComponent } from './find-all-movies.component';

describe('FindAllMoviesComponent', () => {
  let component: FindAllMoviesComponent;
  let fixture: ComponentFixture<FindAllMoviesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FindAllMoviesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FindAllMoviesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
