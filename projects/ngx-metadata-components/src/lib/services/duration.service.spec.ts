import { DurationService } from './duration.service';

describe('DurationService', () => {
  it('should convert seconds to minutes and seconds - 0 seconds', () => {
    const result = DurationService.convertSecondsToMinutes(0);
    expect(result).toEqual({ minutes: '00', seconds: '00' });
  });

  it('should convert seconds to minutes and seconds - less than a minute', () => {
    const result = DurationService.convertSecondsToMinutes(45);
    expect(result).toEqual({ minutes: '00', seconds: '45' });
  });

  it('should convert seconds to minutes and seconds - exactly one minute', () => {
    const result = DurationService.convertSecondsToMinutes(60);
    expect(result).toEqual({ minutes: '01', seconds: '00' });
  });

  it('should convert seconds to minutes and seconds - more than a minute', () => {
    const result = DurationService.convertSecondsToMinutes(125);
    expect(result).toEqual({ minutes: '02', seconds: '05' });
  });
});
