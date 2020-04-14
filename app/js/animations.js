// Utility
import { $, svg } from './utils.js' 

// Draws the animation panel attached to the given app view
export function drawAnimations(animations, app) {
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
                const x2 = `${keyframes[i + 1].computedOffset * 100}%`
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
