// Draws the timeline
export function drawTimeline(animations, app) {
    const timeline = app.querySelector("#timeline");
    const play = app.querySelector("#play");

    requestAnimationFrame(updateTimeline);
    console.log(animations);

    timeline.addEventListener('input', function (evt) {
        const progress = evt.target.value;
        updateCurrentTime(parseInt(progress))
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