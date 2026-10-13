// Junkwing 1903 — real WebGL flight range. Original procedural geometry, no copied assets.
// The dependency is dynamically loaded only when the signed-in game is opened.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { AIRFRAMES, clamp, terrainHeight } from './physics.js';

export const STAGES = Object.freeze([
  { id:'islands', name:'ISLAND PROVING GROUND', start:0, goal:1250, accent:'#63aee2', title:'Clear the lagoon and reach the flats' },
  { id:'workshop', name:'GIANT WORKSHOP', start:1450, goal:1350, accent:'#edaa66', title:'Fly between oversized furniture and out the doors' },
  { id:'metro', name:'METRO CANYON', start:3050, goal:1500, accent:'#df765a', title:'Choose an avenue before the skyline closes in' },
  { id:'studio', name:'DESIGN STUDIO', start:4800, goal:1650, accent:'#7891e0', title:'Skim desks, lights and drafting tables' },
  { id:'harvest', name:'HARVEST RUN', start:6800, goal:1600, accent:'#86b27c', title:'Silos, windpumps and the final field' },
]);

const hash = n => { const v = Math.sin(n * 127.1 + 78.23) * 43758.5453; return v - Math.floor(v); };
const colors = [0xd5a979,0xe5c4a0,0x9cb0b0,0xb39b90,0xc9c6b5,0x9bb2c2];
const make = (x,z,w,d,h,kind,seed) => Object.freeze({
  x,z,w,d,h,kind,color:colors[Math.floor(hash(seed)*colors.length)]
});

function createMap() {
  const b=[]; let n=20;
  const add=(x,z,w,d,h,kind)=>b.push(make(x,z,w,d,h,kind,n++));

  // 1 — Island proving ground: readable open centerline, shore cabins and a few
  // obstacles that force a deliberate climb without turning the map into noise.
  for(let i=0;i<14;i++){
    const x=330+i*63;
    add(x,-145-(i%3)*34,32+(i%2)*12,30,14+(i%4)*5,'shore-house');
    if(i%2===0)add(x+24,160+(i%3)*31,28,26,12+(i%3)*4,'shore-house');
  }
  add(690,-72,62,40,22,'boathouse');
  add(865,92,52,44,28,'boathouse');

  // 2 — Giant Workshop: an authored indoor obstacle course. Large desk tops,
  // cabinets and chairs leave several obvious but different-height routes.
  const s2=1450;
  for(const [dx,z,w,d,h,k] of [
    [175,-170,150,86,44,'workbench'],[175,170,150,86,44,'workbench'],
    [430,-92,86,72,92,'cabinet'],[430,120,86,72,70,'cabinet'],
    [650,-190,180,92,46,'table'],[650,120,135,88,62,'table'],
    [880,-42,92,76,110,'shelf'],[880,168,92,76,84,'shelf'],
    [1090,-175,170,80,48,'workbench'],[1110,95,122,74,72,'cabinet']
  ]) add(s2+dx,z,w,d,h,k);

  // 3 — Metro Canyon: block-by-block streets rather than random tower soup.
  const s3=3050;
  for(let row=0;row<18;row++){
    const x=s3+145+row*72;
    // alternating gaps create left/right route decisions visible well in advance
    const gap=(row%5===1)?-1:(row%5===3?1:0);
    for(const lane of [-3,-2,-1,1,2,3]){
      if((gap<0&&lane===-1)||(gap>0&&lane===1))continue;
      const z=lane*82;
      const h=34+hash(row*13+lane*7+90)*110;
      add(x+(lane%2)*7,z,44+hash(row+lane+33)*17,51,h,'metro');
    }
  }
  // landmark towers frame the final approach without closing the center route.
  add(s3+1260,-160,72,72,166,'landmark');
  add(s3+1260,165,72,72,142,'landmark');

  // 4 — Design Studio: broad desks, drafting tables, hanging partitions.
  const s4=4800;
  for(const [dx,z,w,d,h,k] of [
    [130,-165,190,95,38,'desk'],[130,140,190,95,38,'desk'],
    [410,-35,150,105,52,'draft-table'],[625,170,210,105,42,'desk'],
    [650,-175,165,86,74,'cabinet'],[900,-40,230,98,42,'conference'],
    [1170,150,190,92,50,'desk'],[1210,-155,115,84,96,'cabinet'],
    [1450,0,145,80,68,'partition']
  ]) add(s4+dx,z,w,d,h,k);

  // 5 — Harvest Run: sparse but imposing farm structures and wide flight lines.
  const s5=6800;
  for(let i=0;i<12;i++){
    const x=s5+160+i*112;
    const side=i%2?-1:1;
    add(x,side*(150+(i%3)*42),72,58,24+(i%3)*5,'hangar');
    if(i%3===0)add(x+38,-side*105,34,34,72+(i%2)*18,'silo');
  }
  add(s5+540,-32,95,58,34,'barn');
  add(s5+980,64,105,64,38,'barn');
  return b;
}
export const MAP_OBSTACLES = Object.freeze(createMap());
export const COINS = Object.freeze(Array.from({length:168},(_,i)=>{
  const stage = Math.min(STAGES.length-1,Math.floor(i/34));
  const s = STAGES[stage], index=i%34;
  const x=s.start+90+index*(s.goal-120)/34;
  const z=Math.sin(index*.66+stage*2)*48 + (index%4===0 ? 18 : -8);
  return Object.freeze({x,z,y:18+8*Math.sin(index*.23)**2, value:20+stage*30});
}));
export function stageFromIndex(index){return STAGES[clamp(Math.floor(index)||0,0,STAGES.length-1)];}

const palette = {
  grass: [0x83b663,0x7fa95e,0x6b9858,0x80a75f,0x92b56c],
  sand: [0xd9b176,0xcfa46c,0xe5c38d,0xcbaa7a],
  town: [0x7eaa76,0x8db37b,0x95ad75],
  urban: [0x8eaa8c,0x9ab2a0,0xa7b2a1],
  coast: [0x83b96a,0x72a85c,0x93bf77],
};
const material = (color, roughness=.85, metalness=0) =>
  new THREE.MeshStandardMaterial({ color,roughness,metalness });
const wood=material(0x8e5836), darkWood=material(0x66422d), rubber=material(0x4b332d);
const fabric=material(0xf0d9a2), ivory=material(0xe5dfcf);
const steel=material(0x59656b,.46,.35), brass=material(0xdca954,.45,.35);
const red=material(0x9e403c), teal=material(0x4c7576);
const groundMats = [
  material(0x85b86a),material(0xcba46f),material(0x8caa75),
  material(0x87988b),material(0x83ac69)
];
const boxGeo=new THREE.BoxGeometry(1,1,1);
const coneGeo=new THREE.ConeGeometry(1,1,5);
const trunkGeo=new THREE.CylinderGeometry(.35,.48,1,6);
const tmpObj=new THREE.Object3D();
const tmpColor=new THREE.Color();

function box(parent, dims, position, mat, rotate){
  const mesh=new THREE.Mesh(boxGeo,mat);
  mesh.scale.set(...dims);
  mesh.position.set(...position);
  if(rotate)mesh.rotation.set(...rotate);
  mesh.castShadow=true;
  mesh.receiveShadow=true;
  parent.add(mesh);
  return mesh;
}
function blade(parent,radius,mat,ang=0){
  const bar=box(parent,[.48,radius,.25],[0,radius*.48,0],mat);
  bar.rotation.x=ang;
  return bar;
}
function connectCylinder(mesh,a,b,radius){
  const start=new THREE.Vector3(...a), end=new THREE.Vector3(...b);
  const delta=end.clone().sub(start);
  mesh.position.copy(start.add(end).multiplyScalar(.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());
  mesh.scale.set(radius,delta.length(),radius);
}
function biplaneWing(span,mat){
  const geom=new THREE.BufferGeometry();
  const shape = [
    -6,0,-span,  5,0,-span+1.8, 8,0,span-1.8, -6,0,span
  ];
  const P=(x,y,z)=>new THREE.Vector3(x,y,z);
  const p=[P(-6,-.24,-span),P(5,-.24,-span+1.5),P(8,-.24,span-1.5),P(-6,-.24,span),
    P(-6,.24,-span),P(5,.24,-span+1.5),P(8,.24,span-1.5),P(-6,.24,span)];
  const f=[[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],
    [1,5,6],[1,6,2],[2,6,7],[2,7,3],[3,7,4],[3,4,0]];
  const arr=[];
  for(const face of f)for(const i of face)arr.push(p[i].x,p[i].y,p[i].z);
  geom.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));
  geom.computeVertexNormals();
  const mesh=new THREE.Mesh(geom,mat);
  mesh.castShadow=true;
  return mesh;
}
function createPlane(root){
  const body=new THREE.Group();root.add(body);
  // Clean, original plane inspired by early aviation and mechanical arcade flyers.
  const shell=new THREE.Mesh(new THREE.CylinderGeometry(1.65,.86,17,10,1),material(0x837568,.67));
  shell.rotation.z=-Math.PI/2;shell.position.x=-.7;shell.castShadow=true;body.add(shell);
  const nose=new THREE.Mesh(new THREE.ConeGeometry(1.62,5,10),ivory);
  nose.rotation.z=-Math.PI/2;nose.position.x=10.3;nose.castShadow=true;body.add(nose);
  const cockpit=new THREE.Mesh(new THREE.SphereGeometry(1.8,12,8),material(0x304e5b,.19,.15));
  cockpit.scale.set(2,.75,.9);cockpit.position.set(0,1.4,0);body.add(cockpit);
  box(body,[3.5,.35,2.3],[-7.5,.4,0],red);
  const wingL=biplaneWing(8.7,fabric),wingR=biplaneWing(8.7,fabric);
  wingL.position.set(0,.7,-8.7);wingR.position.set(0,.7,8.7);
  body.add(wingL,wingR);
  // Wingtip braces only show after part installation.
  const tail=box(body,[4.5,.24,10],[-7.5,1,0],ivory);
  const rudder=box(body,[2.8,4,.28],[-9,2.4,0],red);
  const propeller=new THREE.Group();propeller.position.set(13,0,0);body.add(propeller);
  box(propeller,[.7,7.4,.5],[0,0,0],darkWood);
  box(propeller,[.85,.9,.9],[0,0,0],brass);
  const engine=new THREE.Group();body.add(engine);
  for(let j=0;j<4;j++)box(engine,[1.3,.75,1.1],[7.4,-.3,-2.2+j*1.45],steel);
  const wires=[];
  for(const z of [-8,8]){
    const rod=box(body,[.18,4.5,.18],[-2,2.6,z],steel);
    wires.push(rod);
  }
  const components={wingL,wingR,tail,rudder,propeller,engine,wires,body};
  return{
    components,
    setParts(level, upgrades, airframe){
      const n=Math.max(0,level);
      wingL.visible=n>=1;wingR.visible=n>=2;
      tail.visible=n>=3;rudder.visible=n>=3;
      propeller.visible=n>=4;engine.visible=n>=5||(upgrades.engine||0)>0;
      wires.forEach(v=>{v.visible=n>=2;});
      body.scale.setScalar(1+Math.max(0,(upgrades.frame||0))*.018);
      wingL.scale.set(1+Math.max(0,n-4)*.045,1,1+Math.max(0,n-4)*.03);
      wingR.scale.copy(wingL.scale);
      if(airframe&&airframe!=='flyer') body.scale.multiplyScalar(1.04);
    },
    spin(dt,flying){if(propeller.visible&&flying)propeller.rotation.x+=dt*33;},
    dispose(){root.traverse(o=>{if(o.geometry&&!([boxGeo,coneGeo,trunkGeo].includes(o.geometry)))o.geometry.dispose();});}
  };
}
function createSling(scene){
  const g=new THREE.Group();
  scene.add(g);
  box(g,[55,1.2,17],[-18,-.8,0],material(0x9c7e50));
  for(let i=0;i<13;i++)box(g,[2.1,.45,17],[-43+i*4,-.05+i*.06,0],darkWood);
  const L=box(g,[4,22,4],[4,10,-13],wood,[.1,0,-.09]);
  const R=box(g,[4,22,4],[4,10,13],wood,[.1,0,-.09]);
  box(g,[2,2,30],[4,19,0],darkWood);
  const cordGeometry=new THREE.CylinderGeometry(1,1,1,6);
  const left=new THREE.Mesh(cordGeometry,rubber);
  const right=new THREE.Mesh(cordGeometry,rubber);
  g.add(left,right);
  const pivot=new THREE.Group();pivot.position.set(-15,6,0);g.add(pivot);
  box(pivot,[4,4,9],[0,0,0],darkWood);
  const segmentCount=6;
  for(let i=0;i<segmentCount;i++) box(g,[1.7,2,22],[-55+i*8,-1+i*.05,0],wood);
  return {
    g,
    update(stageStart,pull,visible,planePos){
      g.position.x=stageStart;
      g.visible=visible;
      if(!visible)return;
      const v=planePos;
      connectCylinder(left,[4,20,-13],[v.x-stageStart-3,v.y, v.z-2],.38);
      connectCylinder(right,[4,20,13],[v.x-stageStart-3,v.y,v.z+2],.38);
      pivot.position.x=-15-pull*32;
    },
    dispose(){cordGeometry.dispose();}
  };
}
function makeTerrain(scene){
  const row=[];
  for(let s=0;s<STAGES.length;s++){
    const stage=STAGES[s];
    const geo=new THREE.PlaneGeometry(stage.goal+480,1350, Math.ceil((stage.goal+480)/50),22);
    // local plane initially XY; rotate down to world XZ.
    geo.rotateX(-Math.PI/2);
    const pos=geo.attributes.position;
    const start=stage.start-140;
    const end=stage.start+stage.goal+340;
    const center=(start+end)/2;
    for(let i=0;i<pos.count;i++){
      const worldX=pos.getX(i)+center, z=pos.getZ(i);
      const y=terrainHeight(worldX)+Math.sin(worldX*.017+z*.015)*.23;
      pos.setY(i,y);
    }
    geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,groundMats[s]);
    mesh.position.set(center,-1,0);
    mesh.receiveShadow=true;
    scene.add(mesh);
    row.push(mesh);
    if(s===0){
      const waterMat=material(0x5ca8c6,.16,.12);
      const water=new THREE.Mesh(new THREE.PlaneGeometry(1900,880),waterMat);
      water.rotation.x=-Math.PI/2;water.position.set(650,-.82,500);scene.add(water);
      const water2=water.clone();water2.position.z=-500;scene.add(water2);
      // sandy transition near the end of the opening level
      box(scene,[360,.18,900],[1060,-.12,0],material(0xd8ba82));
    } else if(s===1){
      // Interior shell: floor, tall side walls, ceiling beams and an exit opening.
      box(scene,[stage.goal+320,.22,920],[stage.start+stage.goal*.5,-.32,0],material(0xb68a61));
      box(scene,[stage.goal+320,170,12],[stage.start+stage.goal*.5,84,-466],material(0xe0d2b9));
      box(scene,[stage.goal+320,170,12],[stage.start+stage.goal*.5,84,466],material(0xe0d2b9));
      for(let x=stage.start+120;x<stage.start+stage.goal;x+=210)
        box(scene,[14,8,930],[x,148,0],darkWood);
    } else if(s===3){
      box(scene,[stage.goal+300,.24,900],[stage.start+stage.goal*.5,-.28,0],material(0xb0a596));
      for(let x=stage.start+160;x<stage.start+stage.goal;x+=260)
        box(scene,[10,130,8],[x,65,-430],steel);
    } else if(s===4){
      // broad runway on the final third
      box(scene,[stage.goal*.72,.12,68],[stage.start+stage.goal*.63,-.08,0],material(0x666d6d));
      for(let i=0;i<20;i++)
        box(scene,[18,.15,2],[stage.start+stage.goal*.32+i*54,.03,0],ivory);
    }
    const road=box(scene,[stage.goal+250,.10,22],[stage.start+stage.goal*.5,-.1,-52],material(s===4?0x8c785c:0x747574));
    road.receiveShadow=true;road.castShadow=false;
  }
  return row;
}
function buildBuildings(scene){
  const geo=boxGeo, mat=material(0xffffff);
  const mesh=new THREE.InstancedMesh(geo,mat,MAP_OBSTACLES.length);
  const cap=new THREE.InstancedMesh(geo,material(0x68656a),MAP_OBSTACLES.length);
  const windows=[];
  for(let i=0;i<MAP_OBSTACLES.length;i++){
    const b=MAP_OBSTACLES[i],y=terrainHeight(b.x)+b.h/2;
    tmpObj.position.set(b.x,y,b.z);
    tmpObj.scale.set(b.w,b.h,b.d);tmpObj.rotation.set(0,0,0);tmpObj.updateMatrix();
    mesh.setMatrixAt(i,tmpObj.matrix);
    mesh.setColorAt(i,tmpColor.setHex(b.color));
    tmpObj.position.y+=b.h/2+.75;tmpObj.scale.set(b.w+1,1.5,b.d+1);tmpObj.updateMatrix();
    cap.setMatrixAt(i,tmpObj.matrix);
    if(b.kind==='tower'||b.kind==='town'){
      // Windows are individual lights, but only a couple per floor to cap GPU work.
      for(let floor=0;floor<Math.min(12,Math.floor(b.h/9));floor++){
        const wy=terrainHeight(b.x)+floor*8+5;
        windows.push([b.x+b.w/2+.3,wy,b.z-5]);
        windows.push([b.x-b.w/2-.3,wy,b.z+5]);
      }
    }
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  cap.instanceMatrix.needsUpdate=true;
  mesh.castShadow=false;mesh.receiveShadow=true;
  scene.add(mesh,cap);
  const lights=new THREE.InstancedMesh(boxGeo,new THREE.MeshBasicMaterial({color:0xf6dc9e}),windows.length);
  windows.forEach(([x,y,z],i)=>{
    tmpObj.position.set(x,y,z);tmpObj.scale.set(.23,2.3,3.6);tmpObj.rotation.set(0,0,0);tmpObj.updateMatrix();lights.setMatrixAt(i,tmpObj.matrix);
  });
  lights.instanceMatrix.needsUpdate=true;
  scene.add(lights);
}
function buildTrees(scene){
  const trunks=[],leaves=[];
  for(let s=0;s<STAGES.length;s++){
    const st=STAGES[s];
    const density=[150,18,24,8,185][s];
    for(let j=0;j<density;j++){
      const x=st.start+hash(j*7+s*2)*(st.goal+90), z=(hash(j*13+s*37)-.5)*1000;
      if(Math.abs(z+50)<48 || (s===2&&Math.abs(z)<340) || (s===4&&Math.abs(z)<105))continue;
      const height=8+hash(j+52+s*3)*18;
      trunks.push({x,z,y:terrainHeight(x),h:height});
      leaves.push({x,z,y:terrainHeight(x),h:height});
    }
  }
  // Historic collision tree in the original deterministic physics tests.
  trunks.push({x:87,z:0,y:terrainHeight(87),h:15});
  leaves.push({x:87,z:0,y:terrainHeight(87),h:15});
  const trunk=new THREE.InstancedMesh(trunkGeo,wood,trunks.length);
  const leaf=new THREE.InstancedMesh(coneGeo,material(0x5f9e4d),leaves.length);
  trunks.forEach((b,i)=>{
    tmpObj.position.set(b.x,b.y+b.h*.20,b.z);tmpObj.scale.set(1.25,b.h*.4,1.25);tmpObj.rotation.set(0,0,0);tmpObj.updateMatrix();trunk.setMatrixAt(i,tmpObj.matrix);
    tmpObj.position.y=b.y+b.h*.69;tmpObj.scale.set(b.h*.36,b.h*.76,b.h*.36);tmpObj.updateMatrix();leaf.setMatrixAt(i,tmpObj.matrix);
    leaf.setColorAt(i,tmpColor.setHex([0x548c49,0x699850,0x4b7a48,0x79a65b][i%4]));
  });
  trunk.instanceMatrix.needsUpdate=true;leaf.instanceMatrix.needsUpdate=true;
  leaf.instanceColor.needsUpdate=true;scene.add(trunk,leaf);
}
function makeLandmarks(scene){
  // Level-one turbine is visually and physically present.
  const rotor=new THREE.Group();rotor.position.set(520,36,0);scene.add(rotor);
  const pole=box(scene,[3,36,3],[520,18,0],material(0xe0dacd));
  const center=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.6,4,8),steel);
  center.rotation.z=Math.PI/2;rotor.add(center);
  for(let i=0;i<4;i++){const bladeObj=box(rotor,[1.5,21,1],[0,10.5,0],ivory);bladeObj.rotation.x=i*Math.PI/2; }
  // Historical tower collision target; giant fan/balloon adds drama.
  box(scene,[5,24,5],[240,12,0],material(0xc0a17e));
  const bigBalloon=new THREE.Mesh(new THREE.SphereGeometry(13,16,12),red);
  bigBalloon.position.set(956,60,0);scene.add(bigBalloon);
  const stacks=[];
  for(let x=3220;x<4200;x+=190){
    const s=box(scene,[10,86,10],[x,43,305],material(0x756d6b));
    stacks.push(s);
  }
  // Finish gateways at the end of each large level.
  for(const st of STAGES){
    const x=st.start+st.goal;
    box(scene,[6,48,6],[x,24,-55],brass);
    box(scene,[6,48,6],[x,24,55],brass);
    box(scene,[6,6,120],[x,47,0],brass);
    box(scene,[2,3,118],[x,41,0],red);
  }
  return {rotor};
}
function makeClouds(scene){
  const mat=new THREE.MeshBasicMaterial({color:0xf8f6ed,transparent:true,opacity:.68,depthWrite:false});
  const cloudGeo=new THREE.SphereGeometry(1,8,6);
  const count=170, clouds=new THREE.InstancedMesh(cloudGeo,mat,count);
  for(let i=0;i<count;i++){
    const x=hash(i*7+4)*8500,z=(hash(i*11+8)-.5)*1700;
    tmpObj.position.set(x,135+hash(i*5+2)*160,z);
    tmpObj.scale.set(22+hash(i)*34,7+hash(i+19)*11,14+hash(i*9)*16);
    tmpObj.updateMatrix();clouds.setMatrixAt(i,tmpObj.matrix);
  }
  clouds.instanceMatrix.needsUpdate=true;scene.add(clouds);
}
function makeCoins(scene){
  const geo=new THREE.TorusGeometry(3.2,.95,6,11);
  const mat=material(0xffce4f,.26,.65);
  const out=COINS.map(c=>{
    const m=new THREE.Mesh(geo,mat);m.position.set(c.x,c.y,c.z);
    m.rotation.y=Math.PI/2;m.castShadow=false;scene.add(m);return m;
  });
  return out;
}

export function create3DWorld(canvas){
  const renderer=new THREE.WebGLRenderer({
    canvas,antialias:true,alpha:false,powerPreference:'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.setClearColor(0xaacde1);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.22;
  renderer.shadowMap.enabled=false; // avoids mobile fill-rate spikes
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x9fc6df);
  scene.fog=new THREE.Fog(0xabc5ce,400,2000);
  scene.add(new THREE.HemisphereLight(0xe2f4ff,0x6f865f,2.6));
  const sun=new THREE.DirectionalLight(0xffeac5,2.45);
  sun.position.set(250,480,-240);
  scene.add(sun);
  makeTerrain(scene);buildBuildings(scene);buildTrees(scene);makeClouds(scene);
  const landmarks=makeLandmarks(scene);
  const coins=makeCoins(scene);
  const camera=new THREE.PerspectiveCamera(65,1,.5,2600);
  const planeRoot=new THREE.Group();scene.add(planeRoot);
  const plane=createPlane(planeRoot);
  const sling=createSling(scene);
  const target=new THREE.Vector3();
  const cameraDestination=new THREE.Vector3();
  const lookDestination=new THREE.Vector3();
  let disposed=false,ready=false,lastTime=0,planeParts=-1,airframeId='',lastStage=-1,bonusLast=-1;
  let cameraStage=-1,lastPhase='';

  function resize(){
    if(disposed)return;
    const w=Math.max(1,canvas.clientWidth||960),h=Math.max(1,canvas.clientHeight||500);
    renderer.setSize(w,h,false);
    camera.aspect=w/h;
    camera.fov=w<h?68:58;
    camera.updateProjectionMatrix();
  }
  function render(g,time=0){
    if(disposed)return;
    const stage=stageFromIndex(g.stage||0);
    const run=g.run;
    const relX=g.phase==='ready'?-20-(g.pull||0)*35:(run?.x||0);
    const px=stage.start+relX;
    const py=g.phase==='ready'?9:(run?.y??9);
    const pz=run?.z??0;
    planeRoot.position.set(px,py,pz);
    // X is forward, Z is left/right; yaw, roll and pitch are applied in parent order.
    planeRoot.rotation.order='YZX';
    planeRoot.rotation.set(run?.roll??0,-(run?.yaw??0),run?.pitch??.25);
    const wingLevel=g.upgrades.wings||0;
    if(wingLevel!==planeParts||airframeId!==g.airframeId||lastStage!==g.stage){
      plane.setParts(wingLevel,g.upgrades,g.airframeId);
      planeParts=wingLevel;airframeId=g.airframeId;lastStage=g.stage;
    }
    const delta=lastTime?Math.min(.055,(time-lastTime)/1000):0;
    lastTime=time;
    plane.spin(delta,g.phase==='flight');
    sling.update(stage.start,g.pull||0,relX<125,{x:px,y:py,z:pz});
    landmarks.rotor.rotation.x=time*.0006;
    COINS.forEach((c,i)=>{
      const near=Math.abs(c.x-px)<1000;
      coins[i].visible=near&&!g.collected?.has(i);
      if(near) coins[i].rotation.z=time*.0018;
    });
    // Stable third-person camera: centered directly behind the aircraft.
    // No shoulder offset, no speed FOV, no launch morphing. This intentionally
    // prioritizes readable flight over cinematic movement.
    const portrait=camera.aspect<.83;
    const chase=g.phase==='flight';
    const heading=run?.yaw??0;
    const fx=Math.cos(heading),fz=Math.sin(heading);

    if(chase){
      const behind=portrait?36:32;
      const height=portrait?14:11.5;
      const lead=portrait?24:28;
      cameraDestination.set(
        px-fx*behind,
        py+height,
        pz-fz*behind
      );
      lookDestination.set(
        px+fx*lead,
        py+2.0,
        pz+fz*lead
      );
    }else{
      // Ramp view is also centered: camera sits behind the pulled aircraft,
      // looking through the slingshot toward the launch direction.
      const readyPlaneX=stage.start+relX;
      cameraDestination.set(
        readyPlaneX-28,
        15.5,
        0
      );
      lookDestination.set(
        stage.start+10,
        8.5,
        0
      );
    }

    const mustSnap=!ready || cameraStage!==g.stage ||
      (g.phase==='ready' && lastPhase!=='ready');
    if(mustSnap){
      camera.position.copy(cameraDestination);
      target.copy(lookDestination);
      ready=true;
    }else{
      const camResponse=1-Math.exp(-Math.max(.001,delta)*(chase?6.2:8.5));
      const lookResponse=1-Math.exp(-Math.max(.001,delta)*(chase?7.5:9.0));
      camera.position.lerp(cameraDestination,camResponse);
      target.lerp(lookDestination,lookResponse);
    }

    cameraStage=g.stage;
    lastPhase=g.phase;
    camera.fov=portrait?68:58;
    camera.updateProjectionMatrix();
    camera.up.set(0,1,0);
    camera.lookAt(target);
    renderer.render(scene,camera);
  }
  function dispose(){
    disposed=true;
    plane.dispose();sling.dispose();
    scene.traverse(o=>{if(o.geometry&&o.geometry!==boxGeo&&o.geometry!==coneGeo&&o.geometry!==trunkGeo)o.geometry.dispose();});
    renderer.dispose();
  }
  resize();
  return {render,resize,dispose,get stage(){return STAGES;}};
}
