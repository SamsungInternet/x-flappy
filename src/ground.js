import {THREE} from "../../../dist/three-effects.js";
import pop from "./pop.js";

export default function (renderer, scene, camera, assets) {
    pop(scene);

    var group = new THREE.Group();

    var material = new THREE.MeshStandardMaterial({
        roughness: 1,
        aoMapIntensity: 2,
        aoMap: assets["ground_material"],
        map: assets["ground_diffuse"],
        roughnessMap: assets["ground_material"],
        normalMap: assets["ground_normals"]
    });

    (["map", "roughnessMap", "normalMap", "metalnessMap", "aoMap"]).forEach(function(k){
        if(!material[k]) return;
        material[k].wrapS = THREE.MirroredRepeatWrapping;
        material[k].wrapT = THREE.MirroredRepeatWrapping;
        material[k].anisotropy = 4;
        material[k].repeat.set(333, 333);
    });
    
    var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(1000,1000), material);

    mesh.receiveShadow = true;

    mesh.rotation.x = -Math.PI / 2;
    //mesh.position.y = -1;
    //mesh.visible = false;

    group.add(mesh);

    var pg = new THREE.PlaneBufferGeometry(2,2);
    pg.rotateX(-Math.PI / 2);

    
    var pointers = ([0, 1]).map(function(i){
        var timeUniform = { value: 0 };

        var pointer = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ depthWrite: false, depthTest: true, transparent: true }));
        pointer.material.onBeforeCompile = function(shader){
            shader.uniforms.time = timeUniform;
            shader.vertexShader = "varying vec2 vUv;\n" + shader.vertexShader.replace("#include <uv_vertex>", `
                vUv = uv;
                `
            );
            shader.fragmentShader = "varying vec2 vUv;uniform float time;\n" + shader.fragmentShader.replace("gl_FragColor", `
                float d =  distance(vUv, vec2(0.5));
                d = min(d, smoothstep(0.5, 0.3 + 0.06 * sin(time), d)) ;
                diffuseColor.a = pow(d,  3.) * 9.;
                gl_FragColor`
            );
        };

        pointer.time = timeUniform;
        pointer.material.color.setHex(0xCCCCCC);
        pointer.visible = false;
        group.add(pointer);
        return pointer;
    });

    scene.dispatchEvent({ type: "interact/register", entity: mesh });

    function getPointer(e) {
        return pointers[e.hand.index || 0];
    }

    mesh.addEventListener("interact/enter", function(e){
        getPointer(e).visible = true;
    });

    mesh.addEventListener("interact/leave", function(e){
        getPointer(e).visible = false;
    });

    mesh.addEventListener("interact/move", function(e){
        var pointer = getPointer(e);
        if(e.hand.hold) {
            var sc = 1 - e.hand.hold;
            pointer.scale.set(sc,sc,sc);
        } else {
            pointer.scale.set(1,1,1);
        }
        pointer.position.copy(e.point);
        pointer.position.y += 0.01;
        pointer.time.value += 0.02;
    });

    var evt = { type: "teleport", position: new THREE.Vector3() };

    mesh.addEventListener("interact/hold", function(e){
        evt.position.copy(e.point);
        scene.dispatchEvent(evt);
    });

    assets["column_model"].translate(0, -4.4, 0);

    assets["column_model"].scale(0.66, 0.66, 0.66);
    
    assets["column_model"].computeBoundingBox();

    function addColumn(pos) {
        var mesh = new THREE.Mesh(assets["column_model"], new THREE.MeshStandardMaterial({
            metalness: 0,
            roughness:0.66,
            aoMap:  assets["column_diffuse"],
            map: assets["column_diffuse"],
            roughnessMap: assets["column_diffuse"],
            normalMap: assets["column_normals"]
        }));

        
        scene.dispatchEvent({ type: "interact/register", entity: mesh });

        mesh.addEventListener("interact/enter", function(e){
            mesh.material.color.setHex(0x999999);
            scene.dispatchEvent({ type: "audio/tick" });
        });
        
        mesh.addEventListener("interact/leave", function(e){
            mesh.material.color.setHex(0xFFFFFF);
        });

        mesh.addEventListener("interact/release", function(e){
            scene.dispatchEvent({ type: "popout/register", entity: mesh });
            //group.remove(mesh);
        });

        mesh.position.copy(pos);

        scene.dispatchEvent({ type: "popin/register", entity: mesh });

        mesh.castShadow = true;
        
        mesh.receiveShadow = true;

        renderer.shadowMap.needsUpdate = true;

        scene.dispatchEvent({ type: "audio/voop" });

        group.add(mesh);
    }

    mesh.addEventListener("interact/release", function(e){
        if(e.point) addColumn(e.point);
    });

    return group;
}