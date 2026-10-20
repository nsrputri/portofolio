import { describe, expect, it } from 'vitest';
import { folderPlace, visibleFolders } from '../../src/data/visible-folders';

const withItems = (work: number, certificates: number) => ({
  work: { items: Array.from({ length: work }) },
  certificates: { items: Array.from({ length: certificates }) },
});

describe('visibleFolders', () => {
  it('shows all four folders when every section has items', () => {
    expect(visibleFolders(withItems(2, 3) as never)).toEqual(['about', 'study', 'work', 'cert']);
  });

  it('leaves out What I Do and Certificates while they have no items', () => {
    expect(visibleFolders(withItems(0, 1) as never)).toEqual(['about', 'study', 'cert']);
    expect(visibleFolders(withItems(1, 0) as never)).toEqual(['about', 'study', 'work']);
    expect(visibleFolders(withItems(0, 0) as never)).toEqual(['about', 'study']);
  });
});

describe('folderPlace', () => {
  it('numbers the shown folders in order and alternates the tab side', () => {
    const shown = ['about', 'study', 'cert'] as const;
    expect(shown.map((id) => folderPlace([...shown], id))).toEqual([
      { no: 1, tab: 'left' },
      { no: 2, tab: 'right' },
      { no: 3, tab: 'left' },
    ]);
  });
});
