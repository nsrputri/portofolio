import { gsap } from 'gsap';

/** The open line sits at most this far down the viewport… */
export const OPEN_RATIO = 0.42;
/** …and at least this far down. */
export const MIN_RATIO = 0.2;
/** How far above About's resting top the line sits, so the stack is always closed at the top of the page. */
export const REST_MARGIN = 80;
/** A folder closes again only once its top is this far below the line, so it never flickers on the line. */
export const GAP = 48;

/** How long a tab or End jump holds off opening and closing when no `scrollend` arrives. */
const JUMP_FALLBACK_MS = 3000;
const EASE = 'power3.inOut';

/**
 * The open line, in px from the top of the viewport: REST_MARGIN above About's document top, kept
 * between MIN_RATIO and OPEN_RATIO of the viewport height.
 */
export function computeLine(aboutTop: number, viewportH: number): number {
  return Math.max(viewportH * MIN_RATIO, Math.min(viewportH * OPEN_RATIO, aboutTop - REST_MARGIN));
}

export interface FolderSnapshot {
  open: boolean;
  /** Top of the folder, relative to the viewport. */
  top: number;
}

export type FolderAction = { kind: 'open' | 'close'; index: number } | null;

/**
 * The one step the stack takes next. Folders open in order and close in reverse: the last open folder
 * closes once its top falls below `line + gap`; otherwise the first closed folder opens once its top
 * rises above `line`.
 */
export function decide(folders: FolderSnapshot[], line: number, gap = GAP): FolderAction {
  const lastOpen = folders.map((folder) => folder.open).lastIndexOf(true);
  const last = folders[lastOpen];
  if (last && last.top > line + gap) return { kind: 'close', index: lastOpen };

  const firstClosed = folders.findIndex((folder) => !folder.open);
  const next = folders[firstClosed];
  if (next && next.top < line) return { kind: 'open', index: firstClosed };

  return null;
}

interface Folder {
  el: HTMLElement;
  tab: HTMLElement;
  body: HTMLElement;
  content: HTMLElement;
  pops: HTMLElement[];
}

function readFolder(el: HTMLElement): Folder | null {
  const tab = el.querySelector<HTMLElement>('.folder-tab');
  const body = el.querySelector<HTMLElement>('.folder-body');
  const content = el.querySelector<HTMLElement>('.folder-content');
  if (!tab || !body || !content) return null;
  return { el, tab, body, content, pops: [...el.querySelectorAll<HTMLElement>('.pop')] };
}

const isOpen = (folder: Folder) => folder.el.hasAttribute('data-open');

/** The look an animation runs between, read from CSS. */
function geometry(folder: Folder) {
  return { margin: getComputedStyle(folder.el).marginLeft, height: folder.body.offsetHeight };
}

function isEditable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea, select'));
}

/**
 * Opens the folders one by one as they scroll up past the open line, and closes them in reverse as
 * they scroll back down (ported from the approved mockup, opsi-b.html). Without `html.has-motion`,
 * which the head script adds unless the visitor prefers reduced motion, it does nothing and every
 * folder stays open.
 *
 * CSS owns both resting looks (`.folder[data-open]` or not). An animation flips the attribute,
 * reads where CSS now puts the folder, animates there from where it was, then removes its inline
 * styles again.
 *
 * Test hooks on `<html>`: `data-folders-line` (the line in px) and `data-folders-busy` ("1" while an
 * animation, or a tab or End jump, is in flight).
 */
export function initFolders(doc: Document): void {
  const root = doc.documentElement;
  const view = doc.defaultView;
  if (!view || !root.classList.contains('has-motion')) return;
  const win: Window = view;

  const folders = [...doc.querySelectorAll<HTMLElement>('main.stack > .folder')]
    .map(readFolder)
    .filter((folder): folder is Folder => folder !== null);
  const firstFolder = folders[0];
  const lastFolder = folders[folders.length - 1];
  if (!firstFolder || !lastFolder) return;
  const about: Folder = firstFolder;
  const last: Folder = lastFolder;

  for (const folder of folders) folder.tab.setAttribute('aria-expanded', String(isOpen(folder)));

  // Height of a closed folder body, read from CSS so it follows --V when the window resizes.
  const probe = doc.createElement('div');
  probe.style.cssText = 'position:absolute;top:0;left:0;width:0;height:calc(var(--V) + 20px);visibility:hidden';
  // Room at the end of the page, so even the last folder can be scrolled up past the line (see measure()).
  const room = doc.createElement('div');
  doc.body.append(probe, room);

  let line = 0;
  let running: gsap.core.Timeline | null = null;
  /** Id of the tab or End jump in flight, 0 when there is none. */
  let jumping = 0;
  let jumps = 0;

  function showBusy() {
    if (running || jumping) root.setAttribute('data-folders-busy', '1');
    else root.removeAttribute('data-folders-busy');
  }

  /** Clears the inline styles an animation left, so CSS is the only source of the resting look. */
  function handBack(folder: Folder) {
    gsap.set(folder.el, { clearProps: 'marginLeft,marginRight' });
    gsap.set(folder.body, { clearProps: 'height,overflow' });
    gsap.set(folder.content, { clearProps: 'opacity,visibility' });
    if (folder.pops.length) gsap.set(folder.pops, { clearProps: 'transform,opacity' });
  }

  function expand(folder: Folder): gsap.core.Timeline {
    const from = geometry(folder);
    folder.el.setAttribute('data-open', '');
    folder.tab.setAttribute('aria-expanded', 'true');
    const to = geometry(folder);
    // Clipped while it grows; open, CSS lets the contents overflow again.
    folder.body.style.overflow = 'hidden';

    const tl = gsap
      .timeline({ onComplete: () => handBack(folder) })
      .fromTo(
        folder.el,
        { marginLeft: from.margin, marginRight: from.margin },
        { marginLeft: to.margin, marginRight: to.margin, duration: 0.9, ease: EASE },
        0,
      )
      .fromTo(folder.body, { height: from.height }, { height: to.height, duration: 0.9, ease: EASE }, 0)
      .fromTo(folder.content, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.25);
    if (folder.pops.length) {
      tl.fromTo(
        folder.pops,
        { y: 44, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.07, ease: 'back.out(1.5)' },
        0.4,
      );
    }
    return tl;
  }

  function collapse(folder: Folder): gsap.core.Timeline {
    const from = geometry(folder);
    folder.el.removeAttribute('data-open');
    folder.tab.setAttribute('aria-expanded', 'false');
    const to = geometry(folder);
    // Closed CSS hides the contents at once; keep them showing while they fade.
    folder.content.style.visibility = 'visible';

    return gsap
      .timeline({ onComplete: () => handBack(folder) })
      .fromTo(folder.content, { opacity: 1 }, { opacity: 0, duration: 0.3 }, 0)
      .fromTo(folder.body, { height: from.height }, { height: to.height, duration: 0.7, ease: EASE }, 0)
      .fromTo(
        folder.el,
        { marginLeft: from.margin, marginRight: from.margin },
        { marginLeft: to.margin, marginRight: to.margin, duration: 0.7, ease: EASE },
        0,
      );
  }

  // Folders sit only a band apart, so they open one at a time in order and close in reverse order.
  function run(tl: gsap.core.Timeline) {
    running = tl;
    showBusy();
    tl.then(() => {
      running = null;
      sync();
      showBusy();
    });
  }

  function sync() {
    if (running || jumping) return;
    const action = decide(
      folders.map((folder) => ({ open: isOpen(folder), top: folder.el.getBoundingClientRect().top })),
      line,
    );
    const folder = action && folders[action.index];
    if (!action || !folder) return;
    run(action.kind === 'open' ? expand(folder) : collapse(folder));
  }

  /**
   * Places the line, and sizes the room at the end of the page. A folder opens only once its top is
   * above the line, so the page has to go on for (viewport − line) below the top of the last folder
   * while it is closed, or the last folder could never open by scrolling. Whatever follows the stack
   * counts towards that; the room makes up the rest, plus GAP so the top can rise clearly past the line.
   */
  function measure() {
    const vh = win.innerHeight;
    line = computeLine(about.el.getBoundingClientRect().top + win.scrollY, vh);
    root.setAttribute('data-folders-line', String(line));

    const closedLast = last.el.offsetHeight - last.body.offsetHeight + probe.offsetHeight;
    const after = room.getBoundingClientRect().top - last.el.getBoundingClientRect().bottom;
    const missing = vh - line + GAP - closedLast - after;
    room.style.height = missing > 0 ? `${Math.ceil(missing)}px` : '';
  }

  /**
   * Opens folders 0…`index` at once, then runs `scroll`. Opening and closing wait until the scroll
   * lands; the timeout covers a page that is already there, where no `scrollend` fires.
   */
  function jump(index: number, scroll: () => void) {
    const id = ++jumps;
    jumping = id;
    running?.progress(1);
    for (const folder of folders.slice(0, index + 1)) if (!isOpen(folder)) expand(folder).progress(1);
    showBusy();

    const land = () => {
      if (jumping !== id) return;
      jumping = 0;
      sync();
      showBusy();
    };
    win.addEventListener('scrollend', land, { once: true });
    win.setTimeout(land, JUMP_FALLBACK_MS);
    scroll();
  }

  const remeasure = () => {
    measure();
    sync();
  };

  remeasure();
  win.addEventListener('scroll', sync, { passive: true });
  win.addEventListener('resize', remeasure);
  // Text of the other language can move About; this also fires once on load, which is harmless.
  win.addEventListener('langchange', remeasure);
  // Web fonts swapping in can change the cover's height, and with it About's top.
  doc.fonts?.ready.then(remeasure);

  // A tab opens its folder (and every folder above it) straight away, then scrolls there.
  folders.forEach((folder, index) => {
    folder.tab.addEventListener('click', () => jump(index, () => folder.el.scrollIntoView({ behavior: 'smooth' })));
  });

  // The end of the page is only there once every folder is open, so End opens them all, then goes there.
  win.addEventListener('keydown', (event) => {
    if (event.key !== 'End' || event.defaultPrevented || event.altKey || event.shiftKey || event.metaKey) return;
    if (isEditable(event.target) || doc.querySelector('dialog[open]')) return;
    event.preventDefault();
    jump(folders.length - 1, () => win.scrollTo({ top: root.scrollHeight, behavior: 'smooth' }));
  });
}
