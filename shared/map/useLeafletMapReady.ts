import { useEffect, useState } from "react";

/**
 * Defers Leaflet `MapContainer` until after mount and tears it down before unmount.
 * Avoids "container is being reused" and appendChild errors on client navigations
 * and React Strict Mode double-mount (react-leaflet v5).
 */
export function useLeafletMapReady() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setReady(true);
        return () => setReady(false);
    }, []);

    return ready;
}
