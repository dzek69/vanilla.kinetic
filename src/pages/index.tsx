import React from "react";
import { VanillaKinetic } from "..";

// @ts-expect-error Idk why TS started complaining here on Next.js project.
import styles from "./index.module.scss";

interface Props {}

class IndexComp extends React.Component<Props> {
    public constructor(props: Props) {
        super(props);
    }

    public shouldComponentUpdate() {
        return false;
    }

    private _mapInstance?: VanillaKinetic | null;

    private readonly onContainerRef = (ref: HTMLDivElement | null) => {
        if (!ref) {
            this._mapInstance?.destroy();
            this._mapInstance = null;
            return;
        }
        this._mapInstance = new VanillaKinetic(ref, {});
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

    public render() {
        return (
            <>
                <div>
                    Test<br />
                    Test<br />
                    Test<br />
                    Test<br />
                </div>
                <button onClick={this._handleAttachDetach}>attach / detach</button>
                <div ref={this.onContainerRef} className={styles.container}>
                    <div className={styles.middle}>
                        <img src={"https://i.imgur.com/6UhKWdy.jpeg"} alt={"Wallpaper"} />
                    </div>
                </div>
                <div>
                    Wallpaper from: <a href={"https://imgur.com/t/high_quality/cQnOUbq"}>here</a>
                </div>
            </>
        );
    }
}

export default IndexComp;
