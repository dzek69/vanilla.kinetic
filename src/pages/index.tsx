import React from "react";
import { Kinetic } from "../demo/Kinetic.js";

interface Props {}

interface State {
    zoom: number;
    zoomStep: number;
}

class IndexComp extends React.Component<Props, State> {
    public constructor(props: Props) {
        super(props);

        this.state = {
            zoom: 1,
            zoomStep: 0,
        };
    }

    private readonly _handleZoom = (zoom: number, zoomStep: number) => {
        this.setState({ zoom, zoomStep });
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
                <Kinetic onZoom={this._handleZoom} />
                <div>
                    Zoom multiplier: {this.state.zoom}<br />
                    Zoom step: {this.state.zoomStep}
                </div>
                <div>
                    Wallpaper from: <a href={"https://imgur.com/t/high_quality/cQnOUbq"}>here</a>
                </div>
            </>
        );
    }
}

export default IndexComp;
