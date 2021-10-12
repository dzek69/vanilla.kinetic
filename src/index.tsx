/* eslint-disable max-lines */

interface Settings {
    /**
     * Should momentum be automatically decelerated?
     */
    decelerate: boolean;
    /**
     * Should browser hardware acceleration be forced. May not always work but it won't crash anything, defaults to
     * false
     */
    triggerHardware: boolean;
    /**
     * How many pixels needs to be moved for movement to start. Use this to prevent accidentally scrolling the view
     * on click
     */
    threshold: number;
    /**
     * Allow movement on X axis
     */
    x: boolean;
    /**
     * Allow movement on Y axis
     */
    y: boolean;
    /**
     * How fast to decelerate movement. 0.9 is good default value
     */
    slowdown: number;
    /**
     * Don't allow faster movement
     */
    maxvelocity: number;
    /**
     * FPS limit
     */
    throttleFPS: number;
    /**
     * Invert movements
     */
    invert: boolean;
    /**
     * Classnames applied to the parent element while moving in various directions
     */
    movingClass: {
        up: string;
        down: string;
        left: string;
        right: string;
    };
    /**
     * Classnames applied to the parent element while decelerating on given direction
     */
    deceleratingClass: {
        up: string;
        down: string;
        left: string;
        right: string;

    };
}

const defaultSettings: Settings = {
    // @todo use a value, if given then it's enabled, if not then disabled
    decelerate: true,
    // @todo always force?
    triggerHardware: false,
    // @todo rename to minMovement
    threshold: 0,
    // @todo rename those two?
    x: true,
    y: true,
    // @todo rename to deceleration?
    slowdown: 0.9,
    // @todo rename to maxVelocity
    maxvelocity: 40,
    // @todo rename to fps
    throttleFPS: 60,
    // @todo use invertX and invertY?
    invert: false,
    // @todo remove?
    movingClass: {
        up: "kinetic--moving-up",
        down: "kinetic--moving-down",
        left: "kinetic--moving-left",
        right: "kinetic--moving-right",
    },
    // @todo remove?
    deceleratingClass: {
        up: "kinetic--decelerating-up",
        down: "kinetic--decelerating-down",
        left: "kinetic--decelerating-left",
        right: "kinetic--decelerating-right",
    },
};

const _isTouch = () => "ontouchend" in document;

const getOffset = (evt: MouseEvent, parentElement: HTMLElement) => {
    let el: HTMLElement | null = parentElement,
        x = 0,
        y = 0;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
        x += el.offsetLeft - el.scrollLeft;
        y += el.offsetTop - el.scrollTop;
        el = el.offsetParent as typeof el;
    }

    x = evt.clientX - x;
    y = evt.clientY - y;

    return { x, y };
};

const ZOOM_MULTIPLIER = 1.1;

// TODO remove arrow functions to prevent creating new methods on instance when not needed
class VanillaKinetic {
    private _settings: Settings;

    private readonly _el: HTMLElement;

    private readonly _activeClass: string;

    // @TODO fix those errors
    // @ts-expect-error Not in a constructor
    private _xpos: number | null;

    // @ts-expect-error Not in a constructor
    private _prevXPos: number | null;

    // @ts-expect-error Not in a constructor
    private _ypos: number | null;

    // @ts-expect-error Not in a constructor
    private _prevYPos: number | null;

    // @ts-expect-error Not in a constructor
    private _mouseDown: boolean;

    // @ts-expect-error Not in a constructor
    private _throttleTimeout: number;

    // @ts-expect-error Not in a constructor
    private _lastMove: Date | null;

    // @ts-expect-error Not in a constructor
    private _elementFocused: HTMLElement | null;

    // @ts-expect-error Not in a constructor
    private _velocityX: number;

    // @ts-expect-error Not in a constructor
    private _velocityY: number;

    // @ts-expect-error Not in a constructor
    private _threshold: number;

    // @ts-expect-error Not in a constructor
    private _events: {
        touchStart: (e: TouchEvent) => void;
        touchMove: (e: TouchEvent) => void;
        inputDown: (e: MouseEvent) => void;
        inputEnd: (e: TouchEvent | MouseEvent) => void;
        inputMove: (e: MouseEvent) => void;
        scroll: (e: Event) => void;
        wheel: (e: WheelEvent) => void;
        inputClick: (e: MouseEvent) => void;
        dragStart: (e: DragEvent) => void;
        selectStart: (e: Event) => void;
    };

    // @ts-expect-error Not in a constructor
    private _moving: boolean;

    // @ts-expect-error Not in a constructor
    private _naturalContentDimensions: number[];

    // @ts-expect-error Not in a constructor
    private _zoom: number;

    private _active: boolean;

    public constructor(element: HTMLElement, settings: Partial<Settings>) {
        this._settings = {
            ...defaultSettings,
            ...settings,
        };

        this._el = element;
        this._active = false;

        // @TODO make configurable? remove?
        this._activeClass = "kinetic--active";

        this._validateElement();
        this._validateAndPrepareChildren();
        this._initElements();
    }

    public get active() {
        return this._active;
    }

    private _validateElement() {
        if (this._el === document.body || this._el === document.documentElement) {
            throw new TypeError("Root element cannot be HTML or BODY");
        }
    }

    private _validateAndPrepareChildren() {
        const e = new Error(
            "Root element should contain just one child, put contents inside it",
        );
        if (this._el.children.length !== 1) {
            throw e;
        }

        const middle = this._el.children[0] as HTMLDivElement;
        middle.style.transformOrigin = "0 0";
    }

    private _init() {
        this._el.classList.add(this._activeClass);
        const html = document.documentElement;
        html.addEventListener("mouseup", this._resetMouse, false);
        html.addEventListener("click", this._resetMouse, false);
    }

    private _deinit() {
        const html = document.documentElement;
        html.removeEventListener("mouseup", this._resetMouse, false);
        html.removeEventListener("click", this._resetMouse, false);

        this._el.classList.remove(this._activeClass);
    }

    // eslint-disable-next-line max-statements
    private _initElements() {
        this._init();

        this._xpos = null;
        this._prevXPos = null;
        this._ypos = null;
        this._prevYPos = null;
        this._mouseDown = false;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        this._throttleTimeout = 1000 / this._settings.throttleFPS;
        this._lastMove = null;
        this._elementFocused = null;
        this._threshold = 0;

        this._velocityX = 0;
        this._velocityY = 0;
        this._zoom = 0;

        this._moving = false;

        this._initEvents();

        if (this._settings.triggerHardware) {
            const styles = {
                transform: "translate3d(0,0,0)",
                perspective: "1000",
                backfaceVisibility: "hidden",
            };
            // @TODO use will-change?
            Object.entries(styles).forEach(([property, value]) => {
                this._el.style[property as keyof typeof styles] = value;
            });
        }

        this._naturalContentDimensions = [
            this._el.scrollWidth,
            this._el.scrollHeight,
        ];

        this._active = true;
    }

    // eslint-disable-next-line max-lines-per-function
    private _initEvents() {
        this._events = {
            touchStart: (e) => {
                if (this._useTarget(e.target, e)) {
                    const touch = e.touches[0];
                    this._threshold = this._calcThreshold(e.target, e);
                    this._start(touch.clientX, touch.clientY);
                    e.stopPropagation();
                }
            },
            touchMove: e => {
                let touch;
                if (this._mouseDown) {
                    touch = e.touches[0];
                    this._inputmove(touch.clientX, touch.clientY);
                    e.preventDefault();
                }
            },
            inputDown: e => {
                if (this._useTarget(e.target, e)) {
                    this._threshold = this._calcThreshold(e.target, e);
                    this._start(e.clientX, e.clientY);

                    if (e.target instanceof HTMLElement) {
                        this._elementFocused = e.target;
                        if (e.target.nodeName === "IMG") {
                            e.preventDefault();
                        }
                    }
                    e.stopPropagation();
                }
            },
            inputEnd: e => {
                if (this._useTarget(e.target, e)) {
                    this._end();
                    this._elementFocused = null;
                    e.preventDefault();
                }
            },
            inputMove: e => {
                if (this._mouseDown) {
                    this._inputmove(e.clientX, e.clientY);
                    e.preventDefault();
                }
            },
            scroll: e => { // this is scrollbars moving event, not mouse wheel
                // @TODO add feature
                // if (typeof this._settings.moved === "function") {
                //     self.settings.moved.call(self, self.settings);
                // }
                e.preventDefault();
            },
            wheel: e => {
                const offset = getOffset(e, this._el.children[0] as HTMLElement);
                if (e.deltaY < 0) {
                    this.zoomIn(offset.x, offset.y);
                    return;
                }
                this.zoomOut(offset.x, offset.y);
            },
            inputClick: e => {
                // @TODO velocity may be below 0 i guess? fix
                if (Math.abs(this._velocityX) > 0 || Math.abs(this._velocityY) > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            },
            dragStart: e => {
                if (this._useTarget(e.target, e) && this._elementFocused) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            },
            selectStart: e => {
                // if (typeof this.settings.selectStart === "function") {
                //     return this.settings.selectStart.apply(self, arguments);
                // }
                if (this._useTarget(e.target, e)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            },
        };

        this._attachListeners();
    }

    private readonly _attachListeners = () => {
        const el = this._el;

        if (_isTouch()) { // @TODO attach always?
            el.addEventListener("touchstart", this._events.touchStart, false);
            el.addEventListener("touchend", this._events.inputEnd, false);
            el.addEventListener("touchmove", this._events.touchMove, false);
        }

        el.addEventListener("mousedown", this._events.inputDown, false);
        el.addEventListener("mouseup", this._events.inputEnd, false);
        el.addEventListener("mousemove", this._events.inputMove, false);

        el.addEventListener("click", this._events.inputClick, false);
        el.addEventListener("scroll", this._events.scroll, false);
        el.addEventListener("selectstart", this._events.selectStart, false);
        el.addEventListener("dragstart", this._events.dragStart, false);

        el.addEventListener("wheel", this._events.wheel, true);
    };

    private readonly _detachListeners = () => {
        const el = this._el;

        if (_isTouch()) {
            el.removeEventListener("touchstart", this._events.touchStart, false);
            el.removeEventListener("touchend", this._events.inputEnd, false);
            el.removeEventListener("touchmove", this._events.touchMove, false);
        }

        el.removeEventListener("mousedown", this._events.inputDown, false);
        el.removeEventListener("mouseup", this._events.inputEnd, false);
        el.removeEventListener("mousemove", this._events.inputMove, false);

        el.removeEventListener("click", this._events.inputClick, false);
        el.removeEventListener("scroll", this._events.scroll, false);
        el.removeEventListener("selectstart", this._events.selectStart, false);
        el.removeEventListener("dragstart", this._events.dragStart, false);
    };

    private readonly _useTarget = (target: EventTarget | null, evt: Event) => {
        // @TODO add filtering support
        // if (typeof this.settings.filterTarget === "function") {
        //     return this.settings.filterTarget.call(this, target, event) !== false;
        // }
        return true;
    };

    private readonly _calcThreshold = (target: EventTarget | null, evt: Event) => {
        // @TODO support
        // if (typeof this.settings.threshold === "function") {
        //     return this.settings.threshold.call(this, target, event);
        // }
        return this._settings.threshold;
    };

    private readonly _resetMouse = () => {
        this._xpos = null;
        this._ypos = null;
        this._mouseDown = false;
    };

    private readonly _start = (clientX: number, clientY: number) => {
        this._mouseDown = true;
        this._velocityX = this._prevXPos = 0;
        this._velocityY = this._prevYPos = 0;
        this._xpos = clientX;
        this._ypos = clientY;
    };

    // eslint-disable-next-line max-statements
    private readonly _inputmove = (clientX: number, clientY: number) => {
        if (!this._lastMove || new Date() > new Date(this._lastMove.getTime() + this._throttleTimeout)) {
            this._lastMove = new Date();

            if (this._mouseDown && (this._xpos || this._ypos)) {
                let movedX = (clientX - (this._xpos ?? 0)),
                    movedY = (clientY - (this._ypos ?? 0));

                if (this._settings.invert) {
                    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                    movedX *= -1;
                    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                    movedY *= -1;
                }

                if (this._threshold > 0) {
                    const moved = Math.sqrt((movedX * movedX) + (movedY * movedY));
                    if (this._threshold > moved) {
                        return;
                    }

                    this._threshold = 0;
                }

                if (this._elementFocused) {
                    this._elementFocused.blur();
                    this._elementFocused = null;
                    this._el.focus();
                }

                this._settings.decelerate = false;
                this._velocityX = this._velocityY = 0;

                const scrollLeft = this._scrollLeft();
                const scrollTop = this._scrollTop();

                this._scrollLeft(this._settings.x ? scrollLeft - movedX : scrollLeft);
                this._scrollTop(this._settings.y ? scrollTop - movedY : scrollTop);

                this._prevXPos = this._xpos;
                this._prevYPos = this._ypos;
                this._xpos = clientX;
                this._ypos = clientY;

                this._calculateVelocities();
                // this._setMoveClasses(this.settings.movingClass); TODO

                // if (typeof this._settings.moved === "function") { TODO
                //     this._settings.moved.call(this, this.settings);
                // }
            }
        }
    };

    private readonly _end = () => {
        if (this._xpos == null || this._prevXPos == null || this._settings.decelerate === true) {
            return;
        }

        this._settings.decelerate = true; // @TODO this should not override settings?
        this._calculateVelocities();
        this._xpos = null;
        this._prevXPos = null;
        this._mouseDown = false;

        this._move();
    };

    private _scrollLeft<T>(left?: T): T extends number ? undefined : number {
        const scroller = this._getScroller();
        if (typeof left === "number") {
            scroller.scrollLeft = left;
            // @ts-expect-error TS doesn't like conditional returns implementations
            return;
        }
        // @ts-expect-error TS doesn't like conditional returns implementations
        return scroller.scrollLeft;
    }

    // eslint-disable-next-line @typescript-eslint/no-shadow
    private _scrollTop<T>(top?: T): T extends number ? undefined : number {
        const scroller = this._getScroller();
        if (typeof top === "number") {
            scroller.scrollTop = top;
            // @ts-expect-error TS doesn't like conditional returns implementations
            return;
        }
        // @ts-expect-error TS doesn't like conditional returns implementations
        return scroller.scrollTop;
    }

    // eslint-disable-next-line max-statements
    private _move() {
        const scroller = this._getScroller();
        const settings = this._settings;

        if (settings.x && scroller.scrollWidth > 0) {
            this._scrollLeft(this._scrollLeft() + this._velocityX);
            if (Math.abs(this._velocityX) > 0) {
                this._velocityX = settings.decelerate
                    ? VanillaKinetic._decelerateVelocity(this._velocityX, settings.slowdown)
                    : this._velocityX;
            }
        }
        else {
            this._velocityX = 0;
        }

        if (settings.y && scroller.scrollHeight > 0) {
            this._scrollTop(this._scrollTop() + this._velocityY);
            if (Math.abs(this._velocityY) > 0) {
                this._velocityY = settings.decelerate
                    ? VanillaKinetic._decelerateVelocity(this._velocityY, settings.slowdown)
                    : this._velocityY;
            }
        }
        else {
            this._velocityY = 0;
        }

        // self._setMoveClasses(settings.deceleratingClass); TODO

        // if (typeof settings.moved === "function") {
        //     settings.moved.call(this, settings);
        // }

        if (Math.abs(this._velocityX) > 0 || Math.abs(this._velocityY) > 0) {
            if (!this._moving) {
                this._moving = true;
                // tick for next movement
                requestAnimationFrame(() => {
                    this._moving = false;
                    this._move();
                });
            }
        }
        else {
            this.stop();
        }
    }

    private _calculateVelocities() {
        if (this._prevXPos == null || this._xpos == null || this._prevYPos == null || this._ypos == null) {
            return;
        }

        this._velocityX = VanillaKinetic._capVelocity(this._prevXPos - this._xpos, this._settings.maxvelocity);
        this._velocityY = VanillaKinetic._capVelocity(this._prevYPos - this._ypos, this._settings.maxvelocity);

        if (this._settings.invert) {
            this._velocityX *= -1;
            this._velocityY *= -1;
        }
    }

    private static _decelerateVelocity(velocity: number, slowdown: number) {
        return Math.floor(Math.abs(velocity)) === 0
            ? 0
            : velocity * slowdown;
    }

    private static _capVelocity(velocity: number, max: number) {
        let newVelocity = velocity;
        if (velocity > 0) {
            if (velocity > max) {
                newVelocity = max;
            }
        }
        else {
            if (velocity < (0 - max)) {
                newVelocity = (0 - max);
            }
        }
        return newVelocity;
    }

    private _getScroller() {
        // @TODO remove
        return this._el;
    }

    public start = (settings: Partial<Settings>) => {
        this._settings = {
            ...defaultSettings,
            ...settings,
        };

        this._settings.decelerate = false;
        this._move();
    };

    public stop = () => {
        this._velocityX = 0;
        this._velocityY = 0;
        this._settings.decelerate = true;
        // if (typeof this._settings.stopped === "function") { // TODO
        //     this._settings.stopped.call(this);
        // }
    };

    public end = () => {
        this._settings.decelerate = true;
    };

    private static readonly _calcZoomLevel = (zoom: number) => {
        return zoom > 0 ? Math.pow(ZOOM_MULTIPLIER, zoom) : 1 / Math.pow(ZOOM_MULTIPLIER, Math.abs(zoom));
    };

    // eslint-disable-next-line max-statements
    private readonly _applyZoom = (targetZoom: number, prevZoom: number, x?: number, y?: number) => {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const px = x ?? this._el.clientWidth / 2;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        const py = y ?? this._el.clientHeight / 2;

        const zoomLevel = VanillaKinetic._calcZoomLevel(targetZoom);
        const prevZoomLevel = VanillaKinetic._calcZoomLevel(prevZoom);

        const middle = this._el.children[0] as HTMLDivElement;
        const [natW, natH] = this._naturalContentDimensions;

        const newWidth = natW * zoomLevel;
        const newHeight = natH * zoomLevel;

        if (newWidth < this._el.clientWidth || newHeight < this._el.clientHeight) {
            return false;
        }

        const sx = this._el.scrollLeft;
        const sy = this._el.scrollTop;

        const ppx = px + sx;
        const ppy = py + sy;

        const rpx = ppx / prevZoomLevel;
        const rpy = ppy / prevZoomLevel;

        const nsx = (rpx * zoomLevel) - px;
        const nsy = (rpy * zoomLevel) - py;

        middle.style.height = `${natH * zoomLevel}px`;
        middle.style.transform = `scale(${zoomLevel})`;

        this._el.scrollLeft = nsx;
        this._el.scrollTop = nsy;

        return true;
    };

    public zoomIn = (x?: number, y?: number) => {
        const zoomed = this._applyZoom(this._zoom + 1, this._zoom, x, y);
        if (zoomed) {
            this._zoom++;
        }
    };

    public zoomOut = (x?: number, y?: number) => {
        const zoomed = this._applyZoom(this._zoom - 1, this._zoom, x, y);
        if (zoomed) {
            this._zoom--;
        }
    };

    public reinitialize() {
        if (this._active) {
            throw new Error("Already initialized");
        }

        this._init();
        this._attachListeners();
        this._active = true;
    }

    public destroy() {
        if (!this._active) {
            throw new Error("Already destroyed");
        }

        // @TODO cleanup trigger hardware
        this._deinit();
        this._detachListeners();

        this._active = false;
    }
}

export {
    VanillaKinetic,
};
