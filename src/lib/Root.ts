// @ts-nocheck
import { ACESFilmicToneMapping, Clock,PerspectiveCamera, Scene, Vector2, Vector3 } from "three/webgpu";
import { IAnimatedElement } from "./interfaces/IAnimatedElement";
import { pass, PostProcessing, WebGPURenderer } from "three/webgpu";
import { OrbitControls, TrackballControls } from "three/examples/jsm/Addons.js";
import WebGPU from "three/examples/jsm/capabilities/WebGPU.js";
import { LinkedParticles } from "./elements/LinkedParticles";


export class Root {

    static instance: Root;
    animatedElements: IAnimatedElement[] = [];
    static registerAnimatedElement(element: IAnimatedElement) {
        if (Root.instance == null) {
            throw new Error("Root instance not found");
        }
        if (Root.instance.animatedElements.indexOf(element) == -1) {
            Root.instance.animatedElements.push(element);
        }
    }

    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {

        this.canvas = canvas;

        if (Root.instance != null) {
            console.warn("Root instance already exists");
            return;
        }
        Root.instance = this;
    }

    async init() {
        
        this.initRenderer();
        this.initCamera();
        this.initPost();
        await this.initScene();
        

        this.clock.start();
        this.renderer!.setAnimationLoop(this.animate.bind(this));

        return new Promise<void>((resolve) => {
            resolve();
        });
    }

    renderer?: WebGPURenderer;
    clock: Clock = new Clock(false);
    post?: PostProcessing;
    initRenderer() {
        
        if (WebGPU.isAvailable() === false) { // doesn't work with WebGL2
            throw new Error('No WebGPU support');
        }

        this.renderer = new WebGPURenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        console.log("Renderer :", this.renderer);
        window.addEventListener('resize', this.onResize.bind(this));
    }

    camera: PerspectiveCamera = new PerspectiveCamera(70, 1, .01, 1000);
    controls?: OrbitControls | TrackballControls;
    initCamera() {
        const aspect: number = window.innerWidth / window.innerHeight;
        this.camera.aspect = aspect;
        this.camera.position.z = 10;
        this.camera.updateProjectionMatrix();
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.target.set(0, 0, 0);
    }

    postProcessing?: PostProcessing;
    bloomPass;
    initPost() {

        const {scene, camera, renderer} = this;
        const scenePass = pass(scene, camera);
        this.postProcessing = new PostProcessing( renderer!);
        this.postProcessing.outputNode = scenePass;

    }

    scene: Scene = new Scene();
    fx:LinkedParticles;
    async initScene() {
        this.fx = new LinkedParticles(this.scene, this.camera, this.controls as OrbitControls, this.renderer!, this.postProcessing);
        await this.fx.init();       
    }

    onResize( event, toSize?:Vector2 ) {
        const size:Vector2 = new Vector2(window.innerWidth, window.innerHeight);
        if(toSize) size.copy(toSize);

        this.camera.aspect = size.x / size.y;
        this.camera.updateProjectionMatrix();
        
        this.renderer!.setPixelRatio(1);
        this.renderer!.setSize(size.x, size.y);
        this.renderer!.domElement.style.width = `${size.x}px`;
        this.renderer!.domElement.style.height = `${size.y}px`;
    }

    elapsedFrames = 0;
    animate() {
        if (!this.capturing) {
            const dt: number = this.clock.getDelta();
            const elapsed: number = this.clock.getElapsedTime();
            this.controls!.update(dt);
            this.animatedElements.forEach((element) => {
                element.update(dt, elapsed);
            });
            this.postProcessing!.render();

            this.elapsedFrames++;
        }

    }

    static StartCapture(): void {
        if (Root.instance == null) {
            throw new Error("Root instance not found");
        }
        if( Root.instance.capturing ) {
            console.log( "Already capturing")
            return;
        }
        
        (async () => {
            await Root.instance.capture();
            console.log( "Capture done");
        })();
    }

    capturing: boolean = false;
    savedPosition:Vector3 = new Vector3();
    async capture() {
        try {
            this.capturing = true;
            
            const resolution:Vector2 = new Vector2(window.innerWidth,window.innerHeight);
            this.onResize(null, resolution);


            await new Promise(resolve => setTimeout(resolve, 20));
            await this.postProcessing!.renderAsync();
            
            const strMime = "image/jpeg";
            const imgData = this.renderer.domElement.toDataURL(strMime, 1.0);
            const strDownloadMime: string = "image/octet-stream";
            const filename: string = `particles_${(Date.now())}.jpg`

            await this.saveFile(imgData.replace(strMime, strDownloadMime), filename);

        } catch (e) {
            console.log(e);
            return;
        }

    }

    async saveFile(strData, filename) {
        const link = document.createElement('a');
        if (typeof link.download === 'string') {
            this.renderer.domElement.appendChild(link);
            link.download = filename;
            link.href = strData;
            link.click();
            this.renderer.domElement.removeChild(link);
        } else {
            //
        }
        await new Promise(resolve => setTimeout(resolve, 10));
       
        this.onResize(null);
        this.capturing = false;
    }
} 