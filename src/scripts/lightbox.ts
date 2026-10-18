import { resolveLang, syncImageAlts } from './lang';

/**
 * Wires the page's `[data-lightbox]` cards to the single `<dialog id="lightbox">`.
 *
 * A card names a `<template>` by id. Opening copies the template into `.lightbox-body` and shows
 * the dialog modally; closing (close button, backdrop, Esc) empties the body and hands focus back
 * to the card. Detail images therefore only exist, and only load, while the dialog is open.
 */
export function initLightbox(doc: Document): void {
  const dialog = doc.getElementById('lightbox') as HTMLDialogElement | null;
  const body = dialog?.querySelector<HTMLElement>('.lightbox-body');
  if (!dialog || !body) return;

  let opener: HTMLElement | null = null;

  doc.addEventListener('click', (event) => {
    const trigger = (event.target as Element | null)?.closest<HTMLElement>('[data-lightbox]');
    if (!trigger || dialog.open) return;
    const template = doc.getElementById(trigger.dataset.lightbox ?? '');
    if (!(template instanceof HTMLTemplateElement)) return;

    body.replaceChildren(doc.importNode(template.content, true));
    // The template sits outside the document, so the language toggle never reached its images.
    syncImageAlts(body, resolveLang(doc.documentElement.lang));
    // The dialog is named by the title of whatever it currently shows.
    body.querySelector('.lb-title')?.setAttribute('id', 'lightbox-title');
    body.scrollTop = 0;

    opener = trigger;
    dialog.showModal();
  });

  dialog.querySelector('.lightbox-close')?.addEventListener('click', () => dialog.close());

  // A click on the backdrop is delivered to the dialog itself, which has no padding of its own, so
  // any click whose target is the dialog landed outside its content. The exception is a press that
  // started inside (selecting text, say) and was released over the backdrop.
  let pressStartedInside = false;
  dialog.addEventListener('pointerdown', (event) => {
    pressStartedInside = event.target !== dialog;
  });
  dialog.addEventListener('click', (event) => {
    const startedInside = pressStartedInside;
    pressStartedInside = false;
    if (event.target === dialog && !startedInside) dialog.close();
  });

  // Fires for every way of closing, Esc included. Some browsers do not focus a clicked button, so
  // the native "return focus to the opener" is not enough on its own.
  dialog.addEventListener('close', () => {
    body.replaceChildren();
    opener?.focus({ preventScroll: true });
    opener = null;
  });
}
