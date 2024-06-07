// @require     https://raw.githubusercontent.com/trinatek/violentmonkey/main/blockingDelay.js

"use strict";

/**
 * A blocking (non-async) sleep delay with progress bar output to the console.
 * 
 * @param {number} seconds - Total seconds duration for delay.
 * @param {number} charLength - Character length for the progress bar.
 * @param {string} inProgressMsg - In progress message.
 * @param {string} doneMsg - Completed message.
 * @param {boolean} clearConsoleOnUpdate - Clear console with each update.
 * @param {string} bgChar - Character used for progress bar background.
 * @param {string} fgChar - Character used for progress bar foreground.
 * @param {string} doneChar - Character used for progress bar completion.
 */
function blockingDelay(
  seconds = 5.0,
  charLength = 12,
  inProgressMsg = "Starting ViolentMonkey script in...",
  doneMsg = "👉👈 Running...",
  clearConsoleOnUpdate = true,
  bgChar = "⬛",
  fgChar = "🟨",
  doneChar = "🟩",
) {
  if (seconds <= 0) return;

  const timeMs = (seconds * 1000) / charLength;

  const synchronousSleep = (ms) => {
    const start = Date.now();
    while (Date.now() - start < ms) { }
  };

  const progressBar = (currentTick) => {
    const progress = Math.round((currentTick / charLength)*charLength);
    const bar = fgChar.repeat(progress) + bgChar.repeat(charLength - progress);
    const percentage = Math.round((currentTick / charLength) * 100);
    const secondsRemaining = Math.max(
      0,
      seconds - Math.floor((timeMs * currentTick) / 1000)
    );
    
    clearConsoleOnUpdate && console.clear();

    const isInProgress = currentTick < charLength;
    const isCompleted = currentTick >= charLength;

    switch (true) {
      case isInProgress:
        console.log(`${bar} ${percentage}% ${inProgressMsg} ${secondsRemaining}s`);
        break;

      case isCompleted:
        console.log(`[${doneChar.repeat(charLength)}] 100% ${doneMsg}...`);
        break;
    }
  };

  for (let i = 0; i <= charLength; i++) {
    progressBar(i);
    synchronousSleep(timeMs);
  }
}




