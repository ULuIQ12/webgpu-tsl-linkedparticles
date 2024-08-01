
// @ts-nocheckqsdqsd
import { Pointer } from "../utils/Pointer";
import { IAnimatedElement } from "../interfaces/IAnimatedElement";
import { color, loop, Continue, cond, float, If, instanceIndex, int, min, mix, mx_fractal_noise_float, SpriteNodeMaterial, storage, StorageBufferAttribute, StorageInstancedBufferAttribute, timerDelta, tslFn, uniform, uv, vec3, WebGPURenderer, vec2, sin, cos, MeshStandardNodeMaterial, PI2, gain, timerLocal, step, smoothstep, abs, sub, mul, normalView, normalLocal, normalGeometry, texture, atan2, PI, positionLocal, max, MeshSSSPhysicalNodeMaterial, pow, RGBA_ASTC_4x4_Format, MultiplyBlending, positionWorld, discard, Uint16BufferAttribute, StreamReadUsage, Uint32BufferAttribute, storageObject, mx_fractal_noise_vec3, AdditiveBlending, MeshBasicNodeMaterial, DoubleSide, positionGeometry, varying, clamp, sign, dot, length, MathUtils, timerGlobal, BackSide, acos, fract, mx_worley_noise_float, floor, add, mod, vec4, pcurve, PostProcessing, pass, bloom, rgbShift, viewportTopLeft, Float32BufferAttribute, ShaderNodeObject, StorageBufferNode, Vector2, ACESFilmicToneMapping, cameraPosition } from "three/webgpu";
import { AmbientLight, BufferGeometry, Color, DirectionalLight, DirectionalLightHelper, DirectionalLightShadow, DynamicDrawUsage, EquirectangularReflectionMapping, Group, IcosahedronGeometry, InstancedMesh, Mesh, MeshBasicMaterial, MeshStandardMaterial, PCFSoftShadowMap, PerspectiveCamera, Plane, PlaneGeometry, RepeatWrapping, Scene, SpotLight, TextureLoader, Vector3 } from "three/webgpu";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import { Root } from "../Root";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Linked particles
 * Particles spawn at the cursor position and move along a turbulence field
 * Each particle is linked by a quad to its two closest neighbors
 * Includes a background with a hexagonal pattern
 * And a lot of post processing
 * Inspired by https://github.com/keijiro/VFXCustomCode
 */
export class LinkedParticles implements IAnimatedElement {

	scene: Scene;
	camera: PerspectiveCamera;
	renderer: WebGPURenderer;
	controls: OrbitControls;
	gui: GUI;
	pointerHandler: Pointer;
	post: PostProcessing;

	constructor(scene: Scene, camera: PerspectiveCamera, controls: OrbitControls, renderer: WebGPURenderer, post: PostProcessing) {

		Object.assign(this, { scene, camera, controls, renderer, post });

		this.renderer.toneMapping = ACESFilmicToneMapping;
		this.renderer.toneMappingExposure = 1.3;
		this.controls.enableDamping = true;
		this.controls.autoRotateSpeed = 2.0;
		this.controls.autoRotate = true;
		this.controls.dampingFactor = 0.1;

		this.camera.position.set(0, 3, 10);
		this.camera.lookAt(0, 0, 0);
		this.camera.updateMatrixWorld();

		// this handles cursor projection and provides a uniform for the cursor position
		this.pointerHandler = new Pointer(this.renderer, this.camera, new Plane(new Vector3(0, 0, 1), 0), true);

		this.gui = new GUI();
		this.gui.domElement.style.left = "8px"; // windows capture is over it when on the right side
		
	}

	async init() {

		Root.registerAnimatedElement(this); // this.just add this instance to the list of animated elements in the root class so that update is called on each frame
		await this.initParticles(); 
		await this.initLinks(); 
		this.initPost();
		this.initBG();
		this.initGUI();
	}

	uTimeScale = uniform(1.0);
	uParticleSize = uniform(1);
	uParticleLifetime = uniform(1);
	uLinksWidth = uniform(0.005);
	uColorVariance = uniform(2.0);
	uColorRotationSpeed = uniform(1.0);
	uColorOffset = uniform(0.0);
	useRGBShift = true;
	uUseRGBShift = uniform(1);
	useAnamorphic = false;
	uUseAnamorphic = uniform(0);
	uUseBlur = uniform(1);
	useBlur = true;


	turbFrequency = uniform(0.5);
	turbAmplitude = uniform(0.5);
	turbOctaves = uniform(2);
	turbLacunarity = uniform(2.0);
	turbGain = uniform(0.5);
	turbFriction = uniform(0.02);

	uCamFadeThreshold = uniform(3.0 * 3.0); // squared dist

	initGUI() {

		this.gui.add(this.uTimeScale, 'value').min(0.0).max(2.0).step(0.01).name('Time Scale');
		this.gui.add(this.uSpawnCursorNb, 'value').min(1).max(100).step(1).name('Spawn Rate');
		this.gui.add(this.uParticleSize, 'value').min(0.01).max(3).step(0.01).name('Particle Size');
		this.gui.add(this.uParticleLifetime, 'value').min(0.01).max(2.0).step(0.01).name('Particle Lifetime');
		this.gui.add(this.uLinksWidth, 'value').min(0.001).max(0.1).step(0.001).name('Links Width');
		this.gui.add(this.uColorVariance, 'value').min(0.0).max(10.0).step(0.01).name('Color Variance');
		this.gui.add(this.uColorRotationSpeed, 'value').min(0.0).max(5.0).step(0.01).name('Color Rotation Speed');
		this.gui.add(this.controls, 'autoRotate');
		this.gui.add(this.controls, 'autoRotateSpeed').min(-10.0).max(10.0).step(0.01).name('Auto Rotate Speed');
		this.gui.add(this, 'useRGBShift').name('Edge RGB Shift').onChange(() => this.uUseRGBShift.value = this.useRGBShift ? 1 : 0);
		this.gui.add(this, 'useBlur').name('Edge Blur').onChange(() => this.uUseBlur.value = this.useBlur ? 1 : 0);
		this.gui.add(this, 'useAnamorphic').name('Use Anamorphic').onChange(() => this.uUseAnamorphic.value = this.useAnamorphic ? 1 : 0);

		const turbFolder = this.gui.addFolder('Turbulence');
		turbFolder.add(this.turbFriction, 'value').min(0.0).max(0.3).step(0.01).name('Friction');
		turbFolder.add(this.turbFrequency, 'value').min(0.0).max(1.0).step(0.01).name('Frequency');
		turbFolder.add(this.turbAmplitude, 'value').min(0.0).max(10.0).step(0.01).name('Amplitude');
		turbFolder.add(this.turbOctaves, 'value').min(1).max(9).step(1).name('Octaves');
		turbFolder.add(this.turbLacunarity, 'value').min(1.0).max(5.0).step(0.01).name('Lacunarity');
		turbFolder.add(this.turbGain, 'value').min(0.0).max(1.0).step(0.01).name('Gain');

		const bloomFolder = this.gui.addFolder('Bloom');
		bloomFolder.add(this.bloomPass.threshold, 'value').min(0.0).max(1.0).step(0.01).name('Threshold');
		bloomFolder.add(this.bloomPass.strength, 'value').min(0.0).max(3.0).step(0.01).name('Strength');
		bloomFolder.add(this.bloomPass.radius, 'value').min(0.0).max(1.0).step(0.01).name('Radius');

	}


	// starts to slow down at 32768 particles on my machine, you might have better luck. But it's doesn't really need more, the effect works well at 16384 or less
	nbParticles: number = Math.pow(2, 14); // 10:1024, 11:2048, 12:4096, 13:8192, 14:16384, 15:32768, 16:65536
	partPositions: ShaderNodeObject<StorageBufferNode>;
	partVelocities: ShaderNodeObject<StorageBufferNode>;

	async initParticles() {

		const { nbParticles } = this;
		const partPositions = storage(new StorageInstancedBufferAttribute(nbParticles, 4), "vec4", nbParticles); // also stores lifetime in w 
		const partVelocities = storage(new StorageInstancedBufferAttribute(nbParticles, 4), "vec4", nbParticles);
		this.partPositions = partPositions;
		this.partVelocities = partVelocities;

		const partMat: SpriteNodeMaterial = new SpriteNodeMaterial();
		partMat.transparent = true;
		partMat.blending = AdditiveBlending;
		partMat.depthWrite = false;
		partMat.positionNode = partPositions.toAttribute();
		partMat.scaleNode = vec2(this.uParticleSize);
		partMat.rotationNode = atan2(partVelocities.toAttribute().y, partVelocities.toAttribute().x);
		partMat.colorNode = tslFn(() => {
			const life = partPositions.toAttribute().w;
			const modLife = pcurve(life.oneMinus(), 8.0, 1.0);
			const col = this.getInstanceColor(instanceIndex);
			const pulse = pcurve(sin(timerGlobal(5.0).add(instanceIndex.toFloat().mul(0.1))).mul(0.5).add(0.5), 0.5, 0.5).mul(10).add(1.0);
			return col.mul(pulse).mul(modLife);
		})();
		
		partMat.opacityNode = tslFn(() => {
			//const circle = uv().xy.sub(.5).length().sub(.5);
			const hex = this.sdHexagon(uv().xy.sub(.5), .5);
			const life = partPositions.toAttribute().w;
			const camDist = partPositions.toAttribute().xyz.sub(cameraPosition.xyz).lengthSq();
			const camFac = float(1.0).toVar();
			If(camDist.lessThan(this.uCamFadeThreshold), () => {
				camFac.assign(camDist.div(this.uCamFadeThreshold).pow(3.0)); // fades out when particles are too close to the camera
			});
			return max(0.0, step(0.0, hex).oneMinus().mul(life)).mul(camFac); // opacity decreases over lifetime
		})();
		
		const partGeom: BufferGeometry = new PlaneGeometry(0.05, 0.05);
		const partMesh: InstancedMesh = new InstancedMesh(partGeom, partMat, nbParticles);
		partMesh.instanceMatrix.setUsage(DynamicDrawUsage);
		partMesh.frustumCulled = false;
		this.scene.add(partMesh);

		await this.renderer.computeAsync(this.initParticlesCp);

	}

	// for each particle set position and velocity to 0, and lifetime to -1
	initParticlesCp = tslFn(() => {

		const { partPositions, partVelocities } = this;
		partPositions.element(instanceIndex).xyz.assign(vec3(0.0));
		partPositions.element(instanceIndex).w.assign(-1.0);
		partVelocities.element(instanceIndex).xyz.assign(vec3(0.0));

	})().compute(this.nbParticles);

	linksVertSBA: StorageBufferAttribute;
	linksColorsSBA: StorageBufferAttribute;
	async initLinks() {

		// 2 quads per particle, 4 vertices per quad, 8 vertices per particle, index is fixed
		const indices: number[] = [];
		for (let i: number = 0; i < this.nbParticles; i++) {
			const i0: number = i * 8;
			const i1: number = i0 + 1;
			const i2: number = i0 + 2;
			const i3: number = i0 + 3;
			const i4: number = i0 + 4;
			const i5: number = i0 + 5;
			const i6: number = i0 + 6;
			const i7: number = i0 + 7;
			indices.push(i0, i1, i2, i0, i2, i3);
			indices.push(i4, i5, i6, i4, i6, i7);
		}

		const nbVerts: number = this.nbParticles * 8;
		const vertSBA: StorageBufferAttribute = new StorageBufferAttribute(nbVerts, 4);
		const colorsSBA: StorageBufferAttribute = new StorageBufferAttribute(nbVerts, 3);
		this.linksVertSBA = vertSBA;
		this.linksColorsSBA = colorsSBA;

		// dynamic geometry, vertices and colors are updated in the compute step, so storage buffers are used
		const geom: BufferGeometry = new BufferGeometry();
		geom.setAttribute('position', vertSBA);
		geom.setAttribute('color', colorsSBA);
		geom.setAttribute('normal', new Float32BufferAttribute(new Float32Array(nbVerts * 3).fill(0), 3)); // not really necessary, but there's a message if i don't provide values		
		geom.setIndex(indices);

		const linkMat: MeshBasicNodeMaterial = new MeshBasicNodeMaterial();
		linkMat.vertexColors = true;
		linkMat.transparent = true;
		linkMat.side = DoubleSide;
		linkMat.depthWrite = false;
		linkMat.depthTest = false;
		linkMat.blending = AdditiveBlending;
		linkMat.colorNode = color(0xffffff);
		linkMat.opacityNode = tslFn(() => {
			const part = storage(vertSBA, 'vec4', vertSBA.count).toAttribute();
			const o = part.w;
			const p = part.xyz;

			const camFac = float(1.0).toVar();			
			const camDist = p.sub(varying(cameraPosition).xyz).lengthSq();
			If(camDist.lessThan(this.uCamFadeThreshold), () => {
				camFac.assign(camDist.div(this.uCamFadeThreshold).pow(3.0)); // fades out when particles are too close to the camera
			});

			return o.mul(camFac); // opacity is linked to the particle lifetime, stored in the w component its position

		})();

		

		const mesh: Mesh = new Mesh(geom, linkMat);
		mesh.frustumCulled = false;
		this.scene.add(mesh);
	}

	// for each particle, find the two closest particles and create a quad to each of them
	updateParticlesCp = tslFn(() => {

		const { nbParticles, partPositions, partVelocities, uTimeScale, uParticleLifetime } = this;
		const { turbFrequency, turbOctaves, turbAmplitude, turbLacunarity, turbGain } = this;
		
		const position = partPositions.element(instanceIndex).xyz;
		const velocity = partVelocities.element(instanceIndex).xyz;
		const life = partPositions.element(instanceIndex).w;

		const dt = timerDelta(0.1).mul(uTimeScale);
		
		If(life.greaterThan(0.0), () => {

			// first we update the particles positions and velocities
			// velocity comes from a turbulence field, and is multiplied by the particle lifetime so that it slows down over time
			const vel = mx_fractal_noise_vec3(position.mul(turbFrequency), turbOctaves, turbLacunarity, turbGain, turbAmplitude).mul(life.add(.01));
			velocity.addAssign(vel);
			velocity.mulAssign(this.turbFriction.oneMinus() );
			position.assign(position.add(velocity.mul(dt)));
			life.subAssign(dt.mul(float(1.0).div(uParticleLifetime))); // update lifetime, particle dies when it reaches 0

			// then we find the two closest particles and set a quad to each of them
			const closestDist1 = float(10000.0).toVar();
			const closestPos1 = vec3(0.0).toVar();
			const closestLife1 = float(0.0).toVar();
			const closestDist2 = float(10000.0).toVar();
			const closestPos2 = vec3(0.0).toVar();
			const closestLife2 = float(0.0).toVar();

			// could be way more optimized with some space partitioning. 
			loop({ type: 'uint', start: 0, end: nbParticles, condition: '<' }, ({ i }) => {

				const otherPart = partPositions.element(i);

				If(i.notEqual(instanceIndex).and(otherPart.w.greaterThan(0.0)), () => {

					const otherPosition = otherPart.xyz;
					const dist = position.sub(otherPosition).lengthSq();
					const moreThanZero = dist.greaterThan(0.0);

					If(dist.lessThan(closestDist1).and(moreThanZero), () => {

						closestDist1.assign(dist);
						closestPos1.assign(otherPosition.xyz);
						closestLife1.assign(otherPart.w);

					}).elseif(dist.lessThan(closestDist2).and(moreThanZero), () => {

						closestDist2.assign(dist);
						closestPos2.assign(otherPosition.xyz);
						closestLife2.assign(otherPart.w);

					});
				});
			});

			const lPositions = storage(this.linksVertSBA, "vec4", this.linksVertSBA.count);
			const lColors = storage(this.linksColorsSBA, "vec4", this.linksColorsSBA.count);
			const lIndex1 = instanceIndex.mul(8); // start index for the first quad
			const lIndex2 = lIndex1.add(4); // start index for the second quad
			
			// The quad are created with their "width" over y and that's it.
			// at some point I had some normals here too
			const lw = this.uLinksWidth;
			// positions quad 1 
			lPositions.element(lIndex1).xyz.assign(position);
			lPositions.element(lIndex1).y.addAssign(lw);
			lPositions.element(lIndex1.add(1)).xyz.assign(position);
			lPositions.element(lIndex1.add(1)).y.addAssign(lw.negate());
			lPositions.element(lIndex1.add(2)).xyz.assign(closestPos1);
			lPositions.element(lIndex1.add(2)).y.addAssign(lw.negate());
			lPositions.element(lIndex1.add(3)).xyz.assign(closestPos1);
			lPositions.element(lIndex1.add(3)).y.addAssign(lw);

			// positions quad 2 
			lPositions.element(lIndex2).xyz.assign(position);
			lPositions.element(lIndex2).y.addAssign(lw);
			lPositions.element(lIndex2.add(1)).xyz.assign(position);
			lPositions.element(lIndex2.add(1)).y.addAssign(lw.negate());
			lPositions.element(lIndex2.add(2)).xyz.assign(closestPos2);
			lPositions.element(lIndex2.add(2)).y.addAssign(lw.negate());
			lPositions.element(lIndex2.add(3)).xyz.assign(closestPos2);
			lPositions.element(lIndex2.add(3)).y.addAssign(lw);

			// colors are the same for all vertices of both quads
			const col = this.getInstanceColor(instanceIndex);

			// store the minimum lifetime of the closest particles in the w component of the positions for opacity in the fragment shader
			const l1 = max(0.0, min(closestLife1, life)).pow(0.8); // pow is here to apply a slight curve to the opacity
			const l2 = max(0.0, min(closestLife2, life)).pow(0.8);
			
			loop({ type: 'uint', start: 0, end: 4, condition: '<' }, ({ i }) => {
				lColors.element(lIndex1.add(i)).xyz.assign(col);
				lColors.element(lIndex2.add(i)).xyz.assign(col);
				lPositions.element(lIndex1.add(i)).w.assign(l1);
				lPositions.element(lIndex2.add(i)).w.assign(l2);
			});
		});


	})().compute(this.nbParticles);

	getInstanceColor = tslFn(([i_immutable]) => {
		// color is based on the particle index, time, and a noise function 
		return color(0x0000FF).hue( this.uColorOffset.add(mx_fractal_noise_float(i_immutable.toFloat().mul(0.1), 2, 2.0, 0.5, this.uColorVariance)));
	});

	uSpawnIndex = uniform(0);
	uSpawnCursorNb = uniform(2);
	uSpawnPosition = uniform(vec3(0.0));
	uSpawnPositionBefore = uniform(vec3(0.0));
	// spawns particles at the cursor position, with a bit of randomness, for a number of particles defined by uSpawnCursorNb, "Spawn rate" in the GUI
	spawnParticlesCursorCp = tslFn(() => {
		
		const { partPositions, partVelocities, uSpawnIndex, nbParticles } = this;
		const pIndex = uSpawnIndex.add(instanceIndex.remainder(nbParticles)).toInt();
		const position = partPositions.element(pIndex).xyz;
		const velocity = partVelocities.element(pIndex).xyz;
		const life = partPositions.element(pIndex).w;
		life.assign(1.0); // sets it alive

		// random spherical direction
		const rRange = float(0.01);
		const rTheta = pIndex.hash().mul(PI2);
		const rPhi = pIndex.add(2).hash().mul(PI);
		const rx = sin(rTheta).mul(cos(rPhi));
		const ry = sin(rTheta).mul(sin(rPhi));
		const rz = cos(rTheta);
		const dir = vec3(rx, ry, rz);
		// position is interpolated between the previous cursor position and the current one over the number of particles spawned
		const pos = mix(this.uSpawnPositionBefore, this.uSpawnPosition, instanceIndex.toFloat().div(this.uSpawnCursorNb.sub(1).toFloat()).clamp());
		position.assign(pos.add(dir.mul(rRange)));
		// start in that direction
		velocity.assign(dir.mul(5.0));

	})().compute(this.uSpawnCursorNb.value);

	initBG() {

		// a large icosaedron with a hexagonal pattern
		const geom: BufferGeometry = new IcosahedronGeometry(100, 1);
		const mat: MeshBasicNodeMaterial = new MeshBasicNodeMaterial();
		mat.colorNode = tslFn(() => {
			const npos = positionWorld.xyz.normalize();
			const theta = atan2(npos.z, npos.x);
			const phi = acos(npos.y);
			const dcol = color(0x000000).toVar();
			const st = vec2(theta, phi.add(1.0).mul(1.0)).toVar();
			st.y.addAssign(timerGlobal(0.1));
			st.x.mulAssign(0.5);
			const n2 = mx_fractal_noise_float(st, 4, 2.0, 0.5, 0.5).add(0.5); // for the highlight pattern
			const icol = this.getInstanceColor(0);
			dcol.assign(mix(color(0x050505), icol.mul(1.5), this.cubicPulse(0.5, 0.02, n2)).pow(2.0));
			const pattern = this.hexagonPattern(vec2(phi, theta).mul(10.0)); // the hexagonal cells, 2d id in xy and distance in z
			const n = pattern.z;
			const lit = smoothstep( 0.8, 1.0, mx_fractal_noise_float( pattern.xy.add( timerGlobal(.25) ), 2, 2.0, 0.5, 0.5).add(0.5) );
			return mix(dcol, mix(dcol.mul(0.5), mix( color(0x151515), icol, lit), smoothstep(0.02, 0.03, n)), smoothstep(0.0, 0.02, n));
		})();

		mat.side = BackSide; // only the inside
		const mesh: Mesh = new Mesh(geom, mat);
		this.scene.add(mesh);

	}

	bloomPass;
	initPost() {

		const scenePass = pass(this.scene, this.camera);
		const scenePassColor = scenePass.getTextureNode('output');
		const blurFac = viewportTopLeft.distance(.5).mul(2.0).clamp().pow(8.0).mul(this.uUseBlur);
		const blurred = scenePassColor.gaussianBlur(blurFac);
		const bloomPass = bloom(scenePass, 1.0, .25, 0.1);
		this.bloomPass = bloomPass;

		// big rgb shift on the side
		const shift = rgbShift(blurred.add(bloomPass));
		shift.amount = viewportTopLeft.distance(.5).mul(2.0).clamp().pow(4.0).mul(0.004).mul( this.uUseRGBShift);
		shift.angle = atan2(viewportTopLeft.y.sub(.5), viewportTopLeft.x.sub(.5));
				
		const anamorphic = scenePass.anamorphic( 2.0, 5.0, 32);
		anamorphic.resolution = new Vector2( 0.2, 0.2);
		this.post.outputNode = shift.add( anamorphic.mul( 0.2 ).mul( this.uUseAnamorphic )).fxaa();
		
	}


	update(dt: number, elapsed: number): void {

		this.renderer.compute(this.updateParticlesCp);
		this.renderer.compute(this.spawnParticlesCursorCp);
		this.uSpawnIndex.value = (this.uSpawnIndex.value + this.uSpawnCursorNb.value) % this.nbParticles; // updating index

		// easing the cursor here too
		this.uSpawnPositionBefore.value.x = this.uSpawnPosition.value.x;
		this.uSpawnPositionBefore.value.y = this.uSpawnPosition.value.y;
		this.uSpawnPositionBefore.value.z = this.uSpawnPosition.value.z;
		this.uSpawnPosition.value.x = MathUtils.lerp(this.uSpawnPosition.value.x, this.pointerHandler.uPointer.value.x, .1);
		this.uSpawnPosition.value.y = MathUtils.lerp(this.uSpawnPosition.value.y, this.pointerHandler.uPointer.value.y, .1);
		this.uSpawnPosition.value.z = MathUtils.lerp(this.uSpawnPosition.value.z, this.pointerHandler.uPointer.value.z, .1);

		this.uColorOffset.value += dt * this.uColorRotationSpeed.value;

	}

	/** transpiled utilities, from Inigo Quilez */
	sdHexagon = tslFn(([p_immutable, r_immutable]) => {

		const r = float(r_immutable).toVar();
		const p = vec2(p_immutable).toVar();
		const k = vec3(- 0.866025404, 0.5, 0.577350269);
		p.assign(abs(p));
		p.subAssign(mul(2.0, min(dot(k.xy, p), 0.0).mul(k.xy)));
		p.subAssign(vec2(clamp(p.x, k.z.negate().mul(r), k.z.mul(r)), r));

		return length(p).mul(sign(p.y));

	}).setLayout({
		name: 'sdHexagon',
		type: 'float',
		inputs: [
			{ name: 'p', type: 'vec2', qualifier: 'in' },
			{ name: 'r', type: 'float', qualifier: 'in' }
		]
	});

	hexagonPattern = /*#__PURE__*/ tslFn(([p_immutable]) => {

		const p = vec2(p_immutable).toVar();
		const q = vec2(p.x.mul(2.0).mul(0.577350269), p.y.add(p.x.mul(0.577350269))).toVar();
		const pi = vec2(floor(q)).toVar();
		const pf = vec2(fract(q)).toVar();
		const v = float(mod(pi.x.add(pi.y), 3.0)).toVar();
		const ca = float(step(1.0, v)).toVar();
		const cb = float(step(2.0, v)).toVar();
		const ma = vec2(step(pf.xy, pf.yx)).toVar();
		const e = float(dot(ma, sub(1.0, pf.yx).add(ca.mul(pf.x.add(pf.y.sub(1.0)))).add(cb.mul(pf.yx.sub(mul(2.0, pf.xy)))))).toVar();
		return vec3(pi.add(ca).sub(cb.mul(ma)),e);

	}).setLayout({
		name: 'hexagonPattern',
		type: 'vec3',
		inputs: [
			{ name: 'p', type: 'vec2' }
		]
	});

	cubicPulse = /*#__PURE__*/ tslFn(([c_immutable, w_immutable, x_immutable]) => {

		const x = float(x_immutable).toVar();
		const w = float(w_immutable).toVar();
		const c = float(c_immutable).toVar();
		x.assign(abs(x.sub(c)));

		If(x.greaterThan(w), () => {
			return 0.0;
		});

		x.divAssign(w);

		return sub(1.0, x.mul(x).mul(sub(3.0, mul(2.0, x))));

	}).setLayout({
		name: 'cubicPulse',
		type: 'float',
		inputs: [
			{ name: 'c', type: 'float' },
			{ name: 'w', type: 'float' },
			{ name: 'x', type: 'float' }
		]
	});


}