"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useMotionValue, useTransform, animate } from "motion/react";

// ─── Constants ────────────────────────────────────────────────────────────────
const REVEAL_SNAP_X = 80;
const FULL_SWIPE_THRESHOLD = 180;
const SWIPE_VELOCITY_THRESHOLD = 500;
const ELASTIC_LIMIT = 260;
const PEEK_WIDTH = 64;

export type SwipeDirection = "left" | "right" | null;

export interface UseSwipeGestureOptions {
    onSwipeRight: () => void;
    onSwipeLeft: () => void;
}

export function useSwipeGesture({ onSwipeRight, onSwipeLeft }: UseSwipeGestureOptions) {
    const x = useMotionValue(0);

    const drag = useRef({
        active: false,
        startX: 0,
        startY: 0,
        startElementX: 0,
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

    const leftRevealWidth = useTransform(x, [0, ELASTIC_LIMIT], [0, ELASTIC_LIMIT]);
    const rightRevealWidth = useTransform(x, [-ELASTIC_LIMIT, 0], [ELASTIC_LIMIT, 0]);

    const leftIconScale = useTransform(x, [0, REVEAL_SNAP_X, FULL_SWIPE_THRESHOLD], [0.7, 1, 1.15]);
    const rightIconScale = useTransform(x, [-FULL_SWIPE_THRESHOLD, -REVEAL_SNAP_X, 0], [1.15, 1, 0.7]);

    const leftLabelOpacity = useTransform(x, [16, PEEK_WIDTH], [0, 1]);
    const rightLabelOpacity = useTransform(x, [-PEEK_WIDTH, -16], [1, 0]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (isRemoving) return;
        const d = drag.current;
        d.active = true;
        d.startX = e.clientX;
        d.startY = e.clientY;
        d.startElementX = x.get();
        d.startTime = e.timeStamp;
        d.prevTime = e.timeStamp;
        d.lastX = e.clientX;
        d.velocity = 0;
        d.direction = x.get() > 0 ? "right" : x.get() < 0 ? "left" : null;
        d.locked = false;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }, [isRemoving, x]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        const d = drag.current;
        if (!d.active) return;

        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        const dt = e.timeStamp - d.prevTime;

        if (dt > 0) {
            d.velocity = ((e.clientX - d.lastX) / dt) * 1000;
        }
        d.lastX = e.clientX;
        d.prevTime = e.timeStamp;

        if (!d.locked) {
            if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
            if (Math.abs(dy) > Math.abs(dx)) {
                d.active = false;
                return;
            }
            d.locked = true;
        }

        e.preventDefault();

        let targetXRaw = d.startElementX + dx;
        
        // Prevent swiping past the closed state into the opposite direction when starting from a snapped state
        if (d.startElementX === REVEAL_SNAP_X && targetXRaw < 0) {
             targetXRaw = targetXRaw * 0.1;
        } else if (d.startElementX === -REVEAL_SNAP_X && targetXRaw > 0) {
             targetXRaw = targetXRaw * 0.1;
        }

        // Apply elastic resistance globally
        let targetX = targetXRaw;
        if (Math.abs(targetXRaw) > ELASTIC_LIMIT) {
            const overscroll = Math.abs(targetXRaw) - ELASTIC_LIMIT;
            const resistance = overscroll * 0.2;
            targetX = Math.sign(targetXRaw) * (ELASTIC_LIMIT + resistance);
        }

        x.set(targetX);
        
        const currentDir = targetX > 0 ? "right" : targetX < 0 ? "left" : null;
        setSwipeDir(currentDir);
        d.direction = currentDir;

        setCommitted(Math.abs(targetX) >= FULL_SWIPE_THRESHOLD);
    }, [x]);

    const handlePointerUp = useCallback(() => {
        const d = drag.current;
        if (!d.active) return;
        d.active = false;

        const currentX = x.get();
        const absX = Math.abs(currentX);
        const fastFlick = Math.abs(d.velocity) > SWIPE_VELOCITY_THRESHOLD;
        const sameDirFlick = Math.sign(d.velocity) === Math.sign(currentX);

        setCommitted(false);

        // 1. Full Commit (auto execute)
        if ((absX >= FULL_SWIPE_THRESHOLD || (fastFlick && sameDirFlick && absX > 40)) && d.direction) {
            if (d.direction === "right") {
                animate(x, 0, { type: "spring", stiffness: 400, damping: 35 });
                setSwipeDir(null);
                setTimeout(() => onSwipeRight(), 120);
            } else {
                setIsRemoving(true);
                animate(x, -420, {
                    type: "tween",
                    duration: 0.22,
                    ease: [0.4, 0, 1, 1],
                    onComplete: () => onSwipeLeft(),
                });
            }
        } 
        // 2. Snap Open (Reveal state)
        else if (absX >= 40 && (!fastFlick || sameDirFlick) && d.direction) {
            const snapX = d.direction === "right" ? REVEAL_SNAP_X : -REVEAL_SNAP_X;
            animate(x, snapX, { type: "spring", stiffness: 500, damping: 38 });
            setSwipeDir(d.direction);
        } 
        // 3. Snap Closed
        else {
            animate(x, 0, {
                type: "spring",
                stiffness: 500,
                damping: 38,
                velocity: d.velocity,
            });
            setTimeout(() => setSwipeDir(null), 150);
        }
    }, [x, onSwipeRight, onSwipeLeft]);

    const close = useCallback(() => {
        animate(x, 0, { type: "spring", stiffness: 500, damping: 38 });
        setTimeout(() => setSwipeDir(null), 150);
    }, [x]);

    useEffect(() => {
        const cancel = () => {
            if (drag.current.active) {
                drag.current.active = false;
                close();
            }
        };
        window.addEventListener("pointercancel", cancel);
        return () => window.removeEventListener("pointercancel", cancel);
    }, [x, close]);

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
        /** Programmatically snap the row back to 0 (close it) */
        close,
    };
}
