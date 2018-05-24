import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceControllerSettingComponent } from './resource-controller-setting.component';

describe('ResourceControllerSettingComponent', () => {
  let component: ResourceControllerSettingComponent;
  let fixture: ComponentFixture<ResourceControllerSettingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResourceControllerSettingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceControllerSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
