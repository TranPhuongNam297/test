import { TestBed } from '@angular/core/testing';

import { FaceScanService } from './face-scan.service';

describe('FaceScanService', () => {
  let service: FaceScanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FaceScanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
