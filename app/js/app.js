import { h, Component, render } from 'https://unpkg.com/preact?module';
import htm from 'https://unpkg.com/htm?module';

import AnimationView from './animation-view.js'

// Initialize htm with Preact
const html = htm.bind(h);

export function App() {
    return html`
        Hello Preact!
        <${AnimationView} name="my animation" />`;
}
