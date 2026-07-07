import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchByLake } from './search-by-lake';
import { Api } from './api';

describe('SearchByLake', () => {
  let component: SearchByLake;
  let fixture: ComponentFixture<SearchByLake>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchByLake],
      providers: [
        {
          provide: Api,
          useValue: {
            GetLakeByName: jasmine.createSpy('GetLakeByName'),
            GetLakeData: jasmine.createSpy('GetLakeData')
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchByLake);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render a fish species dropdown', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const speciesSelect = compiled.querySelector('#species-select');

    expect(speciesSelect).toBeTruthy();
    expect(speciesSelect?.textContent).toContain('All species');
  });
});
