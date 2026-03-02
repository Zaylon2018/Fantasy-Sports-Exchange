import "react";

type ThreeIntrinsicElements = {
	group: any;
	mesh: any;
	planeGeometry: any;
	cylinderGeometry: any;
	bufferGeometry: any;
	bufferAttribute: any;
	extrudeGeometry: any;
	meshStandardMaterial: any;
	meshBasicMaterial: any;
	points: any;
	pointsMaterial: any;
	ambientLight: any;
	directionalLight: any;
	pointLight: any;
	spotLight: any;
	fog: any;
	primitive: any;
};

declare global {
	namespace JSX {
		interface IntrinsicElements extends ThreeIntrinsicElements {}
	}
}

declare module "react" {
	namespace JSX {
		interface IntrinsicElements extends ThreeIntrinsicElements {}
	}
}

export {};
