'use strict';

// Steps for the Webflow Background Video element, and the control that lets a
// visitor stop it.
//
// What Webflow renders, observed on a public Webflow site:
//
//   <div class="w-background-video w-background-video-atom" data-autoplay="true" data-loop="true">
//     <video autoplay loop muted playsinline>...</video>
//     <button type="button" class="w-background-video--control" aria-controls="<video id>">
//       <span>Pause video</span><span hidden>Play video</span>
//     </button>
//   </div>
//
// The video plays by itself, muted. The control, when the designer shows it,
// pauses it and plays it again, and swaps which of its two labels is hidden.
// A video that moves for more than five seconds needs such a control (WCAG
// 2.2, success criterion 2.2.2 "Pause, Stop, Hide"; EN 301 549 clause 9.2.2.2).

const { When, Then } = require('@cucumber/cucumber');
const { friendly } = require('webship-js/tests/step-definitions/webship');
const { budget, actOrExplain, waitForCondition } = require('./webflow-helpers');

// Runs in the page. The state of the first Webflow background video.
function videoState() {
  const wrapper = document.querySelector('.w-background-video');
  const video = wrapper && wrapper.querySelector('video');
  const control = wrapper && wrapper.querySelector('.w-background-video--control');
  const shown = (el) => Boolean(el) && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  return {
    found: Boolean(wrapper && video),
    playing: Boolean(video) && !video.paused && !video.ended,
    control: shown(control),
  };
}

const VIDEO_HINT = 'A Webflow Background Video is `.w-background-video` with a `video` element inside; the page has none, or it has not loaded.';

async function requireVideo(world) {
  await waitForCondition(world, `(${videoState})().found`, undefined, async () => friendly({
    message: 'The page has no Webflow background video (`.w-background-video`).',
    hint: VIDEO_HINT,
  }));
}

/**
 * Assert the background video is, or is not, playing: the `video` element is
 * not paused.
 *
 * Example #1: Then the background video should be playing
 * Example #2: Then the background video should not be playing
 * Example #3: And the background video should be playing
 * Example #4: Then the background video should not be playing
 * Example #5: And the background video should be playing
 *
 */
Then(/^the background video should( not)* be playing$/, async function (notCase) {
  await requireVideo(this);
  await waitForCondition(this, `(${videoState})().playing === ${!notCase}`, undefined, async () => friendly({
    message: notCase ? 'Expected the background video to be paused, but it is playing.' : 'Expected the background video to be playing, but it is paused.',
    hint: 'A browser plays a video by itself only when it is muted; a visitor who pressed the pause control, or a browser that saves data, stops it.',
  }));
});

/**
 * Assert the background video offers, or does not offer, a visible pause and
 * play control (`.w-background-video--control`). A video that moves for more
 * than five seconds needs one for people who cannot read with it moving.
 *
 * Example #1: Then the background video should have a pause control
 * Example #2: Then the background video should not have a pause control
 * Example #3: And the background video should have a pause control
 * Example #4: Then the background video should not have a pause control
 * Example #5: And the background video should have a pause control
 *
 */
Then(/^the background video should( not)* have a pause control$/, async function (notCase) {
  await requireVideo(this);
  await waitForCondition(this, `(${videoState})().control === ${!notCase}`, undefined, async () => friendly({
    message: notCase ? 'Expected the background video to have no visible pause control, but it has one.' : 'Expected the background video to have a visible pause control, but it has none.',
    hint: 'Webflow adds `.w-background-video--control` to a Background Video when "Show play/pause button" is on; a control the designer hides does not help a visitor.',
  }));
});

/**
 * Pause or play the background video with its control, and wait until the video
 * is in the state asked for. The step does nothing when it already is.
 *
 * Example #1: When I pause the background video
 * Example #2: When I play the background video
 * Example #3: When we pause the background video
 * Example #4: And I pause the background video
 * Example #5: And we play the background video
 *
 */
When(/^(I |we )*(pause|play) the background video$/, async function (pronounCase, action) {
  const wantPlaying = action === 'play';
  await requireVideo(this);
  const state = await this.page.evaluate(videoState);
  if (state.playing !== wantPlaying) {
    await actOrExplain(action, 'the background video', async () => {
      await this.page.locator('.w-background-video--control').first().click({ timeout: budget(this) });
    }, 'The control is `.w-background-video--control`; when it is hidden there is no way to use it: turn on "Show play/pause button" in the Background Video settings.');
  }
  await waitForCondition(this, `(${videoState})().playing === ${wantPlaying}`, undefined, async () => friendly({
    message: `Expected the background video to be ${wantPlaying ? 'playing' : 'paused'} after the click, but it is not.`,
    hint: 'The control swaps its two labels ("Pause video" and "Play video") when it works.',
  }));
});
