import { useEffect, useRef, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
import './TargetCursor.css';

const TargetCursor = ({
    targetSelector = 'button, a, .cursor-target, .card, .nav-item, input, select, textarea, [role="button"]',
    spinDuration = 2,
    hideDefaultCursor = true,
    hoverDuration = 0.2,
    parallaxOn = true
}) => {
    const cursorRef = useRef(null);
    const cornersRef = useRef(null);
    const spinTl = useRef(null);
    const dotRef = useRef(null);

    const isActiveRef = useRef(false);
    const targetCornerPositionsRef = useRef(null);
    const tickerFnRef = useRef(null);
    const activeStrengthRef = useRef(0);

    // Background Environment Refs
    const gridRef = useRef(null);
    const glowRef = useRef(null);
    const scanRef = useRef(null);
    const trailRef = useRef(null);
    const trailPosRef = useRef({
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0
    });

    const isMobile = useMemo(() => {
        if (typeof window === 'undefined') return false;
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        const isMobileUserAgent = mobileRegex.test(userAgent.toLowerCase());
        return (hasTouchScreen && isSmallScreen) || isMobileUserAgent;
    }, []);

    const constants = useMemo(
        () => ({
            borderWidth: 2,
            cornerSize: 8
        }),
        []
    );

    const moveCursor = useCallback((x, y) => {
        if (!cursorRef.current) return;
        gsap.to(cursorRef.current, {
            x,
            y,
            duration: 0.1,
            ease: 'power3.out'
        });
    }, []);

    useEffect(() => {
        if (isMobile || !cursorRef.current) return;

        const originalCursor = document.body.style.cursor;
        if (hideDefaultCursor) {
            document.body.style.cursor = 'none';
        }

        const cursor = cursorRef.current;
        cornersRef.current = cursor.querySelectorAll('.target-cursor-corner');

        let activeTarget = null;
        let currentLeaveHandler = null;
        let resumeTimeout = null;

        const cleanupTarget = target => {
            if (currentLeaveHandler) {
                target.removeEventListener('mouseleave', currentLeaveHandler);
            }
            currentLeaveHandler = null;
        };

        gsap.set(cursor, {
            xPercent: -50,
            yPercent: -50,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        });

        const createSpinTimeline = () => {
            if (spinTl.current) {
                spinTl.current.kill();
            }
            spinTl.current = gsap
                .timeline({ repeat: -1 })
                .to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' });
        };

        createSpinTimeline();

        // Init background environment properties
        gsap.set([glowRef.current, scanRef.current], { xPercent: -50, yPercent: -50 });
        gsap.set(trailRef.current, { yPercent: -50, transformOrigin: 'left center' });

        // Radar scan loop
        const scanTl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });
        scanTl.fromTo(scanRef.current,
            { scale: 0.1, opacity: 0.6 },
            { scale: 3.5, opacity: 0, duration: 2, ease: 'power2.out' }
        );

        const tickerFn = () => {
            if (!cursorRef.current) return;

            const cursorX = gsap.getProperty(cursorRef.current, 'x');
            const cursorY = gsap.getProperty(cursorRef.current, 'y');

            // 1. GLOBAL BACKGROUND TRACKING (Always Runs)
            if (gridRef.current) {
                gridRef.current.style.setProperty('--mouse-x', `${cursorX}px`);
                gridRef.current.style.setProperty('--mouse-y', `${cursorY}px`);
            }

            if (glowRef.current && scanRef.current) {
                gsap.set([glowRef.current, scanRef.current], { x: cursorX, y: cursorY });
            }

            // Motion Trail kinematics based on distance lag
            if (trailRef.current) {
                const trailDt = 1.0 - Math.pow(1.0 - 0.15, gsap.ticker.deltaRatio());
                trailPosRef.current.x += (cursorX - trailPosRef.current.x) * trailDt;
                trailPosRef.current.y += (cursorY - trailPosRef.current.y) * trailDt;

                const dx = trailPosRef.current.x - cursorX;
                const dy = trailPosRef.current.y - cursorY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                gsap.set(trailRef.current, {
                    x: cursorX,
                    y: cursorY,
                    width: Math.min(distance * 1.8, 300), // Elongate proportionally to speed
                    rotation: angle + 'rad',
                    opacity: Math.min(distance / 60, 0.4) // Fade streak when slow
                });
            }

            // 2. TARGET CORNER SNAPPING (Requires Hover State)
            if (!targetCornerPositionsRef.current || !cornersRef.current) return;

            const strength = activeStrengthRef.current;
            if (strength === 0) return;

            const corners = Array.from(cornersRef.current);
            corners.forEach((corner, i) => {
                const currentX = gsap.getProperty(corner, 'x');
                const currentY = gsap.getProperty(corner, 'y');

                const targetX = targetCornerPositionsRef.current[i].x - cursorX;
                const targetY = targetCornerPositionsRef.current[i].y - cursorY;

                const finalX = currentX + (targetX - currentX) * strength;
                const finalY = currentY + (targetY - currentY) * strength;

                const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;

                gsap.to(corner, {
                    x: finalX,
                    y: finalY,
                    duration: duration,
                    ease: duration === 0 ? 'none' : 'power1.out',
                    overwrite: 'auto'
                });
            });
        };

        tickerFnRef.current = tickerFn;

        // Add globally so the environment effects track instantly outside hovers
        gsap.ticker.add(tickerFnRef.current);

        const moveHandler = e => moveCursor(e.clientX, e.clientY);
        window.addEventListener('mousemove', moveHandler);

        const scrollHandler = () => {
            if (!activeTarget || !cursorRef.current) return;
            const mouseX = gsap.getProperty(cursorRef.current, 'x');
            const mouseY = gsap.getProperty(cursorRef.current, 'y');
            const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
            const isStillOverTarget =
                elementUnderMouse &&
                (elementUnderMouse === activeTarget || (elementUnderMouse.closest && elementUnderMouse.closest(targetSelector) === activeTarget));
            if (!isStillOverTarget) {
                if (currentLeaveHandler) {
                    currentLeaveHandler();
                }
            }
        };
        window.addEventListener('scroll', scrollHandler, { passive: true });

        const mouseDownHandler = () => {
            if (!dotRef.current) return;
            gsap.to(dotRef.current, { scale: 0.7, duration: 0.3 });
            gsap.to(cursorRef.current, { scale: 0.9, duration: 0.2 });
        };

        const mouseUpHandler = () => {
            if (!dotRef.current) return;
            gsap.to(dotRef.current, { scale: 1, duration: 0.3 });
            gsap.to(cursorRef.current, { scale: 1, duration: 0.2 });
        };

        window.addEventListener('mousedown', mouseDownHandler);
        window.addEventListener('mouseup', mouseUpHandler);

        const enterHandler = e => {
            const directTarget = e.target;
            const allTargets = [];
            let current = directTarget;
            while (current && current !== document.body) {
                if (current.matches && current.matches(targetSelector)) {
                    allTargets.push(current);
                }
                current = current.parentElement;
            }
            const target = allTargets[0] || null;
            if (!target || !cursorRef.current || !cornersRef.current) return;
            if (activeTarget === target) return;
            if (activeTarget) {
                cleanupTarget(activeTarget);
            }
            if (resumeTimeout) {
                clearTimeout(resumeTimeout);
                resumeTimeout = null;
            }

            activeTarget = target;
            const corners = Array.from(cornersRef.current);
            corners.forEach(corner => gsap.killTweensOf(corner));

            gsap.killTweensOf(cursorRef.current, 'rotation');
            spinTl.current?.pause();
            gsap.set(cursorRef.current, { rotation: 0 });

            const rect = target.getBoundingClientRect();
            const { borderWidth, cornerSize } = constants;
            const cursorX = gsap.getProperty(cursorRef.current, 'x');
            const cursorY = gsap.getProperty(cursorRef.current, 'y');

            targetCornerPositionsRef.current = [
                { x: rect.left - borderWidth, y: rect.top - borderWidth },
                { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
                { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
                { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize }
            ];

            isActiveRef.current = true;

            gsap.to(activeStrengthRef, {
                current: 1,
                duration: hoverDuration,
                ease: 'power2.out'
            });

            corners.forEach((corner, i) => {
                gsap.to(corner, {
                    x: targetCornerPositionsRef.current[i].x - cursorX,
                    y: targetCornerPositionsRef.current[i].y - cursorY,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });

            const leaveHandler = () => {
                isActiveRef.current = false;
                targetCornerPositionsRef.current = null;
                gsap.set(activeStrengthRef, { current: 0, overwrite: true });
                activeTarget = null;

                if (cornersRef.current) {
                    const corners = Array.from(cornersRef.current);
                    gsap.killTweensOf(corners);
                    const { cornerSize } = constants;
                    const positions = [
                        { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
                        { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
                        { x: cornerSize * 0.5, y: cornerSize * 0.5 },
                        { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
                    ];
                    const tl = gsap.timeline();
                    corners.forEach((corner, index) => {
                        tl.to(
                            corner,
                            {
                                x: positions[index].x,
                                y: positions[index].y,
                                duration: 0.3,
                                ease: 'power3.out'
                            },
                            0
                        );
                    });
                }

                resumeTimeout = setTimeout(() => {
                    if (!activeTarget && cursorRef.current && spinTl.current) {
                        const currentRotation = gsap.getProperty(cursorRef.current, 'rotation');
                        const normalizedRotation = currentRotation % 360;
                        spinTl.current.kill();
                        spinTl.current = gsap
                            .timeline({ repeat: -1 })
                            .to(cursorRef.current, { rotation: '+=360', duration: spinDuration, ease: 'none' });
                        gsap.to(cursorRef.current, {
                            rotation: normalizedRotation + 360,
                            duration: spinDuration * (1 - normalizedRotation / 360),
                            ease: 'none',
                            onComplete: () => {
                                spinTl.current?.restart();
                            }
                        });
                    }
                    resumeTimeout = null;
                }, 50);

                cleanupTarget(target);
            };

            currentLeaveHandler = leaveHandler;
            target.addEventListener('mouseleave', leaveHandler);
        };

        window.addEventListener('mouseover', enterHandler, { passive: true });

        return () => {
            if (tickerFnRef.current) {
                gsap.ticker.remove(tickerFnRef.current);
            }

            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseover', enterHandler);
            window.removeEventListener('scroll', scrollHandler);
            window.removeEventListener('mousedown', mouseDownHandler);
            window.removeEventListener('mouseup', mouseUpHandler);

            if (activeTarget) {
                cleanupTarget(activeTarget);
            }

            spinTl.current?.kill();
            scanTl.kill(); // Cleanup radar
            document.body.style.cursor = originalCursor;

            isActiveRef.current = false;
            targetCornerPositionsRef.current = null;
            activeStrengthRef.current = 0;
        };
    }, [targetSelector, spinDuration, moveCursor, constants, hideDefaultCursor, isMobile, hoverDuration, parallaxOn]);

    useEffect(() => {
        if (isMobile || !cursorRef.current || !spinTl.current) return;
        if (spinTl.current.isActive()) {
            spinTl.current.kill();
            spinTl.current = gsap
                .timeline({ repeat: -1 })
                .to(cursorRef.current, { rotation: '+=360', duration: spinDuration, ease: 'none' });
        }
    }, [spinDuration, isMobile]);

    if (isMobile) {
        return null;
    }

    return (
        <>
            {/* Dynamic Background Effects */}
            <div className="sys-env-wrapper">
                <div className="sys-grid-base" />
                <div className="sys-grid-interactive" ref={gridRef} />
                <div className="sys-env-glow" ref={glowRef} />
                <div className="sys-env-scan" ref={scanRef} />
                <div className="sys-env-trail" ref={trailRef} />
            </div>

            <div ref={cursorRef} className="target-cursor-wrapper">
                <div ref={dotRef} className="target-cursor-dot" />
                <div className="target-cursor-corner corner-tl" />
                <div className="target-cursor-corner corner-tr" />
                <div className="target-cursor-corner corner-br" />
                <div className="target-cursor-corner corner-bl" />
            </div>
        </>
    );
};

export default TargetCursor;
