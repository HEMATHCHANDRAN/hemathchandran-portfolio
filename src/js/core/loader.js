import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AssetLoader {
    constructor() {
        this.gltfLoader = new GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        this.cache = new Map();
    }

    loadModel(path) {
        return new Promise((resolve, reject) => {
            if (this.cache.has(path)) {
                resolve(this.cache.get(path).clone());
                return;
            }
            
            this.gltfLoader.load(path, 
                (gltf) => {
                    this.cache.set(path, gltf.scene);
                    resolve(gltf.scene.clone());
                },
                undefined,
                (error) => {
                    console.error('Error loading model:', error);
                    reject(error);
                }
            );
        });
    }

    loadTexture(path) {
        return new Promise((resolve, reject) => {
            if (this.cache.has(path)) {
                resolve(this.cache.get(path));
                return;
            }
            
            this.textureLoader.load(path,
                (texture) => {
                    this.cache.set(path, texture);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error('Error loading texture:', error);
                    reject(error);
                }
            );
        });
    }

    clearCache() {
        this.cache.clear();
    }
}