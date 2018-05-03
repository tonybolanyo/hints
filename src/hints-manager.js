import Rx from 'rxjs/Rx';
import * as suggestBox from 'suggest-box';

const suggestions = [
    { title: 'tony', subtitle: 'Tony G. Bolaño', value: '@tony' },
    { title: 'luis', subtitle: 'Luis R.', value: '@luislard' },
    { title: 'david', subtitle: 'David', value: '@david'},
    { title: 'josecarlos', subtitle: 'José Carlos', value: '@josecarlos'},
    { title: 'santi', subtitle: 'Santiago A.', value: '@santi'}
]

export default class HintsManager {
    constructor(selector) {
        this.element = document.querySelector(selector);
        this.suggestor = suggestBox.default;
    }

    init() {
        if (!this.element) {
            return;
        }

        console.log('importado?', suggestBox);
        this.suggestor(this.element, {
            '@': suggestions
        })
    }
}