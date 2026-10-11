// Presentation only. Nothing here changes a card's text, a threshold or a model decision:
// it adds a transient note while the CLI works and bolds the one line that is the answer.

type Stream = { isTTY?: boolean; write(text: string): unknown };
type Env = Record<string, string | undefined>;

// The lines card.ts prints as its answer: go today, go tomorrow, no window, or no forecast.
const ANSWER = [/^Go at /, /^Nothing suitable left today\. Tomorrow /, /^No suitable daylight window today or tomorrow\.$/, /^Forecast unavailable\. No recommendation made\.$/];

// Style only an interactive terminal, and honour the NO_COLOR convention and dumb terminals.
export function useStyle(stream: { isTTY?: boolean }, env: Env = process.env): boolean {
  return Boolean(stream.isTTY) && !env.NO_COLOR && env.TERM !== 'dumb';
}

// Bold the answer line. Every other character of the card is passed through untouched.
export function highlightAnswer(card: string, styled: boolean): string {
  if (!styled) return card;
  return card.split('\n').map(line => ANSWER.some(pattern => pattern.test(line)) ? `\x1b[1m${line}\x1b[0m` : line).join('\n');
}

// Show a short note on an interactive stream while work is in progress. The returned
// function erases it, so piped output, logs and --json never contain the note.
export function progressNote(stream: Stream, text: string, env: Env = process.env): () => void {
  if (!stream.isTTY) return () => {};
  if (env.TERM === 'dumb') { stream.write(`${text}\n`); return () => {}; }
  stream.write(text);
  return () => { stream.write('\r\x1b[2K'); };
}
