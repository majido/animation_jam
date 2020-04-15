'use strict';
// import Whatever from 'https://unpkg.com/whatever'
// import Whatever from 'whatever'
// import { default as index_css }  from './css/index.css'

// Utility
import {$, svg} from './utils.js'

// Components
import { drawAnimations } from './animations.js'
import { drawTimeline } from './timeline.js';


// Setup
// Animate content to have a running sample to work with

const sandbox = document.querySelector("#sandbox");
for (let box of sandbox.querySelectorAll(".box")) {
  box.animate(
      { transform : ['translateX(-100px)','translateX(100px)'] },
      {
          duration: 3000,
          iterations: Infinity // TODO: try infinity
      });
}

main();

// Actual app code
function main() {
  const app = document.querySelector("#app");
  if (!document.getAnimations) {
    app.innerHTML=`
      <section>
        <h2>Error</h2>
        Your browser does not support <tt>document.getAnimations()</tt> 
        API. In Chrome you can enable it by activating the follwing flag:
        <tt>chrome://flags/#enable-experimental-web-platform-features</tt>  
      </section>`;
    return;
  }


  const animations = document.getAnimations({ subtree: true });

  drawTimeline(animations, app);

  function updateAnimations() {
    drawAnimations(animations, app);
  }
  updateAnimations();

  // TODO: Move selection logic into its own component 
  let selectedElement;
  let targetedElement;
  const EPSILON = 0.001;

  function dragStart(evt) {
    evt.stopPropagation();
    // TODO: Get the animation from animations associated with evt.target
    let animation = evt.target.getAnimations()[0];
    // Get a keyframe for the current time
    const duration = animation.effect.getTiming().duration;
    let currentOffset = ((animation.currentTime % duration)/ duration);
    let keyframes = animation.effect.getKeyframes();
    let keyframe;
    let currentTransform = getComputedStyle(evt.target).transform;
    for (let index = 0; index < keyframes.length; index++) {
      // TODO: Find existing keyframe near currentOffset
      if (Math.abs(keyframes[index].computedOffset - currentOffset) < EPSILON) {
        keyframe = keyframes[index];
        break;
      } else if (keyframes[index].computedOffset > currentOffset) {
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
      updateAnimations();
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

  function isAncestor(ancestor, node) {
    while (node && node != ancestor) {
      node = node.parentNode;
    }
    return node;
  }

  function selectElement(element) {
    if (targetedElement) {
      targetedElement.removeEventListener('pointerdown', dragStart);
      targetedElement.style.outline = '';
    }
    if (selectedElement) {
      if (!isAncestor(element, selectedElement))
        selectedElement = element;
    } else {
      selectedElement = element;
    }
    targetedElement = element;
    // Find the nearest ancestor with animations.
    // TODO: Allow creating animations on new nodes.
    while (targetedElement && targetedElement.getAnimations().length == 0)
      targetedElement = targetedElement.parentElement;
    if (targetedElement) {
      targetedElement.addEventListener('pointerdown', dragStart);
      targetedElement.style.outline = '1px solid blue';
    }
    let parents = $('#element-selector');
    // Remove all children
    parents.innerHTML = '';
    let cur = selectedElement;
    while (cur) {
      let elem = $('#element-item').cloneNode(true).content;
      elem.addEventListener('click', selectElement.bind(null, elem));
      $(elem, '.name').textContent = cur.tagName;
      if (cur == targetedElement) {
        $(elem, '.name').style.fontWeight = 'bold';
      }
      parents.appendChild(elem);
      cur = cur.parentElement;
    }
  }

  document.addEventListener('pointerdown', (evt) => {
    evt.stopPropagation();
    selectElement(evt.target);
  });
}

