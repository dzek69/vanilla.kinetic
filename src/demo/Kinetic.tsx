import type { SyntheticEvent } from "react";
import React from "react";
import { VanillaKinetic } from "..";

import styles from "./Kinetic.module.scss";

interface Props {
    onZoom: (zoomMultiplier: number, zoomLevel: number) => void;
}

class Kinetic extends React.Component<Props> {
    public constructor(props: Props) {
        super(props);
    }

    public shouldComponentUpdate() {
        return false;
    }

    private _mapInstance?: VanillaKinetic | null;

    private readonly onContainerRef = (ref: HTMLDivElement | null) => {
        if (!ref) {
            if (this._mapInstance) {
                if (this._mapInstance.active) {
                    this._mapInstance.destroy();
                }
                this._mapInstance = null;
            }
            return;
        }
        this._mapInstance = new VanillaKinetic(ref, {
            filterTarget: (e) => {
                if ((e.target as HTMLElement | undefined)?.nodeName.toLowerCase() === "button") {
                    return false;
                }
                return true;
            },
        });
        this._mapInstance.on("zoom", this.props.onZoom);
        this._mapInstance.center();

        const img = ref.querySelector("img");
        if (img?.naturalWidth) {
            this.handleImageLoad({ currentTarget: img });
        }
    };

    private readonly handleImageLoad = (evt: Pick<SyntheticEvent<HTMLImageElement>, "currentTarget">) => {
        const target = evt.currentTarget;
        this._mapInstance?.setNaturalDimensions(target.naturalWidth, target.naturalHeight);
        // this._mapInstance?.setZoom("fit");
        this._mapInstance?.center();
    };

    private readonly _handleAttachDetach = () => {
        if (!this._mapInstance) {
            return;
        }

        if (this._mapInstance.active) {
            this._mapInstance.destroy();
        }
        else {
            this._mapInstance.reinitialize();
        }
    };

    private readonly _handleZoom25 = () => {
        if (!this._mapInstance) {
            return;
        }

        this._mapInstance.setZoom("fit");
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        for (let i = 0; i <= 30; i++) {
            setTimeout(() => {
                this._mapInstance?.zoomIn("25%", "25%");
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            }, 16 * i);
        }
    };

    private readonly _handleButtonClick = () => {
        alert("clicked");
    };

    public render() {
        return (
            <>
                <button onClick={this._handleAttachDetach}>attach / detach</button>
                <button onClick={this._handleZoom25}>Zoom demo on 25% X, Y position</button>
                <div ref={this.onContainerRef} className={styles.container}>
                    <div className={styles.middle}>
                        <img src={"https://i.imgur.com/6UhKWdy.jpeg"} alt={"Wallpaper"} onLoad={this.handleImageLoad} />
                        <button onClick={this._handleButtonClick}>click me!</button>
                    </div>
                </div>
            </>
        );
    }
}

export { Kinetic };
