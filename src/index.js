import { THREE, attachEffects, attach } from "../../../dist/three-effects.js";

import initGround from "./ground.js";
import initSky from "./sky.js";
import initStatues from "./statues.js";
import attachInteract from "./interact.js";
import attachLabel from "./label.js";

export default function (renderer, scene, camera, assets) {
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;

    var user = new THREE.Group();
    var cc = [renderer.vr.getController(0),renderer.vr.getController(1)];
    user.add(camera);
    scene.add(user);
    
    // Movement

    var angle = 0;
    var speed = 0;
    var ascend = 0;
    var turn = 0;

    var lastTime;
    var lastLeft;
    var lastRight;

    var lastForce;

    scene.addEventListener("beforeRender", function (e) {
        if(lastLeft === undefined) {
            lastLeft = cc[0].position.y;
            lastRight = cc[1].position.y;
            lastTime = e.time;
            return;
        }

        // magic flying formula 
        var dt = e.time - lastTime;
        var dl = cc[0].position.y - lastLeft;
        var dr = cc[1].position.y - lastRight;

        var ds = Math.max(0, -1 * (dl + dr)) * e.time * 0.01;
        camera.position.y +=  ds;
        camera.rotation.y += (cc[0].position.y - cc[1].position.y) * e.time * 0.01;
        
        //lastForce = lastForce !== undefined ? ds - lastForce;

        speed = Math.max(0.1, Math.min(10, speed - ds));
        scene.dispatchEvent({ type: "control", speed, angle, height: camera.position.y });
    
    })


    var fx = attachEffects(scene, window.location.hash === "#antialias");

    window.fx = fx;

   attach.bloom(scene, { strength: 0.33, radius: 1, threshold: 0.5 });
    window.scene = scene;
    scene.userData.bloom_internal.prePass.onBeforeCompile = function (shader) {
        shader.fragmentShader = shader.fragmentShader.replace("gl_FragColor", "alpha *= smoothstep(1., 0.999, texture2D(depthTexture, vUv).r);\ngl_FragColor");
    }

    fx(["fxaa", "bloom"]);

    
    var objects = {
        sky: initSky(renderer, scene, camera, assets),
        ground: initGround(renderer, scene, camera, assets)
    }

    Object.values(objects).forEach(function (o) { scene.add(o); });
    
    var listener;

    var firstClick = function () {
        listener = new THREE.AudioListener();
        listener.context.resume();
        camera.add( listener );

        function attachSound(name) {
            var s = new THREE.Audio( listener );
            s.setBuffer(assets[name]);
            s.setVolume( 1.0 );
            scene.addEventListener("audio/" + name, function (){
                if(s.isPlaying) {
                    var s2 = new THREE.Audio( listener );
                    s2.setBuffer(assets[name]);
                    s2.setVolume( 1.0 );
                    s2.play();        
                } else {
                    s.play();
                }
            });
        }
        
        (["flap", "comeon", "woosh", "tick", "voop", "zit"]).forEach(attachSound);

        window.removeEventListener("click", firstClick);
    }

    window.addEventListener("click", firstClick);
}
