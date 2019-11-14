import { attachEffects, attach } from "three-effects";
import { WEBVR } from "./lib/WebVR.js";
import * as THREE from  "three";
import load from "./loader.js";

import initGround from "./ground.js";
import initSky from "./sky.js";

function initScene(renderer, scene, camera, assets) {
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;

    var user = new THREE.Group();
    var cc = [renderer.vr.getController(0),renderer.vr.getController(1)];
    user.add(camera);
    scene.add(user);
    
    // supercalifragilisticexpialidocious
    
    var speed = 0;
    var lastTime;
    var lastLeft;
    var lastRight;
 
    var dir = new THREE.Vector3();
    var angle = 0, dsum = 0;

    scene.addEventListener("beforeRender", function (e) {
        if(lastLeft === undefined) {
            lastLeft = cc[0].position.y;
            lastRight = cc[1].position.y;
            lastTime = e.time;
            return;
        }

        function clamp(a,b,v) {
            return Math.max(a, Math.min(b,v));
        }
            
        var dt = (e.time - lastTime) * 0.001;
        var dl = cc[0].position.y - lastLeft;
        var dr = cc[1].position.y - lastRight;
        
        camera.getWorldDirection(dir);

        lastLeft = cc[0].position.y;
        lastRight = cc[1].position.y;
        
        var smoothConstant = 0.33;

        camera.getWorldDirection(dir);

        var ds = clamp(-dt, dt,  -(dl + dr) - dt) * dt;
        
        
        if(ds <= 0) {
            if(dsum) scene.dispatchEvent({ type: "audio/flap" });
             dsum = 0;
        } else {
            dsum += ds;
        }

        user.position.y = smoothConstant * user.position.y + (1 - smoothConstant) * (user.position.y + (ds < 0 ? 33 : 100) * ds );
    
        user.position.y = clamp(0.1, 10, user.position.y);

        speed = smoothConstant * speed + (1 - smoothConstant) * clamp(1, 10, speed - 66 * ds - dt);
    
        var da = clamp(-1, 1, cc[0].position.y - cc[1].position.y) * dt;
    
        user.rotation.y = smoothConstant * angle + (1 - smoothConstant) * (angle - da);
        
        scene.dispatchEvent({ type: "update", speed: speed, angle: Math.PI - user.rotation.y, delta: dt});
    
        lastTime = e.time;
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

        console.log("AUDIO");
        function attachSound(name) {
            var s = new THREE.Audio( listener );
            s.setBuffer(assets[name]);
            s.setVolume( 1.0 );
            scene.addEventListener("audio/" + name, function (e){
                if(s.isPlaying) {
                    if(s.getLoop()) {
                        s.setVolume( e.volume || 1 );
                    } else {
                        var s2 = new THREE.Audio( listener );
                        s2.setBuffer(assets[name]);
                        s2.setVolume( e.volume || 1 );
                        s2.setLoop( !!e.loop );
                        s2.play();
                        s2.onended = function () { s2.disconnect(); }
                    }        
                } else {
                    s.setBuffer(assets[name]);
                    s.setVolume( e.volume || 1);
                    s.setLoop( !!e.loop );
                    s.play();
                    //debugger;
                }
            });
        }
        
        (["flap", "comeon", "woosh", "tick", "voop", "zit", "yeah", "wind", "tsiou"]).forEach(attachSound);

        scene.dispatchEvent({ type: "audio/wind", volume: 0.3, loop: true});
        document.body.removeEventListener("click", firstClick);
    }

    document.body.addEventListener("click", firstClick);
}

export { initScene, THREE, WEBVR, load }
