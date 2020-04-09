// import Whatever from 'https://unpkg.com/whatever'
// import Whatever from 'whatever'

// import { default as index_css }  from './css/index.css'

import {h, render } from 'https://unpkg.com/preact?module';
import {App} from './app.js'

// console.info(index_css)
console.log('💀🤘')
render(h(App), document.getElementById("app"));


// Animate content to have a running sample to work with
for (let box of document.querySelectorAll("#content > .box")) {
    box.animate(
        {opacity: [1, 0.7]}, 
        {
            delay: Math.random() * 3000, 
            duration: 3000, direction:"alternate", 
            iterations: Infinity 
        });
}

