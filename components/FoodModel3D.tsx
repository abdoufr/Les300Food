'use client';

import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Center, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface Ingredient {
    id: number;
    name: string;
    price: number;
    category: string;
    subcategory: string;
    is_available: number;
}

interface FoodModel3DProps {
    category: 'sandwich' | 'pizza' | 'tacos' | 'burger';
    base: Ingredient | null;
    viandes: Ingredient[];
    supplements: Ingredient[];
    sauces: Ingredient[];
}

// Composant pour appliquer une texture sur une géométrie
function TexturedShape({ url, color = 'white', geometry, position, rotation, scale }: any) {
    const texture = useTexture(url) as THREE.Texture;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return (
        <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
            {geometry}
            <meshStandardMaterial map={texture} color={color} roughness={0.7} />
        </mesh>
    );
}

// Wrapper Suspense
function Layer({ fallback, ...props }: any) {
    return (
        <Suspense fallback={fallback}>
            <TexturedShape {...props} />
        </Suspense>
    );
}

// ==================== BURGER ====================
function BurgerStack({ viandes, supplements }: { viandes: Ingredient[], supplements: Ingredient[] }) {
    let yOffset = 0.5;
    const layers = [];

    // Bottom Bun (Cylinder)
    layers.push(
        <Layer 
            key="bottom-bun" 
            url="/textures/bun.png" 
            geometry={<cylinderGeometry args={[2, 2, 0.6, 32]} />}
            position={[0, yOffset, 0]}
            fallback={<mesh position={[0, yOffset, 0]}><cylinderGeometry args={[2, 2, 0.6, 32]} /><meshStandardMaterial color="#d4a373" /></mesh>}
        />
    );
    yOffset += 0.4;

    // Meats
    viandes.forEach((v, i) => {
        layers.push(
            <Layer 
                key={`meat-${i}`} 
                url="/textures/meat.png" 
                geometry={<cylinderGeometry args={[1.9, 1.9, 0.4, 32]} />}
                position={[0, yOffset, 0]}
                fallback={<mesh position={[0, yOffset, 0]}><cylinderGeometry args={[1.9, 1.9, 0.4, 32]} /><meshStandardMaterial color="#5c3a21" /></mesh>}
            />
        );
        yOffset += 0.45;
    });

    // Supplements
    supplements.forEach((s, i) => {
        const n = s.name.toLowerCase();
        const isTomato = n.includes('tomate');
        const isSalad = n.includes('laitue') || n.includes('salade');
        
        if (isTomato) {
            // Tomato slice
            layers.push(<Layer key={`supp-${i}`} url="/textures/tomato.png" geometry={<cylinderGeometry args={[1.8, 1.8, 0.2, 32]} />} position={[0, yOffset, 0]} fallback={null} />);
        } else if (isSalad) {
            // Salad leaf
            layers.push(<Layer key={`supp-${i}`} url="/textures/bun.png" color="#2ecc71" geometry={<cylinderGeometry args={[2.1, 2.1, 0.1, 16]} />} position={[0, yOffset, 0]} fallback={null} />);
        } else {
            // Cheese (Square slice)
            layers.push(<Layer key={`supp-${i}`} url="/textures/cheese.png" geometry={<boxGeometry args={[2.8, 0.1, 2.8]} />} position={[0, yOffset, 0]} fallback={null} />);
        }
        yOffset += 0.25;
    });

    // Top Bun (Half Sphere for real 3D look)
    layers.push(
        <Layer 
            key="top-bun" 
            url="/textures/bun.png" 
            geometry={<sphereGeometry args={[2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />}
            position={[0, yOffset, 0]}
            fallback={<mesh position={[0, yOffset, 0]}><sphereGeometry args={[2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#d4a373" /></mesh>}
        />
    );

    return <group position={[0, -yOffset / 2, 0]}>{layers}</group>;
}

// ==================== PIZZA ====================
function PizzaModel({ base, viandes, supplements, sauces }: FoodModel3DProps) {
    let yOffset = 0.15;
    const layers = [];

    // Crust
    layers.push(
        <Layer 
            key="crust" 
            url="/textures/pizza_crust.png" 
            geometry={<cylinderGeometry args={[4, 4, 0.2, 32]} />}
            position={[0, 0, 0]}
            fallback={<mesh><cylinderGeometry args={[4, 4, 0.2, 32]} /><meshStandardMaterial color="#f39c12" /></mesh>}
        />
    );

    // Sauce
    const hasTomatoSauce = sauces.some(s => s.name.toLowerCase().includes('tomate')) || base?.name.toLowerCase().includes('tomate');
    layers.push(
        <Layer 
            key="sauce" 
            url={hasTomatoSauce ? "/textures/tomato.png" : "/textures/cheese.png"} 
            color={hasTomatoSauce ? "#ffffff" : "#f1c40f"}
            geometry={<cylinderGeometry args={[3.8, 3.8, 0.1, 32]} />}
            position={[0, yOffset, 0]}
            fallback={null}
        />
    );
    yOffset += 0.1;

    // Cheese layer
    layers.push(
        <Layer 
            key="cheese-base" 
            url="/textures/cheese.png" 
            geometry={<cylinderGeometry args={[3.7, 3.7, 0.1, 32]} />}
            position={[0, yOffset, 0]}
            fallback={null}
        />
    );
    yOffset += 0.05;

    // SCATTERED TOPPINGS (All over the pizza)
    const renderScattered = (url: string, count: number, size: number, color: string = 'white', geometryType: 'cylinder' | 'sphere' | 'dodecahedron' | 'stick' = 'cylinder') => {
        const scatterLayers = [];
        for (let j = 0; j < count; j++) {
            // Random position inside the pizza radius (3.2 max)
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 3.2; 
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            let geom;
            let rot = [0, 0, 0];
            
            if (geometryType === 'cylinder') {
                geom = <cylinderGeometry args={[size, size, 0.05, 16]} />;
                rot = [0, Math.random() * Math.PI, 0];
            } else if (geometryType === 'sphere') {
                geom = <sphereGeometry args={[size, 16, 16]} />;
            } else if (geometryType === 'dodecahedron') {
                // Perfect for irregular meat chunks
                geom = <dodecahedronGeometry args={[size, 0]} />;
                rot = [Math.random(), Math.random(), Math.random()];
            } else if (geometryType === 'stick') {
                // Perfect for grated cheese
                geom = <cylinderGeometry args={[0.02, 0.02, size, 8]} />;
                rot = [Math.PI / 2, Math.random() * Math.PI, Math.random() * Math.PI];
            }
            
            scatterLayers.push(
                <Layer 
                    key={`scatter-${url}-${j}-${geometryType}-${Date.now()}`} 
                    url={url} 
                    color={color}
                    geometry={geom}
                    position={[x, yOffset + Math.random() * 0.08, z]} 
                    rotation={rot as any}
                    fallback={null} 
                />
            );
        }
        return scatterLayers;
    };

    viandes.forEach((v, i) => {
        const isChicken = v.name.toLowerCase().includes('poulet');
        const color = isChicken ? "#ffddaa" : "#5c3a21";
        // 40 irregular meat chunks instead of perfect cylinders
        layers.push(...renderScattered('/textures/meat.png', 40, 0.15, color, 'dodecahedron'));
    });

    supplements.forEach((s, i) => {
        const n = s.name.toLowerCase();
        const isOlive = n.includes('olive');
        const isTomato = n.includes('tomate');
        const isMushroom = n.includes('champignon');
        const isCheese = n.includes('fromage') || n.includes('chèvre');
        
        if (isCheese) {
            // Fromage rapé: 150 tiny sticks scattered randomly
            layers.push(...renderScattered('/textures/cheese.png', 150, 0.3, '#f9e79f', 'stick'));
        } else if (isOlive) {
            layers.push(...renderScattered('/textures/meat.png', 15, 0.15, '#222222', 'sphere'));
        } else if (isTomato) {
            layers.push(...renderScattered('/textures/tomato.png', 8, 0.5, 'white', 'cylinder'));
        } else if (isMushroom) {
            layers.push(...renderScattered('/textures/bun.png', 12, 0.35, '#bdc3c7', 'cylinder'));
        }
    });

    return <group rotation={[-Math.PI / 6, 0, 0]}>{layers}</group>;
}

// ==================== SANDWICH ====================
function SandwichStack({ viandes, supplements }: { viandes: Ingredient[], supplements: Ingredient[] }) {
    let yOffset = 0.5;
    const layers = [];

    layers.push(
        <Layer 
            key="bottom-bun" 
            url="/textures/bun.png" 
            geometry={<boxGeometry args={[2, 0.5, 5]} />}
            position={[0, yOffset, 0]}
            fallback={<mesh position={[0, yOffset, 0]}><boxGeometry args={[2, 0.5, 5]} /><meshStandardMaterial color="#e6cc98" /></mesh>}
        />
    );
    yOffset += 0.4;

    viandes.forEach((v, i) => {
        layers.push(
            <Layer 
                key={`meat-${i}`} 
                url="/textures/meat.png" 
                geometry={<boxGeometry args={[1.8, 0.4, 4.8]} />}
                position={[0, yOffset, 0]}
                fallback={null}
            />
        );
        yOffset += 0.45;
    });

    supplements.forEach((s, i) => {
        layers.push(
            <Layer 
                key={`supp-${i}`} 
                url="/textures/cheese.png" 
                geometry={<boxGeometry args={[1.9, 0.1, 4.9]} />}
                position={[0, yOffset, 0]}
                fallback={null}
            />
        );
        yOffset += 0.3;
    });

    layers.push(
        <Layer 
            key="top-bun" 
            url="/textures/bun.png" 
            geometry={<boxGeometry args={[2, 0.5, 5]} />}
            position={[0, yOffset, 0]}
            fallback={<mesh position={[0, yOffset, 0]}><boxGeometry args={[2, 0.5, 5]} /><meshStandardMaterial color="#e6cc98" /></mesh>}
        />
    );

    return <group position={[0, -yOffset / 2, 0]}>{layers}</group>;
}


// ==================== SCENE ====================
function FoodScene(props: FoodModel3DProps) {
    const group = useRef<THREE.Group>(null as any);

    useFrame(() => {
        if (group.current) {
            group.current.rotation.y += 0.003; // slow auto-rotation
        }
    });

    return (
        <group ref={group}>
            {props.category === 'burger' && <BurgerStack {...props} />}
            {props.category === 'sandwich' && <SandwichStack {...props} />}
            {props.category === 'pizza' && <PizzaModel {...props} />}
            {props.category === 'tacos' && <SandwichStack {...props} />} {/* Fallback for tacos */}
        </group>
    );
}

export default function FoodModel3D(props: FoodModel3DProps) {
    return (
        <div className="w-full h-full relative min-h-[350px] bg-gray-50/50 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing">
            <Canvas shadows camera={{ position: [0, 5, 12], fov: 45 }}>
                <ambientLight intensity={0.7} />
                <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />
                
                <Center>
                    <FoodScene {...props} />
                </Center>
                
                <OrbitControls enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2 + 0.1} minDistance={4} maxDistance={15} />
            </Canvas>
        </div>
    );
}
