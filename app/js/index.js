'use strict';
// import Whatever from 'https://unpkg.com/whatever'
// import Whatever from 'whatever'

// import { default as index_css }  from './css/index.css'

// import {h, render } from 'https://unpkg.com/preact?module';
// import {App} from './app.js'

// // console.info(index_css)
// console.log('💀🤘')
// render(h(App), document.getElementById("app"));


// Utility


function $(/* args */) {
    let root = document;
    let query = arguments[0];
    if (arguments[0] instanceof Element || arguments[0] instanceof DocumentFragment) {
        root = arguments[0];
        query = arguments[1];
    }
    return root.querySelector(query);
}

function svg(type) {
    return document.createElementNS('http://www.w3.org/2000/svg', type);
}

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

// Actual app code
let selectedElement;
let targetedElement;
let animations;
const EPSILON = 0.001;

function dragStart(evt) {
  evt.stopPropagation();
  // TODO: Get the animation from animations associated with evt.target
  let animation = evt.target.getAnimations()[0];
  // Get a keyframe for the current time
  let currentOffset = animation.currentTime / animation.effect.getTiming().duration;
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
    drawAnimations();
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

animations = document.getAnimations({subtree: true});

const app = document.querySelector("#app");
const timeline = app.querySelector("#timeline");
const play = app.querySelector("#play");
const animationsView = app.querySelector("#animations");


timeline.addEventListener('input', function(evt) {
  const progress = evt.target.value;
  updateCurrentTime(parseInt(progress))
});

play.addEventListener('click', function(evt) {
  let animation = animations[0]; // Bit hacky
  updatePlayState(animation.playState == 'paused');
});

function updatePlayState(shouldPlay) {
  let animation = animations[0]; // Bit hacky
  if ((animation.playState != 'paused') == shouldPlay)
    return;
  if (shouldPlay) {
    for (let anim of animations)
      anim.play();
    play.value = "Pause";
    updateTimeline(document.timeline.currentTime);
  } else {
    for (let anim of animations)
      anim.pause();
    play.value = "Play ▶";
  }
}

function updateTimeline(frameTime) {
  // Update timeline to current time
  let animation = animations[0]; // Bit hacky
  if (animation.playState == 'paused')
    return;
  const duration = animation.effect.getTiming().duration;
  timeline.value = (animation.currentTime % duration) * 100 / duration;
  requestAnimationFrame(updateTimeline);
}
requestAnimationFrame(updateTimeline);
console.log(animations);

// we have to do this anytime our animations get updated
drawAnimations();

// progress is between 0-100
function updateCurrentTime(progress) {
  updatePlayState(false);
  for (let animation of animations) {
        // TODO: Use finite time length and allow extending animations.
        const duration = animation.effect.getTiming().duration;
        animation.currentTime = duration * progress/100;
    }
}

function drawAnimations() {
    animationsView.innerHTML = "";
    for (let animation of animations) {
        const li = document.createElement('li');
        drawAnimation(li, animation);
        animationsView.appendChild(li);
    }
}

// Drawing animation keyframes
function drawAnimation(parentElement, animation) {
    // copy template for foo.
    let elem = $('#foo').content.cloneNode(true);
    // $(elem,'.timing').innerHTML=`<div class="timings">${JSON.stringify(animation.effect.getTiming())}</div>`
    const keyframesViewSVG = $(elem, '.keyframes svg');

    function drawCircle(x) {
        const circle = svg('circle');
        circle.classList.add('my-class');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', 10);
        circle.style.stroke = 'blue';
        circle.style.fill = 'blue';

        circle.setAttribute('r', 5);
        keyframesViewSVG.appendChild(circle);
        return circle;
    }

    function drawLine(x1, x2) {
        const line = svg('line');
        line.setAttribute('x1', x1);
        line.setAttribute('x2', x2);
        line.setAttribute('y1', 10);
        line.setAttribute('y2', 10);
        line.setAttribute('x1', x1);
        line.style.stroke = 'lightblue';
        line.style.strokeWidth = 2;

        keyframesViewSVG.appendChild(line);
        return line;
    }

    const keyframes = animation.effect.getKeyframes();
    for (let i = 0; i < keyframes.length; i++){
        const keyframe = keyframes[i];
        const x1 = `${keyframe.computedOffset * 100}%`;
        if (i < keyframes.length - 1) {
            const x2 = `${keyframes[i+1].computedOffset * 100}%`
            drawLine(x1, x2);
        }
        const circle = drawCircle(x1);
    }
    parentElement.appendChild(elem);
}


showKeyframe(keyframe) {
    
}