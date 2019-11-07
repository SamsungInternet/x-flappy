import * as THREE from "three";

export default function (renderer, scene, camera, assets) {
    
    var group = new THREE.Group();

    var material = new THREE.MeshStandardMaterial({
        roughness: 1,
        aoMapIntensity: 2,
        aoMap: assets["ground_material"],
        map: assets["ground_diffuse"],
        roughnessMap: assets["ground_material"],
        normalMap: assets["ground_normals"]
    });

    var textureOffset = new THREE.Vector2(0, 0);

    (["map", "roughnessMap", "normalMap", "metalnessMap", "aoMap"]).forEach(function(k){
        if(!material[k]) return;
        material[k].wrapS = THREE.MirroredRepeatWrapping;
        material[k].wrapT = THREE.MirroredRepeatWrapping;
        material[k].anisotropy = 4;
        material[k].repeat.set(100, 100);
        material[k].offset = textureOffset;
    });
    
    var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(1000,1000), material);

    mesh.receiveShadow = true;

    mesh.rotation.x = -Math.PI / 2;
    
    group.add(mesh);

    scene.addEventListener("control", function(e) {
        textureOffset.x += Math.sin(e.angle) * e.speed * e.delta;
        textureOffset.y += Math.cos(e.angle) * e.speed * e.delta;
    });

    function addBaloon(pos) {
        var mesh = new THREE.Mesh(assets["baloon_model"], new THREE.MeshStandardMaterial({
            metalness: 0,
            roughness:0.66,
            emmisive: emmisiveColor
        }));

        var randomAngle = Math.PI * 2 * Math.random();
        var randomRadious = 
        
        scene.dispatchEvent({ type: "collide/register", entity: mesh });
        scene.dispatchEvent({ type: "collide/register", entity: mesh });

        mesh.castShadow = true;
        
        mesh.receiveShadow = true;

        scene.dispatchEvent({ type: "audio/voop" });

        group.add(mesh);
    }

    return group;
}