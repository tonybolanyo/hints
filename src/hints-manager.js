import Rx from 'rxjs/Rx';


export default class HintsManager {
    constructor(selector) {
        this.element = document.querySelector(selector);
    }

    init() {
        if (!this.element) {
            return;
        }

        this.keylogger$ = Rx.Observable.fromEvent(this.element, 'input');
        this.keylogger$                     // every key press on textarea
            .map(e => {
                return e.target.value.match(/:(\w+):/gu)
            })
            .subscribe(e => {
                console.log(e);
            });
    }
}