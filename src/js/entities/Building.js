import * as THREE from 'three';

export class Building {
    constructor(scene, position, size, color, type) {
        this.scene = scene;
        this.position = position;
        this.size = size;
        this.color = color;
        this.type = type;
        this.group = new THREE.Group();
        this.info = {};
        this.visited = false;
        this.highlighted = false;
        this.highlightIntensity = 0;
        this.windows = [];
        this.lights = [];
        
        this.create();
        this.addDetails();
    }
    
    create() {
        // Main structure with texture-like appearance using multiple geometries
        const mainMaterial = new THREE.MeshStandardMaterial({ 
            color: this.color,
            roughness: 0.4,
            metalness: 0.1,
            emissive: new THREE.Color(0x000000)
        });
        
        // Main body with some variation
        const mainGeo = new THREE.BoxGeometry(this.size.width, this.size.height, this.size.depth);
        this.mainMesh = new THREE.Mesh(mainGeo, mainMaterial);
        this.mainMesh.position.y = this.size.height / 2;
        this.mainMesh.castShadow = true;
        this.mainMesh.receiveShadow = true;
        this.group.add(this.mainMesh);
        
        // Add some panel lines for detail
        this.addPanelLines();
        
        // Roof
        const roofGeo = new THREE.ConeGeometry(this.size.width * 0.8, 1, 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x884422 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = this.size.height + 0.5;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        this.group.add(roof);
        
        // Door
        const doorGeo = new THREE.BoxGeometry(0.8, 1.5, 0.2);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x442211 });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, 0.75, this.size.depth / 2 + 0.1);
        door.castShadow = true;
        this.group.add(door);
        
        // Door handle
        const handleGeo = new THREE.SphereGeometry(0.08);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.set(0.3, 0.8, this.size.depth / 2 + 0.2);
        handle.castShadow = true;
        this.group.add(handle);
        
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.group);
    }
    
    addPanelLines() {
        // Add horizontal lines to simulate floors
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
        const floors = Math.floor(this.size.height / 1.5);
        
        for (let i = 1; i < floors; i++) {
            const y = i * 1.5;
            const points = [
                new THREE.Vector3(-this.size.width/2, y, -this.size.depth/2),
                new THREE.Vector3(this.size.width/2, y, -this.size.depth/2),
                new THREE.Vector3(this.size.width/2, y, this.size.depth/2),
                new THREE.Vector3(-this.size.width/2, y, this.size.depth/2),
                new THREE.Vector3(-this.size.width/2, y, -this.size.depth/2)
            ];
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            line.position.copy(this.mainMesh.position);
            this.group.add(line);
        }
    }
    
    addWindows() {
        const windowGeo = new THREE.BoxGeometry(0.5, 0.5, 0.1);
        const windowMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffaa,
            emissive: new THREE.Color(0x221100)
        });
        
        const rows = Math.floor(this.size.height / 1.5);
        const cols = Math.floor(this.size.width / 1.2);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Skip door position on front face
                if (row === 0 && col === Math.floor(cols/2)) continue;
                
                // Front windows
                const windowFront = new THREE.Mesh(windowGeo, windowMat);
                windowFront.position.set(
                    (col - cols/2) * 1.2 + 0.6,
                    row * 1.5 + 1.2,
                    this.size.depth/2 + 0.1
                );
                windowFront.castShadow = true;
                this.group.add(windowFront);
                this.windows.push(windowFront);
                
                // Back windows
                const windowBack = new THREE.Mesh(windowGeo, windowMat);
                windowBack.position.set(
                    (col - cols/2) * 1.2 + 0.6,
                    row * 1.5 + 1.2,
                    -this.size.depth/2 - 0.1
                );
                windowBack.castShadow = true;
                this.group.add(windowBack);
                this.windows.push(windowBack);
            }
        }
        
        // Side windows
        for (let row = 0; row < rows; row++) {
            for (let side = 0; side < 2; side++) {
                const windowSide = new THREE.Mesh(windowGeo, windowMat);
                windowSide.rotation.y = Math.PI / 2;
                windowSide.position.set(
                    (side === 0 ? -this.size.width/2 - 0.1 : this.size.width/2 + 0.1),
                    row * 1.5 + 1.2,
                    (row - rows/2) * 1.2
                );
                windowSide.castShadow = true;
                this.group.add(windowSide);
                this.windows.push(windowSide);
            }
        }
    }
    
    addDetails() {
        this.addWindows();
        
        // Add building-specific features
        switch(this.type) {
            case 'education':
                this.addEducationFeatures();
                break;
            case 'skills':
                this.addSkillsFeatures();
                break;
            case 'experience':
                this.addExperienceFeatures();
                break;
            case 'projects':
                this.addProjectsFeatures();
                break;
            case 'achievements':
                this.addAchievementsFeatures();
                break;
            case 'contact':
                this.addContactFeatures();
                break;
        }
    }
    
    addEducationFeatures() {
        // Add books/stack on roof
        for (let i = 0; i < 3; i++) {
            const bookGeo = new THREE.BoxGeometry(0.6, 0.2, 0.8);
            const bookMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
            const book = new THREE.Mesh(bookGeo, bookMat);
            book.position.set(-0.5 + i * 0.5, this.size.height + 0.3, -0.5);
            book.rotation.y = i * 0.2;
            book.castShadow = true;
            this.group.add(book);
        }
        
        // Add graduation cap
        const capGeo = new THREE.ConeGeometry(0.4, 0.2, 8);
        const capMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(0, this.size.height + 0.6, 0.5);
        cap.castShadow = true;
        this.group.add(cap);
        
        const tasselGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3);
        const tasselMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const tassel = new THREE.Mesh(tasselGeo, tasselMat);
        tassel.position.set(0.2, this.size.height + 0.5, 0.7);
        tassel.castShadow = true;
        this.group.add(tassel);
    }
    
    addSkillsFeatures() {
        // Add antenna array
        for (let i = 0; i < 5; i++) {
            const antennaGeo = new THREE.CylinderGeometry(0.03, 0.05, 1.2);
            const antennaMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
            const antenna = new THREE.Mesh(antennaGeo, antennaMat);
            antenna.position.set(-0.8 + i * 0.4, this.size.height + 0.6, 0);
            antenna.castShadow = true;
            this.group.add(antenna);
            
            const ballGeo = new THREE.SphereGeometry(0.08);
            const ballMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
            const ball = new THREE.Mesh(ballGeo, ballMat);
            ball.position.set(-0.8 + i * 0.4, this.size.height + 1.2, 0);
            ball.castShadow = true;
            this.group.add(ball);
        }
        
        // Add satellite dish
        const dishGeo = new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const dishMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const dish = new THREE.Mesh(dishGeo, dishMat);
        dish.position.set(1, this.size.height + 0.5, 0.5);
        dish.rotation.x = Math.PI / 4;
        dish.rotation.z = Math.PI / 4;
        dish.castShadow = true;
        this.group.add(dish);
    }
    
    addExperienceFeatures() {
        // Add clock tower
        const towerGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.5);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0x886644 });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(0, this.size.height + 0.75, 0);
        tower.castShadow = true;
        this.group.add(tower);
        
        // Clock faces
        const clockGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
        const clockMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        
        for (let i = 0; i < 4; i++) {
            const clock = new THREE.Mesh(clockGeo, clockMat);
            clock.position.set(
                Math.sin(i * Math.PI/2) * 0.3,
                this.size.height + 1.2,
                Math.cos(i * Math.PI/2) * 0.3
            );
            clock.rotation.x = Math.PI / 2;
            clock.rotation.z = i * Math.PI/2;
            clock.castShadow = true;
            this.group.add(clock);
        }
    }
    
    addProjectsFeatures() {
        // Add solar panels
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
                const panelGeo = new THREE.BoxGeometry(1, 0.1, 0.8);
                const panelMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
                const panel = new THREE.Mesh(panelGeo, panelMat);
                panel.position.set((i - 1) * 1.2, this.size.height + 0.2 + j * 0.15, 0);
                panel.rotation.x = Math.PI / 6;
                panel.castShadow = true;
                this.group.add(panel);
            }
        }
        
        // Add wind turbine
        const towerGeo = new THREE.CylinderGeometry(0.1, 0.15, 2);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(1.5, this.size.height + 1, 0.5);
        tower.castShadow = true;
        this.group.add(tower);
        
        const blades = new THREE.Group();
        for (let i = 0; i < 3; i++) {
            const bladeGeo = new THREE.BoxGeometry(0.8, 0.1, 0.2);
            const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.position.set(0.4, 0, 0);
            blade.rotation.z = (i / 3) * Math.PI * 2;
            blade.castShadow = true;
            blades.add(blade);
        }
        blades.position.set(1.5, this.size.height + 2, 0.5);
        this.group.add(blades);
        this.turbineBlades = blades;
    }
    
    addAchievementsFeatures() {
        // Add trophy on top
        const baseGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.3);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(0, this.size.height + 0.15, 0);
        base.castShadow = true;
        this.group.add(base);
        
        const stemGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5);
        const stemMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.set(0, this.size.height + 0.55, 0);
        stem.castShadow = true;
        this.group.add(stem);
        
        const cupGeo = new THREE.ConeGeometry(0.3, 0.4, 8);
        const cupMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        const cup = new THREE.Mesh(cupGeo, cupMat);
        cup.position.set(0, this.size.height + 1.0, 0);
        cup.castShadow = true;
        this.group.add(cup);
        
        // Add stars around
        for (let i = 0; i < 5; i++) {
            const starGeo = new THREE.OctahedronGeometry(0.1);
            const starMat = new THREE.MeshStandardMaterial({ color: 0xffdd44, emissive: 0x442200 });
            const star = new THREE.Mesh(starGeo, starMat);
            const angle = (i / 5) * Math.PI * 2;
            star.position.set(Math.cos(angle) * 0.8, this.size.height + 1.2, Math.sin(angle) * 0.8);
            star.castShadow = true;
            this.group.add(star);
        }
    }
    
    addContactFeatures() {
        // Add communication tower
        const towerGeo = new THREE.CylinderGeometry(0.2, 0.3, 2);
        const towerMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(0, this.size.height + 1, 0);
        tower.castShadow = true;
        this.group.add(tower);
        
        // Add dishes
        for (let i = 0; i < 3; i++) {
            const dishGeo = new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3);
            const dishMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
            const dish = new THREE.Mesh(dishGeo, dishMat);
            const angle = (i / 3) * Math.PI * 2;
            dish.position.set(Math.cos(angle) * 0.6, this.size.height + 1.2 + i * 0.3, Math.sin(angle) * 0.6);
            dish.rotation.x = Math.PI / 3;
            dish.rotation.y = angle;
            dish.castShadow = true;
            this.group.add(dish);
        }
        
        // Add glowing beacon
        const beaconGeo = new THREE.SphereGeometry(0.15);
        const beaconMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x440000 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(0, this.size.height + 2.2, 0);
        beacon.castShadow = true;
        this.group.add(beacon);
    }
    
    setInfo(info) {
        this.info = info;
    }
    
    getInfo() {
        switch(this.type) {
            case 'education':
                return {
                    icon: '🎓',
                    title: 'Education',
                    content: [
                        { label: 'Degree', value: this.info.degree },
                        { label: 'College', value: this.info.college },
                        { label: 'CGPA', value: this.info.cgpa },
                        { label: 'School', value: this.info.school },
                        { label: 'HSE', value: this.info.hse },
                        { label: 'SSLC', value: this.info.sslc }
                    ]
                };
            case 'skills':
                return {
                    icon: '🔧',
                    title: 'Technical Skills',
                    content: [
                        { label: 'Microcontrollers', value: this.info.microcontrollers?.join(', ') },
                        { label: 'Protocols', value: this.info.protocols?.join(', ') },
                        { label: 'Languages', value: this.info.languages?.join(', ') },
                        { label: 'Tools', value: this.info.tools?.join(', ') },
                        { label: 'Cloud', value: this.info.cloud?.join(', ') }
                    ]
                };
            case 'experience':
                return {
                    icon: '💼',
                    title: 'Experience',
                    details: this.info.map(exp => ({
                        title: exp.company,
                        items: [
                            `${exp.role} (${exp.duration})`,
                            ...exp.highlights
                        ]
                    }))
                };
            case 'projects':
                return {
                    icon: '🚀',
                    title: 'Projects',
                    details: this.info.map(proj => ({
                        title: proj.name,
                        items: [
                            `Technologies: ${proj.technologies.join(', ')}`,
                            proj.description,
                            `Year: ${proj.year}`
                        ]
                    }))
                };
            case 'achievements':
                return {
                    icon: '🏆',
                    title: 'Achievements',
                    content: this.info
                };
            case 'contact':
                return {
                    icon: '📞',
                    title: 'Contact',
                    content: [
                        { label: 'Email', value: this.info.email },
                        { label: 'Phone', value: this.info.phone },
                        { label: 'LinkedIn', value: this.info.linkedin },
                        { label: 'GitHub', value: this.info.github },
                        { label: 'Location', value: this.info.location }
                    ]
                };
            default:
                return {
                    icon: '🏢',
                    title: this.type,
                    content: ['Information not available']
                };
        }
    }
    
    getColorHex() {
        return '#' + this.color.toString(16).padStart(6, '0');
    }
    
    getDistanceFrom(position) {
        const dx = position.x - this.position.x;
        const dz = position.z - this.position.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    highlight(enable) {
        if (enable === this.highlighted) return;
        
        this.highlighted = enable;
        
        if (enable) {
            // Pulse animation
            this.highlightIntensity = 0.5;
            this.mainMesh.material.emissive.setHex(0x444444);
            
            // Make windows glow
            this.windows.forEach(window => {
                window.material.emissive.setHex(0x442200);
            });
        } else {
            this.mainMesh.material.emissive.setHex(0x000000);
            this.windows.forEach(window => {
                window.material.emissive.setHex(0x221100);
            });
        }
    }
    
    update(deltaTime) {
        // Pulse highlight if active
        if (this.highlighted) {
            this.highlightIntensity += deltaTime * 2;
            const pulse = Math.sin(this.highlightIntensity) * 0.2 + 0.3;
            this.mainMesh.material.emissive.setHex(0x444444 * pulse);
        }
        
        // Rotate turbine blades if they exist
        if (this.turbineBlades) {
            this.turbineBlades.rotation.y += deltaTime * 2;
        }
    }
}