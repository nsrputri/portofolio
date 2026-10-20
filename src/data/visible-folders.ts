import type { SiteContent } from './schema';

export type FolderId = 'about' | 'study' | 'work' | 'cert';

/**
 * The folders the page shows, in order. About Me and Study Journey are always there; What I Do and
 * Certificates appear once they have at least one item, so an unfinished section is simply left out.
 */
export function visibleFolders(content: Pick<SiteContent, 'work' | 'certificates'>): FolderId[] {
  const ids: FolderId[] = ['about', 'study'];
  if (content.work.items.length > 0) ids.push('work');
  if (content.certificates.items.length > 0) ids.push('cert');
  return ids;
}

/** Where a shown folder sits: its number on the tab (from 1), and its tab side, alternating from the left. */
export function folderPlace(shown: FolderId[], id: FolderId): { no: number; tab: 'left' | 'right' } {
  const index = shown.indexOf(id);
  return { no: index + 1, tab: index % 2 === 0 ? 'left' : 'right' };
}
