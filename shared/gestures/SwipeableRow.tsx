"use client";

import { memo, type ReactNode } from "react";
import { motion } from "motion/react";
import { Card } from "@shared/ui/Card";
import { useSwipeGesture } from "./useSwipeGesture";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Visual configuration for a swipe action strip */
export interface SwipeAction {
    /** Background color in idle state (e.g. "#1a73e8") */
    color: string;
    /** Background color when committed past threshold */
    commitColor: string;
    /** Icon element (SVG component) */
    icon: ReactNode;
    /** Short label (e.g. "Ver", "Borrar") */
    label: string;
}

export interface SwipeableRowProps {
    /** Action strip revealed when swiping right */
    leftAction: SwipeAction;
    /** Action strip revealed when swiping left */
    rightAction: SwipeAction;
    /** Called when a right-swipe is committed */
    onSwipeRight: () => void;
    /** Called when a left-swipe is committed (item will fly out) */
    onSwipeLeft: () => void;
    /** Called on tap / click (only fires if no swipe occurred) */
    onTap: () => void;
    /** Extra keyboard handler (runs before built-in Enter/Delete handlers) */
    onExtraKeyDown?: (e: React.KeyboardEvent) => void;
    /** Accessible label describing the row and its gesture actions */
    ariaLabel: string;
    /** Focus ring color (defaults to "#1a73e8") */
    focusRingColor?: string;
    /** Stagger index for enter animation delay */
    index: number;
    /** Card content */
    children: ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SwipeableRow = memo(function SwipeableRow({
    leftAction,
    rightAction,
    onSwipeRight,
    onSwipeLeft,
    onTap,
    onExtraKeyDown,
    ariaLabel,
    focusRingColor = "#1a73e8",
    index,
    children,
}: SwipeableRowProps) {
    const {
        x,
        swipeDir,
        committed,
        pointerHandlers,
        transforms,
        triggerRemove,
        close,
    } = useSwipeGesture({ onSwipeRight, onSwipeLeft });

    const {
        leftIconScale,
        rightIconScale,
        leftLabelOpacity,
        rightLabelOpacity,
    } = transforms;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
                opacity: 0,
                height: 0,
                marginBottom: 0,
                transition: { duration: 0.18, ease: "easeIn" },
            }}
            transition={{
                layout: { type: "spring", stiffness: 500, damping: 40 },
                opacity: { duration: 0.2, delay: index * 0.04 },
                y: { duration: 0.25, delay: index * 0.04 },
            }}
            style={{ position: "relative", overflow: "hidden", borderRadius: 14 }}
        >
            {/* ── Left action background (revealed when card slides right) ── */}
            {swipeDir === "right" && (
                <div
                    aria-hidden="true"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSwipeRight();
                        close();
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 14,
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: 16,
                        gap: 8,
                        backgroundColor: committed
                            ? leftAction.commitColor
                            : leftAction.color,
                        transition: "background-color 0.15s",
                        cursor: "pointer",
                    }}
                >
                    <motion.span
                        style={{
                            scale: leftIconScale,
                            color: "#fff",
                            lineHeight: 1,
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        {leftAction.icon}
                    </motion.span>
                    <motion.span
                        style={{
                            opacity: leftLabelOpacity,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#fff",
                            letterSpacing: "0.6px",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {leftAction.label}
                    </motion.span>
                </div>
            )}

            {/* ── Right action background (revealed when card slides left) ── */}
            {swipeDir === "left" && (
                <div
                    aria-hidden="true"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSwipeLeft();
                        close();
                    }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        paddingRight: 16,
                        gap: 8,
                        backgroundColor: committed
                            ? rightAction.commitColor
                            : rightAction.color,
                        transition: "background-color 0.15s",
                        cursor: "pointer",
                    }}
                >
                    <motion.span
                        style={{
                            opacity: rightLabelOpacity,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#fff",
                            letterSpacing: "0.6px",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {rightAction.label}
                    </motion.span>
                    <motion.span
                        style={{
                            scale: rightIconScale,
                            color: "#fff",
                            lineHeight: 1,
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        {rightAction.icon}
                    </motion.span>
                </div>
            )}

            {/* ── Draggable card ── */}
            <motion.div
                {...pointerHandlers}
                onClick={(e) => {
                    const currentX = Math.abs(x.get());
                    // If card is already snapped open, tapping it closes it.
                    if (currentX > 20) {
                        e.stopPropagation();
                        close();
                    } else if (currentX < 4) {
                        // Regular tap
                        onTap();
                    }
                }}
                onKeyDown={(e) => {
                    // Let consumer intercept first
                    onExtraKeyDown?.(e);
                    if (e.defaultPrevented) return;

                    if (e.key === "Enter" || e.key === " ") onTap();
                    if (e.key === "Delete" || e.key === "Backspace") triggerRemove();
                    if (e.key === "Escape") close();
                }}
                tabIndex={0}
                role="button"
                aria-label={ariaLabel}
                style={{
                    x,
                    position: "relative",
                    zIndex: 1,
                    touchAction: "pan-y",
                    userSelect: "none",
                    cursor: "pointer",
                    outline: "none",
                }}
                whileFocus={{ boxShadow: `0 0 0 2px ${focusRingColor}` }}
            >
                <Card className="px-3.5 py-3 transition-colors hover:bg-muted/30 active:bg-muted/40">
                    {children}
                </Card>
            </motion.div>
        </motion.div>
    );
});
