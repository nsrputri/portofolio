import { describe, expect, it } from 'vitest';
import { GAP, MIN_RATIO, OPEN_RATIO, REST_MARGIN, computeLine, decide } from '../../src/scripts/folders';

describe('constants', () => {
  it('match the motion spec', () => {
    expect({ OPEN_RATIO, MIN_RATIO, REST_MARGIN, GAP }).toEqual({ OPEN_RATIO: 0.42, MIN_RATIO: 0.2, REST_MARGIN: 80, GAP: 48 });
  });
});

describe('computeLine', () => {
  it('sits REST_MARGIN above About when that is within the band', () => {
    expect(computeLine(500, 1000)).toBe(420);
    expect(computeLine(300, 1000)).toBe(220);
  });

  it('never rises above MIN_RATIO of the viewport', () => {
    expect(computeLine(100, 1000)).toBe(200);
  });

  it('never drops below OPEN_RATIO of the viewport', () => {
    expect(computeLine(900, 1000)).toBe(420);
  });
});

describe('decide', () => {
  const line = 420;

  it('does nothing while every folder rests below the line', () => {
    expect(decide([{ open: false, top: 500 }, { open: false, top: 580 }], line)).toBeNull();
  });

  it('opens the first folder once its top passes the line', () => {
    expect(decide([{ open: false, top: 400 }, { open: false, top: 480 }], line)).toEqual({ kind: 'open', index: 0 });
  });

  it('opens folders in order only', () => {
    const folders = [
      { open: true, top: -300 },
      { open: false, top: 410 },
      { open: false, top: 415 },
    ];
    expect(decide(folders, line)).toEqual({ kind: 'open', index: 1 });
  });

  it('closes the last open folder once its top falls below line + gap', () => {
    expect(decide([{ open: true, top: -300 }, { open: true, top: 480 }], line)).toEqual({ kind: 'close', index: 1 });
  });

  it('holds an open folder inside the hysteresis band', () => {
    expect(decide([{ open: true, top: -300 }, { open: true, top: 450 }], line)).toBeNull();
  });

  it('never closes a middle folder first', () => {
    expect(decide([{ open: true, top: 900 }, { open: true, top: 1500 }], line)).toEqual({ kind: 'close', index: 1 });
  });

  it('uses the gap it is given', () => {
    expect(decide([{ open: true, top: 450 }], line, 20)).toEqual({ kind: 'close', index: 0 });
    expect(decide([{ open: true, top: 450 }], line, 40)).toBeNull();
  });

  it('does nothing when there are no folders', () => {
    expect(decide([], line)).toBeNull();
  });
});
