const font = new Font("default");
font.scale = 0.6;
font.outline = 1.0;
font.outline_color = Color.new(0, 0, 0);

Screen.setFrameCounter(true);
Screen.setVSync(1); 

const canvas = Screen.getMode();
canvas.zbuffering = true;
canvas.psmz = Screen.Z16S;
Screen.setMode(canvas);


Render.init();
Render.setView(60.0, 1.0, 4000.0);

os.chdir("models");

const sky = new Image("sky.png");
sky.width = canvas.width;
sky.height = canvas.height;


const skin_anims = new AnimCollection("ellie.gltf");
const gltf_skin = new RenderData("ellie.gltf");
gltf_skin.accurate_clipping = true;
gltf_skin.face_culling = Render.CULL_FACE_BACK;
gltf_skin.pipeline = Render.PL_NO_LIGHTS;

const cabelo_data = new RenderData("cabelo.gltf");
cabelo_data.accurate_clipping = true;
cabelo_data.face_culling = Render.CULL_FACE_BACK;
cabelo_data.pipeline = Render.PL_NO_LIGHTS;

const plane_data = new RenderData("map.gltf");
plane_data.accurate_clipping = true;
plane_data.face_culling = Render.CULL_FACE_NONE;
plane_data.pipeline = Render.PL_NO_LIGHTS;
plane_data.textures.forEach(texture => {
    texture.filter = LINEAR;
});


const localPlayer = new RenderObject(gltf_skin);
localPlayer.position = {x: 0.0, y: 0.0, z: 0.0};
localPlayer.rotation = {x: 0.0, y: 0.0, z: 0.0};
localPlayer.scale = {x: 10.07, y: 10.07, z: 10.07};

const cabelo = new RenderObject(cabelo_data);
cabelo.position = {x: 0.0, y: 0.0, z: 0.0};
cabelo.rotation = {x: 0.0, y: 0.0, z: 0.0};
cabelo.scale = {x: 10.07, y: 10.07, z: 10.07};

const plane_object = new RenderObject(plane_data);
plane_object.position = {x: 0.0, y: 50.0, z: 0.0};

//attention this is an garbage lfmao, not try use this -Math.PI + 600.045 have anothers ways to solve this

plane_object.rotation = {x: -Math.PI + 600.045, y: 0.0, z: 0.0};
plane_object.scale = {x: 50.08, y: 50.08, z: 50.08};

let cameraYaw = 0.0;
let cameraPitch = 0.5;
let cameraDistance = 15.0;
let moveSpeed = 0.5;
let currentSpeed = moveSpeed;
let currentAnimation = "Idle";

Camera.position(0.0, 0.0, 20.0);
Camera.target(0.0, 1.0, 0.0);

const light = Lights.new();
Lights.set(light, Lights.DIRECTION, 0.0, -1.0, 0.0);
Lights.set(light, Lights.AMBIENT, 0.4, 0.4, 0.4);
Lights.set(light, Lights.DIFFUSE, 1.0, 1.0, 1.0);

let pad = Pads.get(0);
const gray = Color.new(180, 180, 220, 128);

Screen.setParam(Screen.ALPHA_TEST_ENABLE, false);
Screen.setParam(Screen.ALPHA_TEST_METHOD, Screen.ALPHA_LESS);
Screen.setParam(Screen.ALPHA_TEST_REF, 0x80);
Screen.setParam(Screen.DEPTH_TEST_ENABLE, true);
Screen.setParam(Screen.DEPTH_TEST_METHOD, Screen.DEPTH_GEQUAL);

while (true) {
    Screen.clear(gray);
    pad.update();
    
    let lx = (Math.abs(pad.lx) > 20) ? pad.lx / 128.0 : 0.0;
    let ly = (Math.abs(pad.ly) > 20) ? pad.ly / 128.0 : 0.0;
    let rx = (Math.abs(pad.rx) > 20) ? pad.rx / 128.0 : 0.0;
    let ry = (Math.abs(pad.ry) > 20) ? pad.ry / 128.0 : 0.0;
    
    let moveX = 0.0;
    let moveZ = 0.0;
    let newAnimation = currentAnimation;

    if (lx !== 0.0 || ly !== 0.0) {
        moveX = -lx * Math.cos(cameraYaw) - ly * Math.sin(cameraYaw);
        moveZ = lx * Math.sin(cameraYaw) - ly * Math.cos(cameraYaw);
        
        currentSpeed = pad.pressed(Pads.R1) ? moveSpeed * 1.4 : moveSpeed * 0.5;
        
        let newX = localPlayer.position.x + (moveX * currentSpeed);
        let newZ = localPlayer.position.z + (moveZ * currentSpeed);
        
        localPlayer.position = { x: newX, y: localPlayer.position.y, z: newZ };
        
        let targetYaw = Math.atan2(moveX, moveZ);
        localPlayer.rotation = { x: 0.0, y: targetYaw, z: 0.0 };
        
        newAnimation = pad.pressed(Pads.R1) ? "Run" : "Walking";
    } else {
        newAnimation = "Idle";
    }
    

    cabelo.position = { x: localPlayer.position.x, y: localPlayer.position.y, z: localPlayer.position.z };
    cabelo.rotation = { x: localPlayer.rotation.x, y: localPlayer.rotation.y, z: localPlayer.rotation.z };
    
    if (newAnimation !== currentAnimation) {
    currentAnimation = newAnimation;


    if (skin_anims[currentAnimation]) {
        localPlayer.playAnim(skin_anims[currentAnimation], true);
    }

   
    if (skin_anims[currentAnimation]) {
        cabelo.playAnim(skin_anims[currentAnimation], true);
    }
}

    if (rx !== 0.0 || ry !== 0.0) {
        cameraYaw += rx * 0.05;
        cameraPitch -= ry * 0.02;
        cameraPitch = Math.max(-1.2, Math.min(1.2, cameraPitch));
    }
    
    let camX = localPlayer.position.x - Math.sin(cameraYaw) * Math.cos(cameraPitch) * cameraDistance;
    let camY = localPlayer.position.y + Math.sin(cameraPitch) * cameraDistance + 5.0;
    let camZ = localPlayer.position.z - Math.cos(cameraYaw) * Math.cos(cameraPitch) * cameraDistance;
    
    Camera.position(camX, camY, camZ);
    Camera.target(localPlayer.position.x, localPlayer.position.y + 5.0, localPlayer.position.z);
    Camera.update();
    
    Screen.setParam(Screen.DEPTH_TEST_ENABLE, false);

    sky.draw(0, 0);

    Screen.setParam(Screen.DEPTH_TEST_ENABLE, true);
    Screen.setParam(Screen.DEPTH_TEST_METHOD, Screen.DEPTH_GEQUAL);

    plane_object.render();
    localPlayer.render();
    cabelo.render(); 
    
    Screen.setParam(Screen.DEPTH_TEST_ENABLE, false);
    
    font.print(10, 10, Screen.getFPS(360) + " FPS");
    font.print(10, 30, "Pos: " + localPlayer.position.x.toFixed(2) + ", " + localPlayer.position.z.toFixed(2));
    
    Screen.flip();
    
}