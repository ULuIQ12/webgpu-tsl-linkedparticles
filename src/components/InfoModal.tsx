import { useEffect, useState } from "react";
import LargeCollapsable from "./LargeCollapsable";
import { cameraIcon, closeCross, crosshairIcon, saveIcon, tools, uploadIcon } from "./GFX";

interface IInfoModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function InfoModal({
	isOpen,
	onClose,
}: IInfoModalProps) {

	const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

	useEffect(() => {
		setTheme(localStorage.getItem('theme') || 'dark');
	}, [isOpen]);

	const handleOpenCloseChange = () => {
		onClose();
	}

	return (
		<>
			<dialog id="info-modal" className="modal">
				<div className="modal-box w-11/12 max-w-5xl">
					<div className="font-bold text-lg pb-4 w-full flex row  items-center  max-h-[75vh] justify-between">
						<div>Info / Help</div>
						<button className="btn btn-neutral btn-circle drawer-button mb-2" onClick={handleOpenCloseChange}>{closeCross()}</button>
					</div>
					<div className="flex flex-col gap-2 justify-end">
						<LargeCollapsable title="About" accordionName="info">
							<div>
								TODO
							</div>
						</LargeCollapsable>
						<LargeCollapsable title="How it works" accordionName="info">
							<div className="flex flex-col gap-1">
								TODO
							</div>
						</LargeCollapsable>
						<LargeCollapsable title="Controls" accordionName="info">
							<div className="flex flex-col gap-1">
								TODO
							</div>
						</LargeCollapsable>
						{/*
						<LargeCollapsable title="Tips" accordionName="info">
							<div className="flex flex-col gap-1">
								<li>Go easy on the sliders, sometimes very small changes lead to big effects as all the factors are often in a tight balance.</li>
								<li>Use the "Randomize sliders" and "Randomize weights" button. You never know what result will appear. Find something you like that way
									and then fine tune the other sliders.</li>
								<li>To get a better understanding of the system, set the number of types to two, click "Set weights to zero",
									and then slowly change the values in the matrix while observing the result.</li>
								<li>The "Additive blending" and "After image" options mostly only work with dark backgrounds.</li>
								<li><span><a className="link" href="mailto:ulu@iq12.com">Send me</a></span> your favorite configuration! I might add it to the presets :) </li>
							</div>
						</LargeCollapsable>
						*/}
						<LargeCollapsable title="Links" accordionName="info">
							<div className="flex flex-col gap-1">
								<li><a href="https://threejs.org/" target="_blank" className="link">Three.js</a>, 3D for the web.</li>
								<li><a href="https://threejs.org/examples/?q=webgpu" target="_blank" className="link">Three.js webgpu examples</a>, many of them using nodes and or TSL.</li>
								<li><a href="https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language" target="_blank" className="link">Three.js TSL documentation.</a></li>
							</div>
						</LargeCollapsable>
						<LargeCollapsable title="Page stack" accordionName="info">
							<div className="flex flex-col gap-1">
								<li>Built with <a href="https://vitejs.dev/" target="_blank" className="link">Vite<img className="inline h-8 p-1 -mt-2" src="./assets/vite.svg" /></a></li>
								<li>Keeping it clean with <a href="https://www.typescriptlang.org/" target="_blank" className="link">TypeScript<img className="inline h-8 p-1 -mt-2" src="./assets/typescript.svg" /></a></li>
								<li>Some UI management with <a href="https://react.dev/" target="_blank" className="link">React<img className="inline h-8 p-1 -mt-2" src="./assets/react.svg" /></a></li>
								<li>Main UI is  <a href="https://lil-gui.georgealways.com/" target="_blank" className="link">LilGUI</a></li>
								<li>3D canvas with <a href="https://threejs.org/" target="_blank" className="link">Three.js<img className="inline h-8 p-1 -mt-2" src="./assets/three.svg" /></a></li>
								{/*<li>Font is <a href="https://fonts.google.com/specimen/Rubik" target="_blank" className="link">Rubik<img className="inline h-8 p-1 -mt-2" src="./assets/googlefonts.svg" /></a></li>*/}
								<li>Icons picked from <a href="https://icons.getbootstrap.com/" target="_blank" className="link">Bootstrap icons<img className="inline h-8 p-1 -mt-2" src="./assets/bootstrap.svg" /></a></li>
							</div>
						</LargeCollapsable>
					</div>
				</div>
			</dialog>

		</>
	)
}