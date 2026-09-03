import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { DialogueView } from '../src/ui/DialogueView';
import { setLang } from '../src/i18n/lang';

const t = (en: string, ko = en) => ({ en, ko });
const ADA = { id: 'ada', name: t('Ada'), role: t('Engineer'), portrait: '🔧' };
const LINE = 'I was in the engine room all night.';

describe('dialogue view', () => {
  beforeEach(() => setLang('en'));

  it('types the line out and completes on click, then closes on the next click', () => {
    const onClose = vi.fn();
    const { container } = render(createElement(DialogueView, { person: ADA, topicLabel: 'Last night', text: LINE, onClose }));
    const line = () => container.querySelector('.nv-dialogue-line')!.textContent!;

    expect(screen.getByText('Ada')).toBeTruthy();
    expect(screen.getByText('Engineer')).toBeTruthy();
    expect(screen.getByText('Last night')).toBeTruthy();
    expect(line()).not.toContain('engine room');          // still typing

    fireEvent.click(screen.getByRole('dialog', { name: 'Ada' }));
    expect(line()).toContain(LINE);                        // click completes
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('dialog', { name: 'Ada' }));
    expect(onClose).toHaveBeenCalledTimes(1);              // click after completion closes
  });

  it('restarts the typewriter when the line changes', () => {
    const { container, rerender } = render(createElement(DialogueView, { person: ADA, text: LINE, onClose: () => {} }));
    fireEvent.click(screen.getByRole('dialog', { name: 'Ada' }));
    expect(container.querySelector('.nv-dialogue-line')!.textContent).toContain(LINE);
    rerender(createElement(DialogueView, { person: ADA, text: 'Never touched it.', onClose: () => {} }));
    expect(container.querySelector('.nv-dialogue-line')!.textContent).not.toContain('Never touched it.');
  });
});
