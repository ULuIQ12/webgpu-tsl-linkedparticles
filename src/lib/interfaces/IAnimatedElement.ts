/**
 * Small interface for animated elements
 */
export interface IAnimatedElement {
    update(dt: number, elapsed: number): void;
}