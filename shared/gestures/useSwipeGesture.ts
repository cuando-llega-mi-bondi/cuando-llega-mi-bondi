"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useMotionValue, useTransform, animate } from "motion/react";

// ─── Constants ────────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 72;           // px to commit an action
const SWIPE_VELOCITY_THRESHOLD = 500; // px/s fast-flick shortcut
const ELASTIC_LIMIT = 120;            // max px before rubber-band resistance
const PEEK_WIDTH = 64;                // px the action reveals before threshold

// ─── Types ────────────────────────────────────────────────────────────────────
export type SwipeDirection = "left" | "right" | null;

export interface UseSwipeGestureOptions {
    /** Called when a right-swipe is committed (past threshold or fast flick) */
    onSwipeRight: () => void;
    /** Called when a left-swipe is committed (fly-out + remove) */
    onSwipeLeft: () => void;
}

/**
 * Hook that implements horizontal swipe gesture tracking with elastic resistance,
 * velocity-based fast-flick, axis locking, and commit animations.
 *
 * Returns motion values, transforms, pointer handlers, and a programmatic
 * `triggerRemove` for keyboard-triggered deletion.
 */
export function useSwipeGesture({ onSwipeRight, onSwipeLeft }: UseSwipeGestureOptions) {
    const x = useMotionValue(0);

    // Pointer state tracked in a ref to avoid re-renders during drag
    const drag = useRef({
        active: false,
        startX: 0,
        startY: 0,
        startTime: 0,
        direction: null as SwipeDirection,
        locked: false,
        lastX: 0,
        velocity: 0,
        prevTime: 0,
    });

    const [swipeDir, setSwipeDir] = useState<SwipeDirection>(null);
    const [committed, setCommitted] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    // ── Derived transforms ────────────────────────────────────────────────────

    const leftRevealWidth = useTransform(x, [0, ELASTIC_LIMIT], [0, ELASTIC_LIMIT]);
    const rightRevealWidth = useTransform(x, [-ELASTIC_LIMIT, 0], [ELASTIC_LIMIT, 0]);

    const leftIconScale = useTransform(x, [0, SWIPE_THRESHOLD, SWIPE_THRESHOLD + 8], [0.7, 1.15, 1]);
    const rightIconScale = useTransform(x, [-(SWIPE_THRESHOLD + 8), -SWIPE_THRESHOLD, 0], [1, 1.15, 0.7]);

    const leftLabelOpacity = useTransform(x, [16, PEEK_WIDTH], [0, 1]);
    const rightLabelOpacity = useTransform(x, [-PEEK_WIDTH, -16], [1, 0]);

    // ── Pointer handlers ──────────────────────────────────────────────────────

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (isRemoving) return;
        const d = drag.current;
        d.active = true;
        d.startX = e.clientX;
        d.startY = e.clientY;
        d.startTime = e.timeStamp;
        d.prevTime = e.timeStamp;
        d.lastX = e.clientX;
        d.velocity = 0;
        d.direction = null;
        d.locked = false;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }, [isRemoving]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        const d = drag.current;
        if (!d.active) return;

        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        const dt = e.timeStamp - d.prevTime;

        // Velocity tracking (px/ms → px/s)
        if (dt > 0) {
            d.velocity = ((e.clientX - d.lastX) / dt) * 1000;
        }
        d.lastX = e.clientX;
        d.prevTime = e.timeStamp;

        // Lock axis on first significant movement
        if (!d.locked) {
            if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
            if (Math.abs(dy) > Math.abs(dx)) {
                // Vertical scroll — release immediately
                d.active = false;
                return;
            }
            d.locked = true;
            d.direction = dx > 0 ? "right" : "left";
            setSwipeDir(d.direction);
        }

        e.preventDefault();

        // Apply elastic resistance beyond limit
        let targetX = dx;
        if (Math.abs(dx) > ELASTIC_LIMIT) {
            const overscroll = Math.abs(dx) - ELASTIC_LIMIT;
            const resistance = overscroll * 0.2;
            targetX = Math.sign(dx) * (ELASTIC_LIMIT + resistance);
        }

        x.set(targetX);
        setCommitted(Math.abs(targetX) >= SWIPE_THRESHOLD);
    }, [x]);

    const handlePointerUp = useCallback(() => {
        const d = drag.current;
        if (!d.active) return;
        d.active = false;

        const currentX = x.get();
        const absX = Math.abs(currentX);
        const fastFlick = Math.abs(d.velocity) > SWIPE_VELOCITY_THRESHOLD;

        setCommitted(false);

        if ((absX >= SWIPE_THRESHOLD || fastFlick) && d.direction) {
            if (d.direction === "right") {
                // Snap back and trigger right-swipe action
                animate(x, 0, { type: "spring", stiffness: 400, damping: 35 });
                setSwipeDir(null);
                setTimeout(() => onSwipeRight(), 120);
            } else {
                // Fly out left then trigger left-swipe action
                setIsRemoving(true);
                animate(x, -420, {
                    type: "tween",
                    duration: 0.22,
                    ease: [0.4, 0, 1, 1],
                    onComplete: () => onSwipeLeft(),
                });
            }
        } else {
            // Snap back with spring
            animate(x, 0, {
                type: "spring",
                stiffness: 500,
                damping: 38,
                velocity: d.velocity,
            });
            setSwipeDir(null);
        }
    }, [x, onSwipeRight, onSwipeLeft]);

    // ── Pointer-cancel cleanup ────────────────────────────────────────────────

    useEffect(() => {
        const cancel = () => {
            if (drag.current.active) {
                drag.current.active = false;
                animate(x, 0, { type: "spring", stiffness: 500, damping: 38 });
                setSwipeDir(null);
                setCommitted(false);
            }
        };
        window.addEventListener("pointercancel", cancel);
        return () => window.removeEventListener("pointercancel", cancel);
    }, [x]);

    // ── Programmatic remove (for keyboard shortcut) ───────────────────────────

    const triggerRemove = useCallback(() => {
        setIsRemoving(true);
        animate(x, -420, {
            type: "tween",
            duration: 0.22,
            ease: [0.4, 0, 1, 1],
            onComplete: () => onSwipeLeft(),
        });
    }, [x, onSwipeLeft]);

    return {
        /** Motion value for horizontal displacement */
        x,
        /** Current swipe direction for conditional rendering */
        swipeDir,
        /** Whether the swipe passed the commit threshold */
        committed,
        /** Whether the row is flying out (being removed) */
        isRemoving,
        /** Pointer event handlers to attach to the draggable element */
        pointerHandlers: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
        },
        /** Derived motion transforms for action-strip visuals */
        transforms: {
            leftRevealWidth,
            rightRevealWidth,
            leftIconScale,
            rightIconScale,
            leftLabelOpacity,
            rightLabelOpacity,
        },
        /** Programmatically trigger the left-swipe remove animation */
        triggerRemove,
    };
}
