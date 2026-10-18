import { describe, expect, it } from 'vitest';
import { renderEm } from '../../src/lib/rich';

describe('renderEm', () => {
  it('turns *x* into <em> and newlines into <br>', () => {
    expect(renderEm('stay *curious*,\nstay')).toBe('stay <em>curious</em>,<br>stay');
  });

  it('escapes HTML metacharacters', () => {
    expect(renderEm('<b>&</b>')).toBe('&lt;b&gt;&amp;&lt;/b&gt;');
  });

  it('escapes quotes', () => {
    expect(renderEm(`say "hi" it's`)).toBe('say &quot;hi&quot; it&#39;s');
  });

  it('leaves a lone asterisk with surrounding spaces unchanged', () => {
    expect(renderEm('a * b')).toBe('a * b');
  });

  it('does not let markup inside emphasis through', () => {
    expect(renderEm('*<i>x</i>*')).toBe('<em>&lt;i&gt;x&lt;/i&gt;</em>');
  });
});
