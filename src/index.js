import * as THREE from "three";
//import fragment from "../shader/fragment.glsl";
//import vertex from "../shader/vertex.glsl";

const glsl = require("glslify");

// import dat from "dat-gui";
let OrbitControls = require("three-orbit-controls")(THREE);

let vertexS = glsl(/*glsl*/ ` 
                            
uniform float time;
varying vec2 vUv;
varying vec3 vPosition;
uniform vec2 pixels;
float PI = 3.141592653589793238;
void main() {
  vUv = uv;
  vPosition = position;
  vec3 newPos = position;
  float t = time * .02;
 // newPos.x *= 0.5*1.-tan(sin(t*.3*2.0*PI));
 // newPos.y *= 0.5*tan(t*.5*2.0*PI);
  //newPos.z *= 0.6*-tan(t*.3*2.0*PI);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( newPos, 1.0 );
}
  `);

let fragmentS = glsl(/*glsl*/ `
//	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}  
uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;
float PI = 3.141592653589793238;
void main()	{
  float noiseValue = snoise(vec3(vUv.x, vUv.x, time));
  vec2 newUV = (vUv - vec2(0.5))*resolution.zw + vec2(0.5);
  vec2 cloudUV = vUv;
  float circle = length(vUv-vec2(0.5));

  circle = smoothstep(circle*0.8, circle*1.,0.4);

  //circle *= circle;
  vec3 white = vec3(1.,1.,1.);
  white *= circle;
  //newUV.y = sin(2.*vPosition.x+0.5+time*0.5);
  //newUV.x = sin(20.*vPosition.y+time*0.5*snoise(vec3(newUV.y, newUv.y, time)));
  float finalCol = snoise(2.*vec3(cloudUV.x, cloudUV.y, time +3. *0.7))+0.035;
  finalCol += 0.6*snoise(4.*vec3(cloudUV.x, cloudUV.y, time *0.3))-0.5;
  finalCol += 0.1*snoise(10.*vec3(vUv.y , vUv.x, -time+20. *0.5))+0.1;
  finalCol -= 0.3*snoise(4.*vec3(vUv.y , vUv.x, time *0.83))+0.05;
  finalCol += 0.3*snoise(8.*vec3(vUv.x , vUv.y, time *0.85))+0.1;
  finalCol += 0.06*snoise(32.*vec3(vUv.x , vUv.y, time *0.85))+0.2;
  //finalCol /= 6.;
  //finalCol /= 2.;
  vec3 finalMix = mix(vec3(0.0), vec3(finalCol), circle*circle);
  finalMix = clamp(finalMix, 0.,1.);
	gl_FragColor = vec4(vec3(1.-finalMix*finalMix*finalMix), 0.2-finalMix*finalMix);
}
  `);

let fragmentS2 = glsl(/*glsl*/ `
//	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

// Permutations
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients
// ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}  
uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;
float PI = 3.141592653589793238;
void main()	{
  float noiseValue = snoise(vec3(vUv.x, vUv.x, time));
  vec2 newUV = (vUv - vec2(0.5))*resolution.zw + vec2(0.5);
  vec2 cloudUV = vUv;
  float circle = length(vUv-vec2(0.5));

  circle = smoothstep(circle*0.8, circle*1.,0.4);

  //circle *= circle;
  vec3 white = vec3(1.,1.,1.);
  white *= circle;
  //newUV.y = sin(2.*vPosition.x+0.5+time);
  //newUV.x = sin(20.*vPosition.y+snoise(vec3(newUV.y, newUv.y, time)));
  float finalCol = snoise(3.*vec3(2.*cloudUV.x,2.* cloudUV.y, time 2.));
  finalCol += 0.72*snoise(2.*vec3(cloudUV.x, cloudUV.y, time *0.3));
  finalCol += 0.1*snoise(10.*vec3(vUv.y , vUv.x, -time *0.5));
  finalCol += 0.03*snoise(4.*vec3(vUv.y , vUv.x, time *0.83));
  finalCol += 0.03*snoise(3000.*vec3(vUv.x , vUv.y, time *0.85));
  finalCol += 0.02*snoise(300.*vec3(vUv.x , vUv.y, time *0.85));
  finalCol /= 6.;
  vec3 finalMix = mix(vec3(0.0), vec3(finalCol), circle);
  finalMix = clamp(finalMix, 0.,1.);
	gl_FragColor = 1.-vec4(vec3(finalMix*finalMix*finalMix), finalMix);
}
  `);

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.container = options.dom;
    this.button = options.button;

    // this.button.innerHTML = "CLICK ME";
    // this.button.classList.add("myButton");
    // this.container.appendChild(this.button);

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0xeeeeee, 0);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    // this.camera = new THREE.PerspectiveCamera(
    //   70,
    //   window.innerWidth / window.innerHeight,
    //   0.001,
    //   1000
    // );

    var frustumSize = 0.4;
    var aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      -1000,
      1000
    );
    //this.camera.position.set(0, 0, 0.5);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    this.addCloud1();
    this.addCloud2();
    this.addCloud3();
    this.resize();
    this.render();
    this.setupResize();
    // this.settings();
  }

  // settings() {
  //   let that = this;
  //   this.settings = {
  //     progress: 0
  //   };
  //   this.gui = new dat.GUI();
  //   this.gui.add(this.settings, "progress", 0, 1, 0.01);
  // }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addCloud1() {
    let that = this;

    this.uniforms = THREE.UniformsLib.common;
    this.uniforms.time = { type: "f", value: 0 };
    this.uniforms.resoultion = { type: "v4", value: new THREE.Vector4() };
    this.uniforms.uvRate1 = new THREE.Vector2(1, 1);

    this.shaderMat = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: this.uniforms,
      // wireframe: true,
      transparent: true,
      vertexShader: vertexS,
      fragmentShader: fragmentS
    });

    this.material = new THREE.MeshNormalMaterial();
    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 10);
    //
    this.box = new THREE.Mesh(this.geometry, this.shaderMat);
    this.box.position.copy(new THREE.Vector3(0, 0, 0));
    this.scene.add(this.box);
  }

  addCloud2() {
    let that = this;

    this.uniforms2 = THREE.UniformsLib.common;
    this.uniforms2.time = { type: "f", value: 0 };
    this.uniforms2.resoultion = { type: "v4", value: new THREE.Vector4() };
    this.uniforms2.uvRate1 = new THREE.Vector2(1, 1);

    this.shaderMat2 = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: this.uniforms2,
      // wireframe: true,
      transparent: true,
      vertexShader: vertexS,
      fragmentShader: fragmentS2
    });

    this.material2 = new THREE.MeshNormalMaterial();
    this.geometry2 = new THREE.PlaneBufferGeometry(1, 1, 10);
    //
    this.box2 = new THREE.Mesh(this.geometry, this.shaderMat);
    this.box2.position.copy(new THREE.Vector3(0, 0.5, 0));
    this.scene.add(this.box2);
  }

  addCloud3() {
    let that = this;

    this.uniforms3 = THREE.UniformsLib.common;
    this.uniforms3.time = { type: "f", value: 0 };
    this.uniforms3.resoultion = { type: "v4", value: new THREE.Vector4() };
    this.uniforms3.uvRate1 = new THREE.Vector2(1, 1);

    this.shaderMat3 = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: this.uniforms3,
      // wireframe: true,
      transparent: true,
      vertexShader: vertexS,
      fragmentShader: fragmentS2
    });

    this.material3 = new THREE.MeshNormalMaterial();
    this.geometry3 = new THREE.PlaneBufferGeometry(1, 1, 10);
    //
    this.box3 = new THREE.Mesh(this.geometry, this.shaderMat);
    this.box3.position.copy(new THREE.Vector3(0, -0.5, 0));
    this.scene.add(this.box3);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time = this.clock.getElapsedTime() * 0.3;
    // this.box.position.x = 0.2*Math.sin(this.time);
    // this.box.position.y = 0.2*Math.cos(this.time);
    // this.box.position.z = 0.00;
    this.box2.position.x = -0.1 * Math.sin(this.time);
    this.box2.position.y = -0.1 * Math.cos(this.time);
    // this.box2.position.z += 0.00;
    this.box3.position.x = -0.1 * Math.sin(this.time);
    this.box3.position.y = -0.1 * Math.cos(this.time);
    this.box3.position.z = -0.1 * Math.cos(this.time);
    this.shaderMat.uniforms.time.value = this.time * 1;
    this.shaderMat2.uniforms.time.value = this.time * 0.5;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container")
  //button: document.createElement("BUTTON"),
});
