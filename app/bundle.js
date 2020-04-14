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

// Utility

// Draws the animation panel attached to the given app view
function drawAnimations(animations, app) {
    const animationsView = app.querySelector("#animations");
    const keyframeView = app.querySelector("#keyframe");

    animationsView.innerHTML = "";
    for (let animation of animations) {
        const li = document.createElement('li');
        drawAnimation(li, animation);
        animationsView.appendChild(li);
    }

    // Drawing animation keyframes
    function drawAnimation(parentElement, animation) {
        // copy template for foo.
        let elem = $('#animation_template').content.cloneNode(true);
        // $(elem,'.timing').innerHTML=`<div class="timings">${JSON.stringify(animation.effect.getTiming())}</div>`
        const keyframesViewSVG = $(elem, '.keyframes svg');

        const keyframes = animation.effect.getKeyframes();
        for (let i = 0; i < keyframes.length; i++) {
            const keyframe = keyframes[i];
            const x1 = `${keyframe.computedOffset * 100}%`;
            if (i < keyframes.length - 1) {
                const x2 = `${keyframes[i + 1].computedOffset * 100}%`;
                drawLine(x1, x2);
            }
            const circle = drawCircle(x1);

            circle.addEventListener('click', (evt) => {
                //evt.target.classList.add('selected');
                showKeyframe(keyframe);
            });
        }
        parentElement.appendChild(elem);

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
    }

    function showKeyframe(keyframe) {
        keyframeView.innerHTML = `
        <tt>${keyframe.computedOffset * 100}% - ${keyframe.transform}</tt>`;
        console.log(keyframe);
    }
}

// Draws the timeline
function drawTimeline(animations, app) {
    const timeline = app.querySelector("#timeline");
    const play = app.querySelector("#play");

    requestAnimationFrame(updateTimeline);
    console.log(animations);

    timeline.addEventListener('input', function (evt) {
        const progress = evt.target.value;
        updateCurrentTime(parseInt(progress));
    });

    play.addEventListener('click', function (evt) {
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
            play.value = "Pause ⏸";
            updateTimeline(document.timeline.currentTime);
        } else {
            for (let anim of animations)
                anim.pause();
            play.value = "Play ▶️";
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

    // progress is between 0-100
    function updateCurrentTime(progress) {
        updatePlayState(false);
        for (let animation of animations) {
            // TODO: Use finite time length and allow extending animations.
            const duration = animation.effect.getTiming().duration;
            animation.currentTime = duration * progress / 100;
        }
    }
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
const animations = document.getAnimations({subtree: true});
const app = document.querySelector("#app");

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyJqcy91dGlscy5qcyIsImpzL2FuaW1hdGlvbnMuanMiLCJ0aW1lbGluZS5qcyIsImpzL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuXG5leHBvcnQgZnVuY3Rpb24gJCgvKiBhcmdzICovKSB7XG4gICAgbGV0IHJvb3QgPSBkb2N1bWVudDtcbiAgICBsZXQgcXVlcnkgPSBhcmd1bWVudHNbMF07XG4gICAgaWYgKGFyZ3VtZW50c1swXSBpbnN0YW5jZW9mIEVsZW1lbnQgfHwgYXJndW1lbnRzWzBdIGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudCkge1xuICAgICAgICByb290ID0gYXJndW1lbnRzWzBdO1xuICAgICAgICBxdWVyeSA9IGFyZ3VtZW50c1sxXTtcbiAgICB9XG4gICAgcmV0dXJuIHJvb3QucXVlcnlTZWxlY3RvcihxdWVyeSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdmcodHlwZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgdHlwZSk7XG59IiwiLy8gVXRpbGl0eVxuaW1wb3J0IHsgJCwgc3ZnIH0gZnJvbSAnLi91dGlscy5qcycgXG5cbi8vIERyYXdzIHRoZSBhbmltYXRpb24gcGFuZWwgYXR0YWNoZWQgdG8gdGhlIGdpdmVuIGFwcCB2aWV3XG5leHBvcnQgZnVuY3Rpb24gZHJhd0FuaW1hdGlvbnMoYW5pbWF0aW9ucywgYXBwKSB7XG4gICAgY29uc3QgYW5pbWF0aW9uc1ZpZXcgPSBhcHAucXVlcnlTZWxlY3RvcihcIiNhbmltYXRpb25zXCIpO1xuICAgIGNvbnN0IGtleWZyYW1lVmlldyA9IGFwcC5xdWVyeVNlbGVjdG9yKFwiI2tleWZyYW1lXCIpO1xuXG4gICAgYW5pbWF0aW9uc1ZpZXcuaW5uZXJIVE1MID0gXCJcIjtcbiAgICBmb3IgKGxldCBhbmltYXRpb24gb2YgYW5pbWF0aW9ucykge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgIGRyYXdBbmltYXRpb24obGksIGFuaW1hdGlvbik7XG4gICAgICAgIGFuaW1hdGlvbnNWaWV3LmFwcGVuZENoaWxkKGxpKTtcbiAgICB9XG5cbiAgICAvLyBEcmF3aW5nIGFuaW1hdGlvbiBrZXlmcmFtZXNcbiAgICBmdW5jdGlvbiBkcmF3QW5pbWF0aW9uKHBhcmVudEVsZW1lbnQsIGFuaW1hdGlvbikge1xuICAgICAgICAvLyBjb3B5IHRlbXBsYXRlIGZvciBmb28uXG4gICAgICAgIGxldCBlbGVtID0gJCgnI2FuaW1hdGlvbl90ZW1wbGF0ZScpLmNvbnRlbnQuY2xvbmVOb2RlKHRydWUpO1xuICAgICAgICAvLyAkKGVsZW0sJy50aW1pbmcnKS5pbm5lckhUTUw9YDxkaXYgY2xhc3M9XCJ0aW1pbmdzXCI+JHtKU09OLnN0cmluZ2lmeShhbmltYXRpb24uZWZmZWN0LmdldFRpbWluZygpKX08L2Rpdj5gXG4gICAgICAgIGNvbnN0IGtleWZyYW1lc1ZpZXdTVkcgPSAkKGVsZW0sICcua2V5ZnJhbWVzIHN2ZycpO1xuXG4gICAgICAgIGNvbnN0IGtleWZyYW1lcyA9IGFuaW1hdGlvbi5lZmZlY3QuZ2V0S2V5ZnJhbWVzKCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5ZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBrZXlmcmFtZSA9IGtleWZyYW1lc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IHgxID0gYCR7a2V5ZnJhbWUuY29tcHV0ZWRPZmZzZXQgKiAxMDB9JWA7XG4gICAgICAgICAgICBpZiAoaSA8IGtleWZyYW1lcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeDIgPSBgJHtrZXlmcmFtZXNbaSArIDFdLmNvbXB1dGVkT2Zmc2V0ICogMTAwfSVgXG4gICAgICAgICAgICAgICAgZHJhd0xpbmUoeDEsIHgyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNpcmNsZSA9IGRyYXdDaXJjbGUoeDEpO1xuXG4gICAgICAgICAgICBjaXJjbGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgICAgLy9ldnQudGFyZ2V0LmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJyk7XG4gICAgICAgICAgICAgICAgc2hvd0tleWZyYW1lKGtleWZyYW1lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoZWxlbSk7XG5cbiAgICAgICAgZnVuY3Rpb24gZHJhd0NpcmNsZSh4KSB7XG4gICAgICAgICAgICBjb25zdCBjaXJjbGUgPSBzdmcoJ2NpcmNsZScpO1xuICAgICAgICAgICAgY2lyY2xlLmNsYXNzTGlzdC5hZGQoJ215LWNsYXNzJyk7XG4gICAgICAgICAgICBjaXJjbGUuc2V0QXR0cmlidXRlKCdjeCcsIHgpO1xuICAgICAgICAgICAgY2lyY2xlLnNldEF0dHJpYnV0ZSgnY3knLCAxMCk7XG4gICAgICAgICAgICBjaXJjbGUuc3R5bGUuc3Ryb2tlID0gJ2JsdWUnO1xuICAgICAgICAgICAgY2lyY2xlLnN0eWxlLmZpbGwgPSAnYmx1ZSc7XG5cbiAgICAgICAgICAgIGNpcmNsZS5zZXRBdHRyaWJ1dGUoJ3InLCA1KTtcbiAgICAgICAgICAgIGtleWZyYW1lc1ZpZXdTVkcuYXBwZW5kQ2hpbGQoY2lyY2xlKTtcbiAgICAgICAgICAgIHJldHVybiBjaXJjbGU7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkcmF3TGluZSh4MSwgeDIpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmUgPSBzdmcoJ2xpbmUnKTtcbiAgICAgICAgICAgIGxpbmUuc2V0QXR0cmlidXRlKCd4MScsIHgxKTtcbiAgICAgICAgICAgIGxpbmUuc2V0QXR0cmlidXRlKCd4MicsIHgyKTtcbiAgICAgICAgICAgIGxpbmUuc2V0QXR0cmlidXRlKCd5MScsIDEwKTtcbiAgICAgICAgICAgIGxpbmUuc2V0QXR0cmlidXRlKCd5MicsIDEwKTtcbiAgICAgICAgICAgIGxpbmUuc2V0QXR0cmlidXRlKCd4MScsIHgxKTtcbiAgICAgICAgICAgIGxpbmUuc3R5bGUuc3Ryb2tlID0gJ2xpZ2h0Ymx1ZSc7XG4gICAgICAgICAgICBsaW5lLnN0eWxlLnN0cm9rZVdpZHRoID0gMjtcblxuICAgICAgICAgICAga2V5ZnJhbWVzVmlld1NWRy5hcHBlbmRDaGlsZChsaW5lKTtcbiAgICAgICAgICAgIHJldHVybiBsaW5lO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0tleWZyYW1lKGtleWZyYW1lKSB7XG4gICAgICAgIGtleWZyYW1lVmlldy5pbm5lckhUTUwgPSBgXG4gICAgICAgIDx0dD4ke2tleWZyYW1lLmNvbXB1dGVkT2Zmc2V0ICogMTAwfSUgLSAke2tleWZyYW1lLnRyYW5zZm9ybX08L3R0PmA7XG4gICAgICAgIGNvbnNvbGUubG9nKGtleWZyYW1lKTtcbiAgICB9XG59XG4iLCIvLyBEcmF3cyB0aGUgdGltZWxpbmVcbmV4cG9ydCBmdW5jdGlvbiBkcmF3VGltZWxpbmUoYW5pbWF0aW9ucywgYXBwKSB7XG4gICAgY29uc3QgdGltZWxpbmUgPSBhcHAucXVlcnlTZWxlY3RvcihcIiN0aW1lbGluZVwiKTtcbiAgICBjb25zdCBwbGF5ID0gYXBwLnF1ZXJ5U2VsZWN0b3IoXCIjcGxheVwiKTtcblxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh1cGRhdGVUaW1lbGluZSk7XG4gICAgY29uc29sZS5sb2coYW5pbWF0aW9ucyk7XG5cbiAgICB0aW1lbGluZS5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBldnQudGFyZ2V0LnZhbHVlO1xuICAgICAgICB1cGRhdGVDdXJyZW50VGltZShwYXJzZUludChwcm9ncmVzcykpXG4gICAgfSk7XG5cbiAgICBwbGF5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICBsZXQgYW5pbWF0aW9uID0gYW5pbWF0aW9uc1swXTsgLy8gQml0IGhhY2t5XG4gICAgICAgIHVwZGF0ZVBsYXlTdGF0ZShhbmltYXRpb24ucGxheVN0YXRlID09ICdwYXVzZWQnKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVBsYXlTdGF0ZShzaG91bGRQbGF5KSB7XG4gICAgICAgIGxldCBhbmltYXRpb24gPSBhbmltYXRpb25zWzBdOyAvLyBCaXQgaGFja3lcbiAgICAgICAgaWYgKChhbmltYXRpb24ucGxheVN0YXRlICE9ICdwYXVzZWQnKSA9PSBzaG91bGRQbGF5KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoc2hvdWxkUGxheSkge1xuICAgICAgICAgICAgZm9yIChsZXQgYW5pbSBvZiBhbmltYXRpb25zKVxuICAgICAgICAgICAgICAgIGFuaW0ucGxheSgpO1xuICAgICAgICAgICAgcGxheS52YWx1ZSA9IFwiUGF1c2Ug4o+4XCI7XG4gICAgICAgICAgICB1cGRhdGVUaW1lbGluZShkb2N1bWVudC50aW1lbGluZS5jdXJyZW50VGltZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGxldCBhbmltIG9mIGFuaW1hdGlvbnMpXG4gICAgICAgICAgICAgICAgYW5pbS5wYXVzZSgpO1xuICAgICAgICAgICAgcGxheS52YWx1ZSA9IFwiUGxheSDilrbvuI9cIjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVRpbWVsaW5lKGZyYW1lVGltZSkge1xuICAgICAgICAvLyBVcGRhdGUgdGltZWxpbmUgdG8gY3VycmVudCB0aW1lXG4gICAgICAgIGxldCBhbmltYXRpb24gPSBhbmltYXRpb25zWzBdOyAvLyBCaXQgaGFja3lcbiAgICAgICAgaWYgKGFuaW1hdGlvbi5wbGF5U3RhdGUgPT0gJ3BhdXNlZCcpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGR1cmF0aW9uID0gYW5pbWF0aW9uLmVmZmVjdC5nZXRUaW1pbmcoKS5kdXJhdGlvbjtcbiAgICAgICAgdGltZWxpbmUudmFsdWUgPSAoYW5pbWF0aW9uLmN1cnJlbnRUaW1lICUgZHVyYXRpb24pICogMTAwIC8gZHVyYXRpb247XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh1cGRhdGVUaW1lbGluZSk7XG4gICAgfVxuXG4gICAgLy8gcHJvZ3Jlc3MgaXMgYmV0d2VlbiAwLTEwMFxuICAgIGZ1bmN0aW9uIHVwZGF0ZUN1cnJlbnRUaW1lKHByb2dyZXNzKSB7XG4gICAgICAgIHVwZGF0ZVBsYXlTdGF0ZShmYWxzZSk7XG4gICAgICAgIGZvciAobGV0IGFuaW1hdGlvbiBvZiBhbmltYXRpb25zKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBVc2UgZmluaXRlIHRpbWUgbGVuZ3RoIGFuZCBhbGxvdyBleHRlbmRpbmcgYW5pbWF0aW9ucy5cbiAgICAgICAgICAgIGNvbnN0IGR1cmF0aW9uID0gYW5pbWF0aW9uLmVmZmVjdC5nZXRUaW1pbmcoKS5kdXJhdGlvbjtcbiAgICAgICAgICAgIGFuaW1hdGlvbi5jdXJyZW50VGltZSA9IGR1cmF0aW9uICogcHJvZ3Jlc3MgLyAxMDA7XG4gICAgICAgIH1cbiAgICB9XG59IiwiJ3VzZSBzdHJpY3QnO1xuLy8gaW1wb3J0IFdoYXRldmVyIGZyb20gJ2h0dHBzOi8vdW5wa2cuY29tL3doYXRldmVyJ1xuLy8gaW1wb3J0IFdoYXRldmVyIGZyb20gJ3doYXRldmVyJ1xuLy8gaW1wb3J0IHsgZGVmYXVsdCBhcyBpbmRleF9jc3MgfSAgZnJvbSAnLi9jc3MvaW5kZXguY3NzJ1xuXG4vLyBVdGlsaXR5XG5pbXBvcnQgeyQsIHN2Z30gZnJvbSAnLi91dGlscy5qcydcblxuLy8gQ29tcG9uZW50c1xuaW1wb3J0IHsgZHJhd0FuaW1hdGlvbnMgfSBmcm9tICcuL2FuaW1hdGlvbnMuanMnXG5pbXBvcnQgeyBkcmF3VGltZWxpbmUgfSBmcm9tICcuLi90aW1lbGluZS5qcyc7XG5cblxuLy8gU2V0dXBcbi8vIEFuaW1hdGUgY29udGVudCB0byBoYXZlIGEgcnVubmluZyBzYW1wbGUgdG8gd29yayB3aXRoXG5cbmNvbnN0IHNhbmRib3ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI3NhbmRib3hcIik7XG5mb3IgKGxldCBib3ggb2Ygc2FuZGJveC5xdWVyeVNlbGVjdG9yQWxsKFwiLmJveFwiKSkge1xuICBib3guYW5pbWF0ZShcbiAgICAgIHsgdHJhbnNmb3JtIDogWyd0cmFuc2xhdGVYKC0xMDBweCknLCd0cmFuc2xhdGVYKDEwMHB4KSddIH0sXG4gICAgICB7XG4gICAgICAgICAgZHVyYXRpb246IDMwMDAsXG4gICAgICAgICAgaXRlcmF0aW9uczogSW5maW5pdHkgLy8gVE9ETzogdHJ5IGluZmluaXR5XG4gICAgICB9KTtcbn1cblxuLy8gQWN0dWFsIGFwcCBjb2RlXG5jb25zdCBhbmltYXRpb25zID0gZG9jdW1lbnQuZ2V0QW5pbWF0aW9ucyh7c3VidHJlZTogdHJ1ZX0pO1xuY29uc3QgYXBwID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNhcHBcIik7XG5cbmRyYXdUaW1lbGluZShhbmltYXRpb25zLCBhcHApO1xuXG5mdW5jdGlvbiB1cGRhdGVBbmltYXRpb25zKCkge1xuICBkcmF3QW5pbWF0aW9ucyhhbmltYXRpb25zLCBhcHApO1xufVxudXBkYXRlQW5pbWF0aW9ucygpO1xuXG4vLyBUT0RPOiBNb3ZlIHNlbGVjdGlvbiBsb2dpYyBpbnRvIGl0cyBvd24gY29tcG9uZW50IFxubGV0IHNlbGVjdGVkRWxlbWVudDtcbmxldCB0YXJnZXRlZEVsZW1lbnQ7XG5jb25zdCBFUFNJTE9OID0gMC4wMDE7XG5cbmZ1bmN0aW9uIGRyYWdTdGFydChldnQpIHtcbiAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpO1xuICAvLyBUT0RPOiBHZXQgdGhlIGFuaW1hdGlvbiBmcm9tIGFuaW1hdGlvbnMgYXNzb2NpYXRlZCB3aXRoIGV2dC50YXJnZXRcbiAgbGV0IGFuaW1hdGlvbiA9IGV2dC50YXJnZXQuZ2V0QW5pbWF0aW9ucygpWzBdO1xuICAvLyBHZXQgYSBrZXlmcmFtZSBmb3IgdGhlIGN1cnJlbnQgdGltZVxuICBjb25zdCBkdXJhdGlvbiA9IGFuaW1hdGlvbi5lZmZlY3QuZ2V0VGltaW5nKCkuZHVyYXRpb247XG4gIGxldCBjdXJyZW50T2Zmc2V0ID0gKChhbmltYXRpb24uY3VycmVudFRpbWUgJSBkdXJhdGlvbikvIGR1cmF0aW9uKTtcbiAgbGV0IGtleWZyYW1lcyA9IGFuaW1hdGlvbi5lZmZlY3QuZ2V0S2V5ZnJhbWVzKCk7XG4gIGxldCBrZXlmcmFtZTtcbiAgbGV0IGN1cnJlbnRUcmFuc2Zvcm0gPSBnZXRDb21wdXRlZFN0eWxlKGV2dC50YXJnZXQpLnRyYW5zZm9ybTtcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGtleWZyYW1lcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAvLyBUT0RPOiBGaW5kIGV4aXN0aW5nIGtleWZyYW1lIG5lYXIgY3VycmVudE9mZnNldFxuICAgIGlmIChNYXRoLmFicyhrZXlmcmFtZXNbaW5kZXhdLmNvbXB1dGVkT2Zmc2V0IC0gY3VycmVudE9mZnNldCkgPCBFUFNJTE9OKSB7XG4gICAgICBrZXlmcmFtZSA9IGtleWZyYW1lc1tpbmRleF07XG4gICAgICBicmVhaztcbiAgICB9IGVsc2UgaWYgKGtleWZyYW1lc1tpbmRleF0uY29tcHV0ZWRPZmZzZXQgPiBjdXJyZW50T2Zmc2V0KSB7XG4gICAgICAvLyBJbnNlcnQgbmV3IGtleWZyYW1lIGJlZm9yZSBpbmRleC5cbiAgICAgIGtleWZyYW1lID0ge1xuICAgICAgICBvZmZzZXQ6IGN1cnJlbnRPZmZzZXQsXG4gICAgICB9O1xuICAgICAga2V5ZnJhbWVzLnNwbGljZShpbmRleCwgMCwga2V5ZnJhbWUpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgbGV0IHN0YXJ0ID0gW2V2dC5jbGllbnRYLCBldnQuY2xpZW50WV07XG4gIGNvbnNvbGUubG9nKGV2dCk7XG4gIGZ1bmN0aW9uIGRyYWdNb3ZlKGV2dCkge1xuICAgIGxldCBkZWx0YSA9IFtldnQuY2xpZW50WCAtIHN0YXJ0WzBdLCBldnQuY2xpZW50WSAtIHN0YXJ0WzFdXTtcbiAgICBrZXlmcmFtZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKCcgKyBkZWx0YVswXSArICdweCwgJyArIGRlbHRhWzFdICsgJ3B4KSAnICsgY3VycmVudFRyYW5zZm9ybTtcbiAgICBhbmltYXRpb24uZWZmZWN0LnNldEtleWZyYW1lcyhrZXlmcmFtZXMpO1xuICAgIHVwZGF0ZUFuaW1hdGlvbnMoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRyYWdFbmQoZXZ0KSB7XG4gICAgY29uc29sZS5sb2coZXZ0KTtcbiAgICBldnQudGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgZHJhZ01vdmUpO1xuICAgIGV2dC50YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIGRyYWdFbmQpO1xuICAgIGV2dC50YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgZHJhZ0VuZCk7XG4gICAgZXZ0LnRhcmdldC5yZWxlYXNlUG9pbnRlckNhcHR1cmUoZXZ0LnBvaW50ZXJJZCk7XG4gIH1cbiAgZXZ0LnRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIGRyYWdNb3ZlKTtcbiAgZXZ0LnRhcmdldC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgZHJhZ0VuZCk7XG4gIGV2dC50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgZHJhZ0VuZCk7XG4gIGV2dC50YXJnZXQuc2V0UG9pbnRlckNhcHR1cmUoZXZ0LnBvaW50ZXJJZCk7XG59XG5cbmZ1bmN0aW9uIGlzQW5jZXN0b3IoYW5jZXN0b3IsIG5vZGUpIHtcbiAgd2hpbGUgKG5vZGUgJiYgbm9kZSAhPSBhbmNlc3Rvcikge1xuICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gIH1cbiAgcmV0dXJuIG5vZGU7XG59XG5cbmZ1bmN0aW9uIHNlbGVjdEVsZW1lbnQoZWxlbWVudCkge1xuICBpZiAodGFyZ2V0ZWRFbGVtZW50KSB7XG4gICAgdGFyZ2V0ZWRFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgZHJhZ1N0YXJ0KTtcbiAgICB0YXJnZXRlZEVsZW1lbnQuc3R5bGUub3V0bGluZSA9ICcnO1xuICB9XG4gIGlmIChzZWxlY3RlZEVsZW1lbnQpIHtcbiAgICBpZiAoIWlzQW5jZXN0b3IoZWxlbWVudCwgc2VsZWN0ZWRFbGVtZW50KSlcbiAgICAgIHNlbGVjdGVkRWxlbWVudCA9IGVsZW1lbnQ7XG4gIH0gZWxzZSB7XG4gICAgc2VsZWN0ZWRFbGVtZW50ID0gZWxlbWVudDtcbiAgfVxuICB0YXJnZXRlZEVsZW1lbnQgPSBlbGVtZW50O1xuICAvLyBGaW5kIHRoZSBuZWFyZXN0IGFuY2VzdG9yIHdpdGggYW5pbWF0aW9ucy5cbiAgLy8gVE9ETzogQWxsb3cgY3JlYXRpbmcgYW5pbWF0aW9ucyBvbiBuZXcgbm9kZXMuXG4gIHdoaWxlICh0YXJnZXRlZEVsZW1lbnQgJiYgdGFyZ2V0ZWRFbGVtZW50LmdldEFuaW1hdGlvbnMoKS5sZW5ndGggPT0gMClcbiAgICB0YXJnZXRlZEVsZW1lbnQgPSB0YXJnZXRlZEVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgaWYgKHRhcmdldGVkRWxlbWVudCkge1xuICAgIHRhcmdldGVkRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIGRyYWdTdGFydCk7XG4gICAgdGFyZ2V0ZWRFbGVtZW50LnN0eWxlLm91dGxpbmUgPSAnMXB4IHNvbGlkIGJsdWUnO1xuICB9XG4gIGxldCBwYXJlbnRzID0gJCgnI2VsZW1lbnQtc2VsZWN0b3InKTtcbiAgLy8gUmVtb3ZlIGFsbCBjaGlsZHJlblxuICBwYXJlbnRzLmlubmVySFRNTCA9ICcnO1xuICBsZXQgY3VyID0gc2VsZWN0ZWRFbGVtZW50O1xuICB3aGlsZSAoY3VyKSB7XG4gICAgbGV0IGVsZW0gPSAkKCcjZWxlbWVudC1pdGVtJykuY2xvbmVOb2RlKHRydWUpLmNvbnRlbnQ7XG4gICAgZWxlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbGVjdEVsZW1lbnQuYmluZChudWxsLCBlbGVtKSk7XG4gICAgJChlbGVtLCAnLm5hbWUnKS50ZXh0Q29udGVudCA9IGN1ci50YWdOYW1lO1xuICAgIGlmIChjdXIgPT0gdGFyZ2V0ZWRFbGVtZW50KSB7XG4gICAgICAkKGVsZW0sICcubmFtZScpLnN0eWxlLmZvbnRXZWlnaHQgPSAnYm9sZCc7XG4gICAgfVxuICAgIHBhcmVudHMuYXBwZW5kQ2hpbGQoZWxlbSk7XG4gICAgY3VyID0gY3VyLnBhcmVudEVsZW1lbnQ7XG4gIH1cbn1cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCAoZXZ0KSA9PiB7XG4gIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgc2VsZWN0RWxlbWVudChldnQudGFyZ2V0KTtcbn0pO1xuXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRU8sU0FBUyxDQUFDLGFBQWE7QUFDOUIsSUFBSSxJQUFJLElBQUksR0FBRyxRQUFRLENBQUM7QUFDeEIsSUFBSSxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0IsSUFBSSxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsWUFBWSxPQUFPLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxZQUFZLGdCQUFnQixFQUFFO0FBQ3JGLFFBQVEsSUFBSSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QixRQUFRLEtBQUssR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0IsS0FBSztBQUNMLElBQUksT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUFDRDtBQUNPLFNBQVMsR0FBRyxDQUFDLElBQUksRUFBRTtBQUMxQixJ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
