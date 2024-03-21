class Collapse extends HTMLElement {
    Collapse;
    collapseButton;
    state;
    id;
    #duration = 1000;

    static observedAttributes = ["visible", "duration"];

    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        this.id = this.getAttribute('id');
        this.collapseButton = document.querySelector(`[data-collapse-target="${this.id}"]`);
        const wrapper = document.createElement('div');
        const expandable = document.createElement('div');
        const slot = document.createElement('slot');
        wrapper.appendChild(expandable);
        expandable.appendChild(slot);
        wrapper.className = 'collapse';
        expandable.className = 'collapse-expandable';
        const style = document.createElement("style");
        style.textContent = `
        .collapse {
            display: grid;
            grid-template-rows: 0fr;
            overflow: hidden;
            transition: grid-template-rows .8s cubic-bezier(.3,0,.2,1);
        }
        .collapse.expanded {
         grid-template-rows: 1fr;
        }
        .collapse-expandable {
         min-height: 0;
         opacity: 0;
         transition: opacity 800ms ease;
        }
        
        .collapse.expanded .collapse-expandable {
            opacity: 1;
        }
        `;
        shadow.append(style, wrapper);
        this.Collapse = shadow.querySelector('.collapse');
    }

    connectedCallback() {
        this.setupVisibleState();
        this.setupButtonListeners();
        this.setupDuration();
    }

    attributeChangedCallback(attr, oldValue, newValue) {
        this.setupVisibleState();
    }

    set duration(value) {
        if (value !== null) {
            this.#duration = Number.parseInt(value);
        }
    }

    get duration() {
        return this.#duration;
    }

    setupDuration() {
        this.duration = this.getAttribute('duration');
        this.Collapse.style.transitionDuration = `${this.duration}ms`;
    }

    setupButtonListeners() {
        for (const collapseButton of document.querySelectorAll('[data-toggle="collapse"]')) {
            collapseButton.addEventListener('click', (e) => this.handleCollapseButton(e), false);
        }
    }

    handleCollapseButton(event) {
        event.preventDefault();
        if (this.id === event.currentTarget.dataset.collapseTarget) {
            this.collapseButton = event.currentTarget;
            this.updateCollapseVisibleState(this.state = !this.state);
            this.toggle();
        }
    }

    setupVisibleState() {
        this.updateCollapseVisibleState(this.hasAttribute('visible'));
        if (this.state) {
            this.Collapse.classList.add('expanded');
            this.collapseButton !== null ? this.collapseButton.classList.add('expanded') : null;
            this.state = true;
        }
    }

    toggle() {
        this.state ? this.show() : this.hide();
    }

    show() {
        this.Collapse.classList.add('expanded');
        this.collapseButton !== null ? this.collapseButton.classList.add('expanded') : null;
        this.state = true;
        this.emitEventShow();
    }

    hide() {
        this.Collapse.classList.remove('expanded');
        this.collapseButton !== null ? this.collapseButton.classList.remove('expanded') : null;
        this.state = false;
        this.updateButtonState();
        setTimeout(() => this.emitEventHide(), this.#duration);
    }

    updateButtonState() {
        for (const targetButton of document.querySelectorAll(`[data-collapse-target="${this.id}"]`)) {
            targetButton.classList.remove('expanded');
        }
    }

    emitEventShow() {
        this.emit();
        const collapse = new CustomEvent("collapse.show", {
            detail: {
                visible: this.state,
                collapseId: this.id
            }
        });
        this.dispatchEvent(collapse);
    }

    emitEventHide() {
        this.emit();
        const collapse = new CustomEvent("collapse.hide", {
            detail: {
                visible: this.state,
                collapseId: this.id
            }
        });
        this.dispatchEvent(collapse);
    }

    emit() {
        dispatchEvent(new CustomEvent('collapse.event', {
            bubbles: true,
            cancelable: false,
            composed: false,
            detail: {
                visible: this.state,
                collapseId: this.id,
                element: this
            }
        }));
    }

    updateCollapseVisibleState(state) {
        this.state = state;
    }

    static define(tag) {
        try {
            customElements.define(tag, this);
        } catch (err) {
            throw new Error(`Couldn't define ${tag} element`);
        }
    }
}


export default function initCollapse() {
    const collapseInstanceList = [];

    const onCollapseShow = ({collapseId}) => { // Accordion logic
        [...collapseInstanceList].filter(e => {
            return e.id !== collapseId;
        }).map(e => e.hide());
    }

    const updateCollapseInstanceList = () => {
        for (const collapse of document.querySelectorAll('gnd-collapse')) {
            collapseInstanceList.push(collapse);
            collapse.addEventListener('collapse.show', ({detail}) => onCollapseShow(detail))
        }
    }

    Collapse.define('gnd-collapse');
    updateCollapseInstanceList();

    return collapseInstanceList;
}
