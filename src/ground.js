import * as THREE from "three";
import attachSystem from "three-system";

export default function (renderer, scene, camera, assets) {
    
    var group = new THREE.Group();

    var material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(0x555555),
        shininess: 40,
        map: assets["ground_diffuse"],
        normalMap: assets["ground_normals"]
    });

    var textureOffset = new THREE.Vector2(0, 0);

    (["map", "roughnessMap", "normalMap", "aoMap"]).forEach(function(k){
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

    scene.addEventListener("update", function(e) {
        textureOffset.x -= Math.sin(e.angle) * e.speed * e.delta * 0.1;
        textureOffset.y -= Math.cos(e.angle) * e.speed * e.delta * 0.1;
    });

    var contacts = [], sum = 0;

    var raycaster = new THREE.Raycaster();

    attachSystem(scene, "move", {
        init: function(e, objects, name) {
            e.entity.scale.set(0.001,0.001,0.001);
            if(objects.length > 256) 
                scene.dispatchEvent({ entity: objects[0], type: name + "/unregister"});
            return { time: window.performance.now()};
        },

        remove: function(e, objects, name) {
            e.entity.parent.remove(e.entity);
        },

        update: function (e, objects, name) {
            var t = window.performance.now();
            objects.slice(0).forEach(function(obj){
                var a = e.angle, s;
                obj.position.x -= Math.sin(a) * e.speed * e.delta;
                obj.position.z -= Math.cos(a) * e.speed * e.delta;
                obj.position.y += e.delta;
                var l = obj.position.lengthSq();
                var ot = t - obj.userData[name].time;
                if( l > 240) {
                    s = Math.max(0.001, (250 - l) / 10);
                    obj.scale.set(s,s,s);
                    if(l >= 250) scene.dispatchEvent({type: name + "/unregister", entity: obj});
                } else if(ot < 1000) {
                    s = Math.max(0.001, ot / 1000);
                    obj.scale.set(s,s,s);
                } else {
                    s = 1;
                    obj.scale.set(1,1,1);
                }

                var r = obj.geometry.boundingSphere.radius;
                var idx = contacts.indexOf(obj);
                var rs = r * r * s * 6;
                if(l < rs) {
                    raycaster.ray.direction.copy(obj.position).normalize();
                    var ret = raycaster.intersectObject(obj);
                    if(ret.length) {
                        sum += Math.pow(1 - Math.min(3, ret[0].distance) / 3, 2);
                    } else {
                        scene.dispatchEvent({ type: "reset" });
                        scene.dispatchEvent({ type: "audio/zit" });
                        scene.dispatchEvent({ type: "audio/tsiou" });
                    }
                    if(idx === -1) contacts.push(obj);
                } else {
                    if(idx !== -1) contacts.splice(idx, 1);
                }
            });
            if(!contacts.length) {
                sum = Math.floor(sum);
                if(sum) scene.dispatchEvent({ type: "score", value: sum});
                sum = 0;
            }
            //console.log(contacts.length, sum);
        }
    });



    window.temp = assets["baloon_model"];

    assets["baloon_model"].translate(0, -5.3, 0);
    assets["baloon_model"].computeBoundingSphere();

    function addBaloon() {
        var mesh = new THREE.Mesh(assets["baloon_model"], new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${Math.random() * 255}, 80%, 40%)`),
            shininess: 80,
            transparent: true
        }));
    
        mesh.material.opacity = 0.66;

        
        var a = Math.PI * 2 * Math.random();
        var r = 0 + Math.random() * 6;
        
        mesh.position.set( Math.sin(a) * r, 0.33,  Math.cos(a) * r);
        scene.dispatchEvent({ type: "move/register", entity: mesh });
        
        //mesh.castShadow = true;
        
        //mesh.receiveShadow = true;

        //scene.dispatchEvent({ type: "audio/woosh" });

        group.add(mesh);
    }

    window.setInterval(addBaloon, 200);

    return group;
}