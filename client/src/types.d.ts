import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Three.js lights
      ambientLight: React.DetailedHTMLProps<React.HTMLAttributes<any> & { intensity?: number }, any>;
      spotLight: React.DetailedHTMLProps<React.HTMLAttributes<any> & { position?: [number, number, number]; angle?: number; penumbra?: number; intensity?: number; castShadow?: boolean }, any>;
      directionalLight: React.DetailedHTMLProps<React.HTMLAttributes<any> & { position?: [number, number, number]; intensity?: number }, any>;
      
      // Three.js geometry and materials
      mesh: React.DetailedHTMLProps<React.HTMLAttributes<any> & { position?: [number, number, number]; rotation?: [number, number, number]; castShadow?: boolean; receiveShadow?: boolean; ref?: React.Ref<any> }, any>;
      group: React.DetailedHTMLProps<React.HTMLAttributes<any> & { ref?: React.Ref<any> }, any>;
      planeGeometry: React.DetailedHTMLProps<React.HTMLAttributes<any> & { args?: [number, number] }, any>;
      extrudeGeometry: React.DetailedHTMLProps<React.HTMLAttributes<any> & { args?: any[] }, any>;
      meshStandardMaterial: React.DetailedHTMLProps<React.HTMLAttributes<any> & { map?: any; color?: string; roughness?: number; metalness?: number }, any>;
      meshBasicMaterial: React.DetailedHTMLProps<React.HTMLAttributes<any> & { color?: string; transparent?: boolean; opacity?: number }, any>;
      primitive: React.DetailedHTMLProps<React.HTMLAttributes<any> & { object?: any; attach?: string; ref?: React.Ref<any> }, any>;
    }
  }
}

export {};
