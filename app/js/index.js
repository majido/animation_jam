'use strict';
// import Whatever from 'https://unpkg.com/whatever'
// import Whatever from 'whatever'

// import { default as index_css }  from './css/index.css'

// import {h, render } from 'https://unpkg.com/preact?module';
// import {App} from './app.js'

// // console.info(index_css)
// console.log('💀🤘')
// render(h(App), document.getElementById("app"));

// Setup
// Animate content to have a running sample to work with
const sandbox = document.querySelector("#sandbox");
for (let box of sandbox.querySelectorAll(".box")) {
  box.animate(
      { transform : ['translateX(-100px)', 'translateX(100px)'] },
      {
          duration: 3000, direction: "alternate",
          iterations: Infinity // TODO: try infinity
      });
}

// Actual app code
let selectedElement;
let animations;



function dragStart(evt) {
  // TODO: Get the animation from animations associated with evt.target
  let animation = animations[0];
  // Get a keyframe for the current time
  let currentOffset = animation.currentTime / animation.effect.getTiming().duration;
  let keyframes = animation.effect.getKeyframes();
  let keyframe;
  let currentTransform = getComputedStyle(evt.target).transform;
  for (let index = 0; index < keyframes.length; index++) {
    // TODO: Find existing keyframe near currentOffset
    if (keyframes[index].computedOffset > currentOffset) {
      // Insert new keyframe before index.
      keyframe = {
        offset: currentOffset,
      };
      keyframes.splice(index, 0, keyframe);
      break;
    }
  }

  let start = [evt.clientX, evt.clientY];
  console.log(evt);
  function dragMove(evt) {
    let delta = [evt.clientX - start[0], evt.clientY - start[1]];
    keyframe.transform = 'translate(' + delta[0] + 'px, ' + delta[1] + 'px) ' + currentTransform;
    animation.effect.setKeyframes(keyframes);
  }

  function dragEnd(evt) {
    console.log(evt);
    evt.target.removeEventListener('pointermove', dragMove);
    evt.target.removeEventListener('pointercancel', dragEnd);
    evt.target.removeEventListener('pointerup', dragEnd);
    evt.target.releasePointerCapture(evt.pointerId);
  }
  evt.target.addEventListener('pointermove', dragMove);
  evt.target.addEventListener('pointercancel', dragEnd);
  evt.target.addEventListener('pointerup', dragEnd);
  evt.target.setPointerCapture(evt.pointerId);
}

function selectElement(element) {
    selectedElement = element;
    // TODO: should we grab the subtree animations as well?
    animations = element.getAnimations();
    element.addEventListener('pointerdown', dragStart);
}

const app = document.querySelector("#app");
const timeline = app.querySelector("#timeline");

timeline.addEventListener('input', function(evt) {
    const progress = evt.target.value;
    updateCurrentTime(parseInt(progress))
});

selectElement(sandbox.querySelector(".box"))
console.log(animations);

// progress is between 0-100
function updateCurrentTime(progress) {
    for (let animation of animations) {
        animation.pause();
        // TODO: Use finite time length and allow extending animations.
        const duration = animation.effect.getTiming().duration;
        animation.currentTime = duration * progress/100;
    }
}


