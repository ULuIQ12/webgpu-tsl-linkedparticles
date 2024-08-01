import { useEffect, useRef } from "react";
import { Root } from "../lib/Root";

export default function ThreeRoot() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas == null) {
            throw new Error('Canvas not found');
        }
        const scene: Root = new Root(canvas);

        (async () => {
            await scene.init();
        })();

    }, []);

    useEffect(() => {
        const canvas: HTMLCanvasElement | null = canvasRef.current;

        const resizeCanvas = () => {
            if (canvas == null) throw new Error('Canvas not found');

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
        }
        window.addEventListener('resize', resizeCanvas);

        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        }
    }, []);

    return (
        <canvas ref={canvasRef} id="threecanvas"></canvas>
    );
}