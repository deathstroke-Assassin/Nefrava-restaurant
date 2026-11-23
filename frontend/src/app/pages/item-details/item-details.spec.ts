import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ItemDetails } from './item-details';

describe('ItemDetails', () => {
  let component: ItemDetails;
  let fixture: ComponentFixture<ItemDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemDetails],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
