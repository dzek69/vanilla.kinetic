import React, { useCallback } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";

import styles from "./TouchTest.module.scss";

const TouchTest: React.FC = () => {
    const handleTS1 = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
        console.info(e.touches);
    }, []);

    const handleTS2 = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
        console.info(e.touches);
    }, []);

    return (
        <div>
            <div className={styles.big1} onTouchStart={handleTS1} />
            <div className={styles.big2} onTouchStart={handleTS2} />
        </div>
    );
};

export { TouchTest };
