import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import './App.css'
import IntroModal from './components/IntroModal';
import { brightness, cameraIcon, closeCross, crosshairIcon, fxIcon, githubIcon, globeIcon, moonIcon, questionIcon, saveIcon, sunIcon, tools, twitterIcon, uluLogo, uploadIcon } from './components/GFX';
import { Root } from './lib/Root';
import InfoModal from './components/InfoModal';
import WebGPU from 'three/examples/jsm/capabilities/WebGPU.js';



function App() {

	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isUIHidden, setIsUIHidden] = useState(false);

	const [hasWebGPU, setHasWebGPU] = useState(false);
    useEffect(() => {
        setHasWebGPU(WebGPU.isAvailable())
    }, []);

	const closedButtons = useRef<HTMLDivElement>(null);
	const sideButtonsRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		//(document.getElementById('intro-modal') as unknown as any).showModal();

	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.code === 'Space') {
				console.log( "toggle UI")
				setIsUIHidden(!isUIHidden);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [isUIHidden]);

	useEffect(() => {
		const tl = gsap.timeline();
		if (isDrawerOpen) {
			if (sideButtonsRef.current !== null) tl.to(sideButtonsRef.current, { left: 450, duration: 0.25, ease: "power1.out" }, 0);
			if (closedButtons.current !== null) tl.to(closedButtons.current, { left: -50, duration: 0.25, ease: "power2.in" }, 0);

		}
		else {
			if (sideButtonsRef.current !== null) tl.to(sideButtonsRef.current, { left: -50, duration: 0.2, ease: "power1.in" }, 0);
			if (closedButtons.current !== null) tl.to(closedButtons.current, { left: 16, duration: 0.2, ease: "power2.out" }, 0.2);
		}
	}, [isDrawerOpen]);




	const [promoLinksMenuOpen, setPromoLinksMenuOpen] = useState(false);
	const promoMenuRef = useRef<HTMLUListElement>(null);
	const logoRef = useRef<HTMLDivElement>(null);
	
	const handlePromoToggle = () => {
		setPromoLinksMenuOpen(!promoLinksMenuOpen);
		const tl = gsap.timeline();
		if (promoLinksMenuOpen) {
			tl.to(promoMenuRef.current, { opacity: 0, bottom: 96, duration: 0.2, ease: "power2.in" }, 0);
			tl.to(logoRef.current, { rotate: 10, duration: 0.1, ease: "power2.in" }, 0);
			tl.to(logoRef.current, { rotate: 0, duration: 0.5, ease: "elastic.out" }, 0.1);


		}
		else {
			tl.to(promoMenuRef.current, { opacity: 1, bottom: 80, duration: 0.2, ease: "power2.out" }, 0);
			tl.to(logoRef.current, { rotate: -10, duration: 0.1, ease: "power2.in" }, 0);
			tl.to(logoRef.current, { rotate: 0, duration: 0.5, ease: "elastic.out" }, 0.1);
		}
	}

	const handleCaptureRequest = () => {
		Root.StartCapture();
	}

	const [infoModalOpen, setInfoModalOpen] = useState(false);
	const handleShowInfosClick = () => {
		setInfoModalOpen(true);
		(document.getElementById('info-modal') as unknown as any).showModal();
	}

	const handleInfoClose = () => {
		setInfoModalOpen(false);
		(document.getElementById('info-modal') as unknown as any).close();
	}

	return (
		<div id='app'>
			{/*
			<div className="drawer-content" style={isUIHidden?{visibility:"hidden"}:{visibility:"visible"}}>
				<div ref={closedButtons} className='absolute' >
					<div className='flex flex-col gap-1'>
						<div className="tooltip tooltip-right" data-tip="Informations">
							<button className="btn btn-neutral btn-circle" onClick={handleShowInfosClick}>{questionIcon()}</button>
						</div>
						<div className="tooltip tooltip-right" data-tip="Capture current state">
							<button className="btn btn-neutral btn-circle" onClick={handleCaptureRequest}>{cameraIcon()}</button>
						</div>
					</div>
				</div>
			</div>
			<div className='drawer overflow-hidden'>
				<input id="my-drawer" type="checkbox" className="drawer-toggle" checked={isDrawerOpen} onChange={() => { }} />

				<div className="drawer-side w-fit h-fit max-h-screen">
					<div className='menu pr-0'>
						<div className='flex flex-row gap-1 pt-2'>
							<div className='flex flex-col gap-2'>
								
							</div>
						</div>
					</div>
				</div>
			</div>
			<div ref={sideButtonsRef} className='absolute left-[-50px] flex flex-col gap-1'>


			</div>
			<div className='fixed bottom-4 right-8'>
				<div ref={logoRef}>
					<button onClick={handlePromoToggle}>{uluLogo()}</button>
				</div>
				<ul ref={promoMenuRef} className="menu bg-base-200 rounded-box fixed bottom-24 right-8 opacity-0 px-0">
					<li><a href="https://www.ulucode.com/" className="tooltip tooltip-left" target='_blank' data-tip="Website">{globeIcon()}</a></li>
					<li><a href="https://x.com/ULuIQ12" className="tooltip tooltip-left" target='_blank' data-tip="Twitter/X">{twitterIcon()}</a></li>
					<li><a href="https://github.com/ULuIQ12" className="tooltip tooltip-left" target='_blank' data-tip="GitHub">{githubIcon()}</a></li>
					<li><a href="https://www.fxhash.xyz/u/Christophe%20%22Ulu%22%20Choffel" target='_blank' className="tooltip tooltip-left" data-tip="fx(hash)">{fxIcon()}</a></li>
				</ul>
			</div>
			
			<InfoModal isOpen={infoModalOpen} onClose={handleInfoClose} />
			<IntroModal />
			*/}
			{ !hasWebGPU && 
				<div className=''>
					<div className="pb-2"><a className="link" href="https://gpuweb.github.io/gpuweb/">WebGPU</a> is not available on your browser and this page requires compatibility</div>
					<div className="pb-2">Please try with a WebGPU compatible browser.</div>
				</div>
			}
			<div className='fixed bottom-4 right-8'>
				<div ref={logoRef}>
					<button onClick={handlePromoToggle}>{uluLogo()}</button>
				</div>
				<ul ref={promoMenuRef} className="menu bg-base-200 rounded-box fixed bottom-24 right-8 opacity-0 px-0">
					<li><a href="https://www.ulucode.com/" className="tooltip tooltip-left" target='_blank' data-tip="Website">{globeIcon()}</a></li>
					<li><a href="https://x.com/ULuIQ12" className="tooltip tooltip-left" target='_blank' data-tip="Twitter/X">{twitterIcon()}</a></li>
					<li><a href="https://github.com/ULuIQ12" className="tooltip tooltip-left" target='_blank' data-tip="GitHub">{githubIcon()}</a></li>
					<li><a href="https://www.fxhash.xyz/u/Christophe%20%22Ulu%22%20Choffel" target='_blank' className="tooltip tooltip-left" data-tip="fx(hash)">{fxIcon()}</a></li>
				</ul>
			</div>

		</div>
	)
}

export default App
