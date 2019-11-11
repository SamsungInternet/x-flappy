import * as THREE from "three";
import attachSystem from "three-system";

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
        textureOffset.x += Math.sin(e.angle) * e.speed * e.delta * 0.1;
        textureOffset.y += Math.cos(e.angle) * e.speed * e.delta * 0.1;
    });

    attachSystem(scene, "move", {
        init: function(e, objects, name) {
            if(objects.length > 256) 
                scene.dispatchEvent({ entity: objects[0], type: name + "/unregister"});
            return {};
        },

        remove: function(e, objects, name) {
            e.entity.parent.remove(e.entity);
        },

        control: function (e, objects, name) {
            objects.forEach(function(obj){
                var a = Math.PI - e.angle;
                obj.position.x -= Math.sin(a) * e.speed * e.delta;
                obj.position.z -= Math.cos(a) * e.speed * e.delta;
                obj.position.y += e.delta;
            });
        }
    });

    function addBaloon() {
        var mesh = new THREE.Mesh(assets["baloon_model"], new THREE.MeshStandardMaterial({
            color: new THREE.Color(`hsl(${Math.random() * 255}, 80%, 40%)`),
            metalness: 0.1,
            roughness:0.1,
            transparent: true
        }));

        mesh.material.opacity = 0.5 ;

        var a = Math.PI * 2 * Math.random();
        var r = 3 + Math.random() * 6;
        
        mesh.position.set( Math.sin(a) * r, -3,  Math.cos(a) * r);
        scene.dispatchEvent({ type: "move/register", entity: mesh });
        
        //mesh.castShadow = true;
        
        //mesh.receiveShadow = true;

        scene.dispatchEvent({ type: "audio/voop" });

        group.add(mesh);
    }

    window.setInterval(addBaloon, 200);
    return group;
}