import Rx from './rxjs/Rx';

export default class HintsManager {
    constructor(selector) {
        this.element = document.querySelector(selector);
    }

    init() {
        if (!this.element) {
            return;
        }
        const keyup$ = Rx.Observable.fromEvent(this.element, 'keyup');
        keyup.subscribe(data => {
            console.log(data);
        });
    }
}

