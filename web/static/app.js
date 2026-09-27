
  (()=>{
const CodropsRain=(()=>{
function createCanvas(width,height){
  let canvas=document.createElement("canvas");
  canvas.width=width;
  canvas.height=height;
  return canvas;
}
function times(n,f){
  for (let i = 0; i < n; i++) {
    f.call(this,i);
  }
}
function random(from=null,to=null,interpolation=null){
  if(from==null){
    from=0;
    to=1;
  }else if(from!=null && to==null){
    to=from;
    from=0;
  }
  const delta=to-from;

  if(interpolation==null){
    interpolation=(n)=>{
      return n;
    }
  }
  return from+(interpolation(Math.random())*delta);
}
function chance(c){
  return random()<=c;
}

const WebGL=(()=>{function getContext(canvas, options={}) {
  let contexts = ["webgl", "experimental-webgl"];
  let context = null;

  contexts.some(name=>{
    try{
      context = canvas.getContext(name,options);
    }catch(e){};
    return context!=null;
  });

  if(context==null){
    document.body.classList.add("no-webgl");
  }

  return context;
}

function createProgram(gl,vertexScript,fragScript){
  let vertexShader = createShader(gl, vertexScript, gl.VERTEX_SHADER);
  let fragShader = createShader(gl, fragScript, gl.FRAGMENT_SHADER);

  let program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragShader);

  gl.linkProgram(program);

  let linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!linked) {
      var lastError = gl.getProgramInfoLog(program);
      error("Error in program linking: " + lastError);
      gl.deleteProgram(program);
      return null;
  }

  var positionLocation = gl.getAttribLocation(program, "a_position");
  // Create a buffer for the position of the rectangle corners.
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  return program;
}

function createShader(gl,script,type){
  let shader = gl.createShader(type);
  gl.shaderSource(shader,script);
  gl.compileShader(shader);

  let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (!compiled) {
    let lastError = gl.getShaderInfoLog(shader);
    error("Error compiling shader '" + shader + "':" + lastError);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
function createTexture(gl,source,i){
  var texture = gl.createTexture();
  activeTexture(gl,i);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	if ( source == null ) {
		return texture;
	} else {
		updateTexture(gl,source);
	}

  return texture;
}
function createUniform(gl,program,type,name,...args){
  let location=gl.getUniformLocation(program,"u_"+name);
  gl["uniform"+type](location,...args);
}
function activeTexture(gl,i){
  gl.activeTexture(gl["TEXTURE"+i]);
}
function updateTexture(gl,source){
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
}
function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2]), gl.STATIC_DRAW);
}

function error(msg){
  console.error(msg);
}
;return {getContext,createProgram,createShader,createTexture,createUniform,activeTexture,updateTexture,setRectangle,error};})();

function GL(canvas,options,vert,frag){
  this.init(canvas,options,vert,frag);
}
GL.prototype={
  canvas:null,
  gl:null,
  program:null,
  width:0,
  height:0,
  init(canvas,options,vert,frag){
    this.canvas=canvas;
    this.width=canvas.width;
    this.height=canvas.height;
    this.gl=WebGL.getContext(canvas,options);
    this.program=this.createProgram(vert,frag);
    this.useProgram(this.program);
  },
  createProgram(vert,frag){
    let program=WebGL.createProgram(this.gl,vert,frag);
    return program;
  },
  useProgram(program){
    this.program=program;
    this.gl.useProgram(program);
  },
  createTexture(source,i){
    return WebGL.createTexture(this.gl,source,i);
  },
  createUniform(type,name,...v){
    WebGL.createUniform(this.gl,this.program,type,name,...v);
  },
  activeTexture(i){
    WebGL.activeTexture(this.gl,i);
  },
  updateTexture(source){
    WebGL.updateTexture(this.gl,source);
  },
  draw(){
    WebGL.setRectangle(this.gl, -1, -1, 2, 2);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}



const Raindrops=(()=>{
let dropSize=64;
const Drop={
  x:0,
  y:0,
  r:0,
  spreadX:0,
  spreadY:0,
  momentum:0,
  momentumX:0,
  lastSpawn:0,
  nextSpawn:0,
  parent:null,
  isNew:true,
  killed:false,
  shrink:0,
}
const defaultOptions={
  minR:10,
  maxR:40,
  maxDrops:900,
  rainChance:0.3,
  rainLimit:3,
  dropletsRate:50,
  dropletsSize:[2,4],
  dropletsCleaningRadiusMultiplier:0.43,
  raining:true,
  globalTimeScale:1,
  trailRate:1,
  autoShrink:true,
  spawnArea:[-0.1,0.95],
  trailScaleRange:[0.2,0.5],
  collisionRadius:0.65,
  collisionRadiusIncrease:0.01,
  dropFallMultiplier:1,
  collisionBoostMultiplier:0.05,
  collisionBoost:1,
}

function Raindrops(width,height,scale,dropAlpha,dropColor,options={}){
  this.width=width;
  this.height=height;
  this.scale=scale;
  this.dropAlpha=dropAlpha;
  this.dropColor=dropColor;
  this.options=Object.assign({},defaultOptions,options);
  this.init();
}
Raindrops.prototype={
  dropColor:null,
  dropAlpha:null,
  canvas:null,
  ctx:null,
  width:0,
  height:0,
  scale:0,
  dropletsPixelDensity:1,
  droplets:null,
  dropletsCtx:null,
  dropletsCounter:0,
  drops:null,
  dropsGfx:null,
  clearDropletsGfx:null,
  textureCleaningIterations:0,
  lastRender:null,

  options:null,

  init(){
    this.canvas = createCanvas(this.width,this.height);
    this.ctx = this.canvas.getContext('2d');

    this.droplets = createCanvas(this.width*this.dropletsPixelDensity,this.height*this.dropletsPixelDensity);
    this.dropletsCtx = this.droplets.getContext('2d');

    this.drops=[];
    this.dropsGfx=[];

    this.renderDropsGfx();

    this.update();
  },
  get deltaR(){
    return this.options.maxR-this.options.minR;
  },
  get area(){
    return (this.width*this.height)/this.scale;
  },
  get areaMultiplier(){
    return Math.sqrt(this.area/(1024*768));
  },
  drawDroplet(x,y,r){
    this.drawDrop(this.dropletsCtx,Object.assign(Object.create(Drop),{
      x:x*this.dropletsPixelDensity,
      y:y*this.dropletsPixelDensity,
      r:r*this.dropletsPixelDensity
    }));
  },

  renderDropsGfx(){
    let dropBuffer=createCanvas(dropSize,dropSize);
    let dropBufferCtx=dropBuffer.getContext('2d');
    this.dropsGfx=Array.apply(null,Array(255))
      .map((cur,i)=>{
        let drop=createCanvas(dropSize,dropSize);
        let dropCtx=drop.getContext('2d');

        dropBufferCtx.clearRect(0,0,dropSize,dropSize);

        // color
        dropBufferCtx.globalCompositeOperation="source-over";
        dropBufferCtx.drawImage(this.dropColor,0,0,dropSize,dropSize);

        // blue overlay, for depth
        dropBufferCtx.globalCompositeOperation="screen";
        dropBufferCtx.fillStyle="rgba(0,0,"+i+",1)";
        dropBufferCtx.fillRect(0,0,dropSize,dropSize);

        // alpha
        dropCtx.globalCompositeOperation="source-over";
        dropCtx.drawImage(this.dropAlpha,0,0,dropSize,dropSize);

        dropCtx.globalCompositeOperation="source-in";
        dropCtx.drawImage(dropBuffer,0,0,dropSize,dropSize);
        return drop;
    });

    // create circle that will be used as a brush to remove droplets
    this.clearDropletsGfx=createCanvas(128,128);
    let clearDropletsCtx=this.clearDropletsGfx.getContext("2d");
    clearDropletsCtx.fillStyle="#000";
    clearDropletsCtx.beginPath();
    clearDropletsCtx.arc(64,64,64,0,Math.PI*2);
    clearDropletsCtx.fill();
  },
  drawDrop(ctx,drop){
    if(this.dropsGfx.length>0){
      let x=drop.x;
      let y=drop.y;
      let r=drop.r;
      let spreadX=drop.spreadX;
      let spreadY=drop.spreadY;

      let scaleX=1;
      let scaleY=1.5;

      let d=Math.max(0,Math.min(1,((r-this.options.minR)/(this.deltaR))*0.9));
      d*=1/(((drop.spreadX+drop.spreadY)*0.5)+1);

      ctx.globalAlpha=1;
      ctx.globalCompositeOperation="source-over";

      d=Math.floor(d*(this.dropsGfx.length-1));
      ctx.drawImage(
        this.dropsGfx[d],
        (x-(r*scaleX*(spreadX+1)))*this.scale,
        (y-(r*scaleY*(spreadY+1)))*this.scale,
        (r*2*scaleX*(spreadX+1))*this.scale,
        (r*2*scaleY*(spreadY+1))*this.scale
      );
    }
  },
  clearDroplets(x,y,r=30){
    let ctx=this.dropletsCtx;
    ctx.globalCompositeOperation="destination-out";
    ctx.drawImage(
      this.clearDropletsGfx,
      (x-r)*this.dropletsPixelDensity*this.scale,
      (y-r)*this.dropletsPixelDensity*this.scale,
      (r*2)*this.dropletsPixelDensity*this.scale,
      (r*2)*this.dropletsPixelDensity*this.scale*1.5
    )
  },
  clearCanvas(){
    this.ctx.clearRect(0,0,this.width,this.height);
  },
  createDrop(options){
    if(this.drops.length >= this.options.maxDrops*this.areaMultiplier) return null;

    return Object.assign(Object.create(Drop),options);
  },
  addDrop(drop){
    if(this.drops.length >= this.options.maxDrops*this.areaMultiplier || drop==null) return false;

    this.drops.push(drop);
    return true;
  },
  updateRain(timeScale){
    let rainDrops=[];
    if(this.options.raining){
      let limit=this.options.rainLimit*timeScale*this.areaMultiplier;
      let count=0;
      while(chance(this.options.rainChance*timeScale*this.areaMultiplier) && count<limit){
        count++;
        let r=random(this.options.minR,this.options.maxR,(n)=>{
          return Math.pow(n,3);
        });
        let rainDrop=this.createDrop({
          x:random(this.width/this.scale),
          y:random((this.height/this.scale)*this.options.spawnArea[0],(this.height/this.scale)*this.options.spawnArea[1]),
          r:r,
          momentum:1+((r-this.options.minR)*0.1)+random(2),
          spreadX:1.5,
          spreadY:1.5,
        });
        if(rainDrop!=null){
          rainDrops.push(rainDrop);
        }
      }
    }
    return rainDrops;
  },
  clearDrops(){
    this.drops.forEach((drop)=>{
      setTimeout(()=>{
        drop.shrink=0.1+(random(0.5));
      },random(1200))
    })
    this.clearTexture();
  },
  clearTexture(){
    this.textureCleaningIterations=50;
  },
  updateDroplets(timeScale){
    if(this.textureCleaningIterations>0){
      this.textureCleaningIterations-=1*timeScale;
      this.dropletsCtx.globalCompositeOperation="destination-out";
      this.dropletsCtx.fillStyle="rgba(0,0,0,"+(0.05*timeScale)+")";
      this.dropletsCtx.fillRect(0,0,
        this.width*this.dropletsPixelDensity,this.height*this.dropletsPixelDensity);
    }
    if(this.options.raining){
      this.dropletsCounter+=this.options.dropletsRate*timeScale*this.areaMultiplier;
      times(this.dropletsCounter,(i)=>{
        this.dropletsCounter--;
        this.drawDroplet(
          random(this.width/this.scale),
          random(this.height/this.scale),
          random(...this.options.dropletsSize,(n)=>{
            return n*n;
          })
        )
      });
    }
    this.ctx.drawImage(this.droplets,0,0,this.width,this.height);
  },
  updateDrops(timeScale){
    let newDrops=[];

    this.updateDroplets(timeScale);
    let rainDrops=this.updateRain(timeScale);
    newDrops=newDrops.concat(rainDrops);

    this.drops.sort((a,b)=>{
      let va=(a.y*(this.width/this.scale))+a.x;
      let vb=(b.y*(this.width/this.scale))+b.x;
      return va>vb?1:va==vb?0:-1;
    });

    this.drops.forEach(function(drop,i){
      if(!drop.killed){
        // update gravity
        // (chance of drops "creeping down")
        if(chance((drop.r-(this.options.minR*this.options.dropFallMultiplier)) * (0.1/this.deltaR) * timeScale)){
          drop.momentum += random((drop.r/this.options.maxR)*4);
        }
        // clean small drops
        if(this.options.autoShrink && drop.r<=this.options.minR && chance(0.05*timeScale)){
          drop.shrink+=0.01;
        }
        //update shrinkage
        drop.r -= drop.shrink*timeScale;
        if(drop.r<=0) drop.killed=true;

        // update trails
        if(this.options.raining){
          drop.lastSpawn+=drop.momentum*timeScale*this.options.trailRate;
          if(drop.lastSpawn>drop.nextSpawn){
            let trailDrop=this.createDrop({
              x:drop.x+(random(-drop.r,drop.r)*0.1),
              y:drop.y-(drop.r*0.01),
              r:drop.r*random(...this.options.trailScaleRange),
              spreadY:drop.momentum*0.1,
              parent:drop,
            });

            if(trailDrop!=null){
              newDrops.push(trailDrop);

              drop.r*=Math.pow(0.97,timeScale);
              drop.lastSpawn=0;
              drop.nextSpawn=random(this.options.minR,this.options.maxR)-(drop.momentum*2*this.options.trailRate)+(this.options.maxR-drop.r);
            }
          }
        }

        //normalize spread
        drop.spreadX*=Math.pow(0.4,timeScale);
        drop.spreadY*=Math.pow(0.7,timeScale);

        //update position
        let moved=drop.momentum>0;
        if(moved && !drop.killed){
          drop.y+=drop.momentum*this.options.globalTimeScale;
          drop.x+=drop.momentumX*this.options.globalTimeScale;
          if(drop.y>(this.height/this.scale)+drop.r){
            drop.killed=true;
          }
        }

        // collision
        let checkCollision=(moved || drop.isNew) && !drop.killed;
        drop.isNew=false;

        if(checkCollision){
          this.drops.slice(i+1,i+70).forEach((drop2)=>{
            //basic check
            if(
              drop != drop2 &&
              drop.r > drop2.r &&
              drop.parent != drop2 &&
              drop2.parent != drop &&
              !drop2.killed
            ){
              let dx=drop2.x-drop.x;
              let dy=drop2.y-drop.y;
              var d=Math.sqrt((dx*dx)+(dy*dy));
              //if it's within acceptable distance
              if(d<(drop.r+drop2.r)*(this.options.collisionRadius+(drop.momentum*this.options.collisionRadiusIncrease*timeScale))){
                let pi=Math.PI;
                let r1=drop.r;
                let r2=drop2.r;
                let a1=pi*(r1*r1);
                let a2=pi*(r2*r2);
                let targetR=Math.sqrt((a1+(a2*0.8))/pi);
                if(targetR>this.maxR){
                  targetR=this.maxR;
                }
                drop.r=targetR;
                drop.momentumX+=dx*0.1;
                drop.spreadX=0;
                drop.spreadY=0;
                drop2.killed=true;
                drop.momentum=Math.max(drop2.momentum,Math.min(40,drop.momentum+(targetR*this.options.collisionBoostMultiplier)+this.options.collisionBoost));
              }
            }
          });
        }

        //slowdown momentum
        drop.momentum-=Math.max(1,(this.options.minR*0.5)-drop.momentum)*0.1*timeScale;
        if(drop.momentum<0) drop.momentum=0;
        drop.momentumX*=Math.pow(0.7,timeScale);


        if(!drop.killed){
          newDrops.push(drop);
          if(moved && this.options.dropletsRate>0) this.clearDroplets(drop.x,drop.y,drop.r*this.options.dropletsCleaningRadiusMultiplier);
          this.drawDrop(this.ctx, drop);
        }

      }
    },this);

    this.drops = newDrops;
  },
  update(){
    this.clearCanvas();

    let now=Date.now();
    if(this.lastRender==null) this.lastRender=now;
    let deltaT=now-this.lastRender;
    let timeScale=deltaT/((1/60)*1000);
    if(timeScale>1.1) timeScale=1.1;
    timeScale*=this.options.globalTimeScale;
    this.lastRender=now;

    this.updateDrops(timeScale);

    
  }
}


;return Raindrops;})();
const RainRenderer=(()=>{
let vertShader="precision mediump float;\n\nattribute vec2 a_position;\n\nvoid main() {\n   gl_Position = vec4(a_position,0.0,1.0);\n}\n";
let fragShader="precision mediump float;\n\n// textures\nuniform sampler2D u_waterMap;\nuniform sampler2D u_textureShine;\nuniform sampler2D u_textureFg;\nuniform sampler2D u_textureBg;\n\n// the texCoords passed in from the vertex shader.\nvarying vec2 v_texCoord;\nuniform vec2 u_resolution;\nuniform vec2 u_parallax;\nuniform float u_parallaxFg;\nuniform float u_parallaxBg;\nuniform float u_textureRatio;\nuniform bool u_renderShine;\nuniform bool u_renderShadow;\nuniform float u_minRefraction;\nuniform float u_refractionDelta;\nuniform float u_brightness;\nuniform float u_alphaMultiply;\nuniform float u_alphaSubtract;\n\n// alpha-blends two colors\nvec4 blend(vec4 bg,vec4 fg){\n  vec3 bgm=bg.rgb*bg.a;\n  vec3 fgm=fg.rgb*fg.a;\n  float ia=1.0-fg.a;\n  float a=(fg.a + bg.a * ia);\n  vec3 rgb;\n  if(a!=0.0){\n    rgb=(fgm + bgm * ia) / a;\n  }else{\n    rgb=vec3(0.0,0.0,0.0);\n  }\n  return vec4(rgb,a);\n}\n\nvec2 pixel(){\n  return vec2(1.0,1.0)/u_resolution;\n}\n\nvec2 parallax(float v){\n  return u_parallax*pixel()*v;\n}\n\nvec2 texCoord(){\n  return vec2(gl_FragCoord.x, u_resolution.y-gl_FragCoord.y)/u_resolution;\n}\n\n// scales the bg up and proportionally to fill the container\nvec2 scaledTexCoord(){\n  float ratio=u_resolution.x/u_resolution.y;\n  vec2 scale=vec2(1.0,1.0);\n  vec2 offset=vec2(0.0,0.0);\n  float ratioDelta=ratio-u_textureRatio;\n  if(ratioDelta>=0.0){\n    scale.y=(1.0+ratioDelta);\n    offset.y=ratioDelta/2.0;\n  }else{\n    scale.x=(1.0-ratioDelta);\n    offset.x=-ratioDelta/2.0;\n  }\n  return (texCoord()+offset)/scale;\n}\n\n// get color from fg\nvec4 fgColor(float x, float y){\n  float p2=u_parallaxFg*2.0;\n  vec2 scale=vec2(\n    (u_resolution.x+p2)/u_resolution.x,\n    (u_resolution.y+p2)/u_resolution.y\n  );\n\n  vec2 scaledTexCoord=texCoord()/scale;\n  vec2 offset=vec2(\n    (1.0-(1.0/scale.x))/2.0,\n    (1.0-(1.0/scale.y))/2.0\n  );\n\n  return texture2D(u_waterMap,\n    (scaledTexCoord+offset)+(pixel()*vec2(x,y))+parallax(u_parallaxFg)\n  );\n}\n\nvoid main() {\n  vec4 bg=texture2D(u_textureBg,scaledTexCoord()+parallax(u_parallaxBg));\n\n  vec4 cur = fgColor(0.0,0.0);\n\n  float d=cur.b; // \"thickness\"\n  float x=cur.g;\n  float y=cur.r;\n\n  float a=clamp(cur.a*u_alphaMultiply-u_alphaSubtract, 0.0,1.0);\n\n  vec2 refraction = (vec2(x,y)-0.5)*2.0;\n  vec2 refractionParallax=parallax(u_parallaxBg-u_parallaxFg);\n  vec2 refractionPos = scaledTexCoord()\n    + (pixel()*refraction*(u_minRefraction+(d*u_refractionDelta)))\n    + refractionParallax;\n\n  vec4 tex=texture2D(u_textureFg,refractionPos);\n\n  if(u_renderShine){\n    float maxShine=490.0;\n    float minShine=maxShine*0.18;\n    vec2 shinePos=vec2(0.5,0.5) + ((1.0/512.0)*refraction)* -(minShine+((maxShine-minShine)*d));\n    vec4 shine=texture2D(u_textureShine,shinePos);\n    tex=blend(tex,shine);\n  }\n\n  vec4 fg=vec4(tex.rgb*u_brightness,a);\n\n  if(u_renderShadow){\n    float borderAlpha = fgColor(0.,0.-(d*6.0)).a;\n    borderAlpha=borderAlpha*u_alphaMultiply-(u_alphaSubtract+0.5);\n    borderAlpha=clamp(borderAlpha,0.,1.);\n    borderAlpha*=0.2;\n    vec4 border=vec4(0.,0.,0.,borderAlpha);\n    fg=blend(border,fg);\n  }\n\n  gl_FragColor = blend(bg,fg);\n}\n";

const defaultOptions={
  renderShadow:false,
  minRefraction:256,
  maxRefraction:512,
  brightness:1,
  alphaMultiply:20,
  alphaSubtract:5,
  parallaxBg:5,
  parallaxFg:20
}
function RainRenderer(canvas,canvasLiquid, imageFg, imageBg, imageShine=null,options={}){

  this.canvas=canvas;
  this.canvasLiquid=canvasLiquid;
  this.imageShine=imageShine;
  this.imageFg=imageFg;
  this.imageBg=imageBg;
  this.options=Object.assign({},defaultOptions, options);
  this.init();
}

RainRenderer.prototype={
  canvas:null,
  gl:null,
  canvasLiquid:null,
  width:0,
  height:0,
  imageShine:"",
  imageFg:"",
  imageBg:"",
  textures:null,
  programWater:null,
  programBlurX:null,
  programBlurY:null,
  parallaxX:0,
  parallaxY:0,
  renderShadow:false,
  options:null,
  init(){
    this.width=this.canvas.width;
    this.height=this.canvas.height;
    this.gl=new GL(this.canvas, {alpha:false},vertShader,fragShader);
    let gl=this.gl;
    this.programWater=gl.program;

    gl.createUniform("2f","resolution",this.width,this.height);
    gl.createUniform("1f","textureRatio",this.imageBg.width/this.imageBg.height);
    gl.createUniform("1i","renderShine",this.imageShine==null?false:true);
    gl.createUniform("1i","renderShadow",this.options.renderShadow);
    gl.createUniform("1f","minRefraction",this.options.minRefraction);
    gl.createUniform("1f","refractionDelta",this.options.maxRefraction-this.options.minRefraction);
    gl.createUniform("1f","brightness",this.options.brightness);
    gl.createUniform("1f","alphaMultiply",this.options.alphaMultiply);
    gl.createUniform("1f","alphaSubtract",this.options.alphaSubtract);
    gl.createUniform("1f","parallaxBg",this.options.parallaxBg);
    gl.createUniform("1f","parallaxFg",this.options.parallaxFg);


    gl.createTexture(null,0);

    this.textures=[
      {name:'textureShine', img:this.imageShine==null?createCanvas(2,2):this.imageShine},
      {name:'textureFg', img:this.imageFg},
      {name:'textureBg', img:this.imageBg}
    ];

    this.textures.forEach((texture,i)=>{
      gl.createTexture(texture.img,i+1);
      gl.createUniform("1i",texture.name,i+1);
    });

    this.draw();
  },
  draw(){
    this.gl.useProgram(this.programWater);
    this.gl.createUniform("2f", "parallax", this.parallaxX,this.parallaxY);
    this.updateTexture();
    this.gl.draw();

    
  },
  updateTextures(){
    this.textures.forEach((texture,i)=>{
      this.gl.activeTexture(i+1);
      this.gl.updateTexture(texture.img);
    })
  },
  updateTexture(){
    this.gl.activeTexture(0);
    this.gl.updateTexture(this.canvasLiquid);
  },
  resize(){

  },
  get overlayTexture(){

  },
  set overlayTexture(v){

  }
}


;return RainRenderer;})();return {Raindrops,RainRenderer};})();
const mediaRoot=window.condenseLookup?'web/static/media/':'/static/media/';
const HOPPER_ART=mediaRoot+'hopper-street.jpg';
const CODROPS_ALPHA=mediaRoot+'drop-alpha.png';
const CODROPS_COLOR=mediaRoot+'drop-color.png';

    const root=document.getElementById('fog-writing'),canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),input=root.querySelector('input'),form=root.querySelector('form'),reset=root.querySelector('.fw-reset'),message=root.querySelector('.fw-message'),pathHost=root.querySelector('.fw-paths');
    const opts={width:9,fog:.24,speed:1,blur:21};
    let weather='mist',idleSince=0,lastDrop=0,drops=[],gardens=[],related=[];
    root.querySelectorAll('[data-weather]').forEach(button=>button.addEventListener('click',()=>{weather=button.dataset.weather;root.querySelectorAll('[data-weather]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    input.addEventListener('input',()=>{if(input.value)input.removeAttribute('placeholder');});
    function rejectInput(){form.classList.remove('fw-limit');void form.offsetWidth;form.classList.add('fw-limit');message.textContent='Maximum 20 letters.';}
    form.addEventListener('animationend',()=>form.classList.remove('fw-limit'));
    input.addEventListener('beforeinput',e=>{if(e.inputType.startsWith('insert')&&e.data){const addition=e.data.replace(/[^a-z]/gi,'').length;const selected=(input.selectionEnd||0)-(input.selectionStart||0);if(input.value.length-selected+addition>20){e.preventDefault();rejectInput();}}});
    input.addEventListener('paste',e=>{const text=e.clipboardData.getData('text').replace(/[^a-z]/gi,'');const selected=(input.selectionEnd||0)-(input.selectionStart||0);if(input.value.length-selected+text.length>20){e.preventDefault();rejectInput();}});
    // Single-line glyphs: each entry preserves pen lifts and drawing order.
    const glyphs={
    a:[36,['M31 29 C21 18 6 28 7 43 C8 60 26 58 31 38','M32 25 L30 54 Q32 59 37 54']],
    b:[36,['M9 55 Q6 23 12 5','M9 36 C30 12 42 33 30 49 Q17 65 9 50']],
    c:[34,['M31 28 C19 16 4 30 7 45 Q13 64 32 50']],
    d:[37,['M30 28 C14 17 3 32 9 49 Q22 64 31 42','M34 5 Q28 29 31 55']],
    e:[34,['M8 38 Q35 40 29 27 C22 13 2 35 9 49 Q18 63 34 49']],
    f:[28,['M12 70 Q6 43 14 15 C19 -1 32 7 24 14','M3 31 Q16 27 29 29']],
    g:[37,['M30 29 C14 18 3 34 10 49 Q21 62 31 39','M33 27 L29 65 C26 84 5 77 11 66']],
    h:[38,['M8 55 Q8 24 13 5','M9 39 C29 15 33 25 31 41 L31 55']],
    i:[18,['M9 27 Q6 45 10 55','M11 12 L11.5 13']],
    j:[22,['M15 28 L12 65 Q9 81 -1 71','M17 12 L17.5 13']],
    k:[35,['M9 55 L12 6','M32 25 L11 43','M19 36 Q23 47 35 55']],
    l:[20,['M11 6 Q4 38 10 54 Q13 59 18 53']],
    m:[55,['M7 28 L8 55','M8 38 Q23 15 25 34 L25 54','M25 37 Q43 14 47 34 L47 55']],
    n:[37,['M7 27 L8 55','M8 39 C25 16 32 23 30 39 L31 55']],
    o:[36,['M22 25 C5 21 2 46 13 54 C30 65 41 26 22 25']],
    p:[37,['M8 28 L7 77','M9 35 C31 13 42 35 29 49 Q18 59 9 51']],
    q:[37,['M30 29 C16 17 3 32 9 48 Q20 63 31 41','M32 26 L30 75 L38 68']],
    r:[29,['M8 29 L8 56','M8 40 Q18 19 29 27']],
    s:[32,['M30 28 C15 16 1 33 17 39 C40 46 22 65 6 52']],
    t:[28,['M17 12 L12 45 Q10 63 27 51','M3 30 L28 27']],
    u:[37,['M9 27 C4 55 12 68 29 42','M31 27 L30 54 Q33 58 37 53']],
    v:[34,['M6 27 Q10 44 17 56 Q28 40 31 25']],
    w:[51,['M5 27 Q6 42 12 56 L26 31 Q26 45 33 55 Q46 40 47 26']],
    x:[34,['M7 27 Q18 42 30 55','M30 26 Q18 44 5 55']],
    y:[36,['M8 27 C3 54 13 62 29 38','M31 26 Q29 60 19 74 Q9 86 5 70']],
    z:[33,['M5 29 Q19 25 30 28 L7 55 Q21 52 33 55']]
    };
    Object.assign(glyphs,{
      '0':[32,['M20 13 C3 9 3 54 16 56 C32 59 37 13 20 13']],
      '1':[23,['M5 25 L16 13 L13 55','M4 56 L24 55']],
      '2':[32,['M5 25 C8 5 37 11 27 29 Q21 39 5 55 L31 54']],
      '3':[32,['M6 17 Q34 5 27 27 L17 33 C38 30 34 62 5 53']],
      '4':[33,['M24 13 L5 42 L34 40','M26 16 L23 57']],
      '5':[32,['M31 14 L10 14 L7 34 C32 23 39 57 14 57 Q7 57 4 51']],
      '6':[32,['M28 14 C5 9 -1 58 18 57 C37 56 32 29 15 34 L7 41']],
      '7':[31,['M3 16 L31 13 Q18 32 12 57']],
      '8':[32,['M19 12 C-1 10 5 32 20 34 C40 43 26 65 9 53 C-3 43 17 32 26 25 C34 15 25 11 19 12']],
      '9':[32,['M27 34 C4 47 0 14 18 13 C37 11 29 46 12 59']],
      '.':[10,['M5 55 L5.5 56']],
      '-':[22,['M3 36 L20 35']]
    });

    const letters={};
    for(const [key,[width,paths]] of Object.entries(glyphs)){
      letters[key]={width,strokes:paths.map(d=>{const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);pathHost.append(p);const len=p.getTotalLength(),pts=[];for(let i=0;i<=Math.ceil(len);i++){const q=p.getPointAtLength(Math.min(len,i));pts.push([q.x,q.y]);}return {pts,len};})};
    }
    const make=()=>{const c=document.createElement('canvas');c.width=1200;c.height=760;return c;};
    const scene=make(),base=make(),fog=make(),mask=make(),condensation=make(),waterSource=make();
    const wx=waterSource.getContext('2d');
    const cx=condensation.getContext('2d');
    function condensationTexture(){
      condensation.width=Math.max(1,Math.round(W*dpr));condensation.height=Math.max(1,Math.round(H*dpr));cx.setTransform(dpr,0,0,dpr,0,0);
      let seed=314159;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
      // Fine surface moisture, not additional falling drops.
      for(let i=0;i<Math.round(W*H/760);i++){const x=random()*W,y=random()*H,r=.35+random()*.7,a=.07+random()*.12;cx.fillStyle=`rgba(223,245,250,${a})`;cx.beginPath();cx.arc(x,y,r,0,Math.PI*2);cx.fill();cx.strokeStyle=`rgba(17,48,72,${a*.8})`;cx.lineWidth=.55;cx.beginPath();cx.arc(x,y+.5,r,0,Math.PI);cx.stroke();}
      for(let i=0;i<11;i++){const x=random()*W,y=random()*H,len=35+random()*110;const grad=cx.createLinearGradient(x,y,x,y+len);grad.addColorStop(0,'#ddf5f200');grad.addColorStop(.5,'#ddf5f20c');grad.addColorStop(1,'#ddf5f200');cx.strokeStyle=grad;cx.lineWidth=2+random()*4;cx.beginPath();cx.moveTo(x,y);cx.bezierCurveTo(x-3,y+len*.3,x+3,y+len*.6,x-1,y+len);cx.stroke();}
    }
    function waterFilm(t){
      if(waterSource.width!==fog.width)waterSource.width=fog.width;if(waterSource.height!==fog.height)waterSource.height=fog.height;
      wx.setTransform(1,0,0,1,0,0);wx.clearRect(0,0,waterSource.width,waterSource.height);wx.drawImage(fog,0,0);
      // Clear/blurred image sampling follows the reference's refraction principle.
      // Thin warped channels keep the stylised glass without large teardrops.
      for(let i=0;i<13;i++){const x=((i*.6180339)%1)*W,y=((i*.371)%1)*H-90,length=120+(i%4)*65,width=3+i%3;fx.save();fx.beginPath();fx.moveTo(x,y);fx.bezierCurveTo(x-4,y+length*.3,x+5,y+length*.7,x-2,y+length);fx.lineTo(x+width,y+length);fx.bezierCurveTo(x+width+6,y+length*.7,x+width-2,y+length*.3,x+width,y);fx.closePath();fx.clip();fx.globalAlpha=.24;fx.drawImage(waterSource,-3,2,W+6,H);fx.globalAlpha=1;fx.restore();}
      fx.drawImage(condensation,0,0,W,H);
    }
    const sx=scene.getContext('2d'),bx=base.getContext('2d'),fx=fog.getContext('2d'),mx=mask.getContext('2d');
    let W=900,H=620,dpr=1,records=[],finished=false,lastText='',clock=0,lastFrame=0,resetAt=0;
    let freehandStrokes=[],activeFreehand=null;
    let narrow=false;
    function shape(paths){return paths.map(d=>{const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);pathHost.append(p);const len=p.getTotalLength();return Array.from({length:Math.ceil(len)+1},(_,i)=>{const q=p.getPointAtLength(Math.min(i,len));return [q.x,q.y];});});}
    const flower=shape(['M48 94 Q55 73 49 48','M51 80 Q20 82 23 62 Q40 60 51 80','M52 69 Q77 68 78 48 Q58 48 52 69','M48 39 C24 51 20 30 34 26 C11 10 37 0 43 17 C49 -9 71 4 60 21 C85 13 88 37 66 36 C78 60 51 66 48 39','M48 27 C39 27 40 42 49 41 C61 38 58 24 48 27']);
    const leaf=shape(['M22 97 Q35 51 72 7','M36 67 C4 68 6 34 17 26 Q47 38 36 67','M44 53 Q83 56 88 22 Q60 15 44 53','M55 35 Q28 30 37 4 Q58 10 55 35']);
    const sun=shape(['M48 22 C12 19 9 73 42 78 C78 91 92 27 57 22 Q52 21 48 22','M36 42 L37 43','M62 40 L63 41','M33 55 Q48 76 68 53',...Array.from({length:11},(_,i)=>{const a=i*Math.PI*2/11;return `M${50+Math.cos(a)*43} ${50+Math.sin(a)*43} L${50+Math.cos(a)*54} ${50+Math.sin(a)*54}`;})]);
    let nextGarden=0;
    let gardenKinds=[];
    const gardenRandom=(a,b)=>a+Math.random()*(b-a);
    function growCluster(t){
      const strokes=[];let latest=0;
      const groupScale=gardenRandom(.55,1.55)*(narrow?.76:1),heavy=gardenRandom(.85,1.8);
      const curve=(a,b,c)=>Array.from({length:51},(_,i)=>{const u=i/50,v=1-u;return [v*v*a[0]+2*v*u*b[0]+u*u*c[0],v*v*a[1]+2*v*u*b[1]+u*u*c[1]];});
      function stroke(points,start,width){
        const dx=gardenRandom(-2.7,2.7),dy=gardenRandom(-2.7,2.7),angle=gardenRandom(-.035,.035),cos=Math.cos(angle),sin=Math.sin(angle);
        const pts=points.map(([x,y])=>[x*cos-y*sin+dx,y*cos+x*sin+dy]);
        const duration=gardenRandom(480,1250);latest=Math.max(latest,start+duration);
        strokes.push({pts,start,duration,width:width*heavy,phase:Math.random()*6.28,strength:gardenRandom(.25,.5),lastCount:0,outline:null});
      }
      function bloom(x,y,r,start){
        const petals=4+Math.floor(Math.random()*4),rotation=Math.random()*6.28,squash=gardenRandom(.65,1.25);
        const irregular=Array.from({length:petals},()=>gardenRandom(.8,1.3));
        const outline=Array.from({length:111},(_,i)=>{const a=i/110*Math.PI*2,p=(a/(Math.PI*2)*petals)%petals,blend=(1-Math.cos((p%1)*Math.PI))*.5,amplitude=irregular[Math.floor(p)]*(1-blend)+irregular[(Math.floor(p)+1)%petals]*blend,rr=r*(.76+.24*Math.cos(a*petals))*amplitude;return [x+Math.cos(a+rotation)*rr,y+Math.sin(a+rotation)*rr*squash];});
        stroke(outline,start,gardenRandom(1.1,3.1));
        stroke(Array.from({length:31},(_,i)=>{const a=i/30*6.28;return [x+r*.15*Math.cos(a),y+r*.15*Math.sin(a)];}),start+950,gardenRandom(1,2.5));
      }
      function leafAt(x,y,angle,len,start){
        const end=[x+Math.cos(angle)*len,y+Math.sin(angle)*len],normal=[-Math.sin(angle)*len*.45,Math.cos(angle)*len*.45];
        const mid=[(x+end[0])/2,(y+end[1])/2];
        const pts=curve([x,y],[mid[0]+normal[0],mid[1]+normal[1]],end).concat(curve(end,[mid[0]-normal[0]*.7,mid[1]-normal[1]*.7],[x,y]));
        stroke(pts,start,gardenRandom(.8,2.2));
      }
      if(!gardenKinds.length){gardenKinds=['flowers','branch','smile','sun','moon','star','cloud','apple','heartArrow'];for(let i=gardenKinds.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[gardenKinds[i],gardenKinds[j]]=[gardenKinds[j],gardenKinds[i]];}}
      const kind=gardenKinds.pop(),isBranch=kind==='branch',isFace=kind==='smile'||kind==='sun';
      function face(x,y,r,start,rays){
        const squash=gardenRandom(.85,1.15),phase=Math.random()*6.28;
        stroke(Array.from({length:101},(_,i)=>{const a=i/100*Math.PI*2,rr=r*(1+.035*Math.sin(a*3+phase));return [x+Math.cos(a)*rr,y+Math.sin(a)*rr*squash];}),start,gardenRandom(1.6,3.4));
        stroke(curve([x-r*.31,y-r*.20],[x-r*.29,y-r*.16],[x-r*.30,y-r*.12]),start+1100,gardenRandom(2.5,4));
        stroke(curve([x+r*.27,y-r*.23],[x+r*.29,y-r*.17],[x+r*.28,y-r*.14]),start+1450,gardenRandom(2.5,4));
        stroke(curve([x-r*.42,y+r*.18],[x+r*.02,y+r*.81],[x+r*.43,y+r*.10]),start+1800,gardenRandom(2,3.8));
        if(rays){const count=9+Math.floor(Math.random()*5);for(let i=0;i<count;i++){const a=i/count*Math.PI*2+gardenRandom(-.08,.08),inner=r*gardenRandom(1.20,1.32),outer=inner+r*gardenRandom(.20,.48);stroke(curve([x+Math.cos(a)*inner,y+Math.sin(a)*inner*squash],[x+Math.cos(a+.025)*(inner+outer)/2,y+Math.sin(a+.025)*(inner+outer)/2*squash],[x+Math.cos(a)*outer,y+Math.sin(a)*outer*squash]),start+2550+i*170,gardenRandom(1.5,3.1));}}
      }
      function branch(x,y,angle,len,depth,start){
        const end=[x+Math.cos(angle)*len,y+Math.sin(angle)*len];
        const bend=gardenRandom(-.24,.24)*len;
        stroke(curve([x,y],[(x+end[0])/2-Math.sin(angle)*bend,(y+end[1])/2+Math.cos(angle)*bend],end),start,1+depth*.65);
        const arrive=start+gardenRandom(650,1100);
        leafAt(x+(end[0]-x)*.62,y+(end[1]-y)*.62,angle+(Math.random()<.5?-1:1)*gardenRandom(.55,1.4),gardenRandom(15,38),arrive);
        if(depth>0){branch(...end,angle+gardenRandom(-.7,-.25),len*gardenRandom(.56,.79),depth-1,arrive);branch(...end,angle+gardenRandom(.25,.85),len*gardenRandom(.5,.76),depth-1,arrive+gardenRandom(180,700));}
        if(!isBranch||depth===0&&Math.random()<.7)bloom(...end,gardenRandom(9,26),arrive+gardenRandom(200,1000));
      }
      function symbol(){
        const join=(...segments)=>segments.flatMap(([a,b,c])=>curve(a,b,c));
        const width=gardenRandom(1.7,3.2);
        if(kind==='moon')stroke(join([[18,-47],[-64,-37],[-39,22]],[[-39,22],[-12,65],[37,31]],[[37,31],[-15,40],[-18,-3]],[[-18,-3],[-18,-33],[18,-47]]),0,width);
        if(kind==='star'){
          const vertices=Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?20:46;return [Math.cos(a)*r,Math.sin(a)*r];});
          stroke(vertices.flatMap((a,i)=>{const b=vertices[(i+1)%10];return curve(a,[(a[0]+b[0])/2,(a[1]+b[1])/2],b);}),0,width);
        }
        if(kind==='cloud')stroke(join([[-47,25],[-72,-2],[-40,-12]],[[-40,-12],[-35,-49],[-6,-31]],[[-6,-31],[19,-63],[37,-22]],[[37,-22],[70,-22],[64,9]],[[64,9],[76,35],[38,30]],[[38,30],[0,37],[-47,25]]),0,width);
        if(kind==='apple'){
          stroke(join([[0,-26],[-45,-51],[-47,-8]],[[-47,-8],[-42,58],[-9,39]],[[-9,39],[2,34],[15,42]],[[15,42],[39,53],[49,0]],[[49,0],[55,-43],[20,-36]],[[20,-36],[7,-29],[0,-26]]),0,width);
          stroke(curve([0,-27],[1,-51],[15,-61]),1250,width*.8);
          stroke(join([[6,-44],[21,-70],[41,-56]],[[41,-56],[27,-34],[6,-44]]),2100,width*.65);
        }
        if(kind==='heartArrow'){
          stroke(join([[0,-17],[-33,-57],[-48,-22]],[[-48,-22],[-63,6],[0,49]],[[0,49],[65,5],[45,-26]],[[45,-26],[29,-54],[0,-17]]),0,width);
          // Split the shaft so the arrow reads as passing through the heart.
          stroke(curve([-70,33],[-51,24],[-31,16]),1300,width*.7);
          stroke(curve([27,-12],[49,-22],[75,-34]),1950,width*.7);
          stroke(join([[56,-36],[66,-35],[75,-34]],[[75,-34],[69,-23],[64,-15]]),2550,width*.8);
          stroke(join([[-70,33],[-71,21],[-69,14]],[[-69,14],[-61,16],[-53,23]]),2950,width*.65);
          stroke(join([[-70,33],[-64,40],[-54,45]],[[-54,45],[-51,34],[-53,23]]),3400,width*.65);
        }
        if(['cloud','star','heartArrow'].includes(kind)){
          const eyeGap=kind==='star'?9:12,eyeY=kind==='cloud'?1:-2;
          stroke(curve([-eyeGap,eyeY],[-eyeGap-.4,eyeY+2],[-eyeGap,eyeY+3]),1300,width*1.05);
          stroke(curve([eyeGap,eyeY-1],[eyeGap+.5,eyeY+1],[eyeGap,eyeY+2]),1720,width*1.05);
          stroke(curve([-eyeGap-2,eyeY+10],[0,eyeY+26],[eyeGap+2,eyeY+9]),2140,width*.85);
        }
      }
      if(isFace){face(0,0,gardenRandom(30,57),0,kind==='sun');}
      else if(isBranch)branch(0,65,-Math.PI/2,gardenRandom(65,100),2,0);
      else if(kind!=='flowers')symbol();
      else{
        const count=4+Math.floor(Math.random()*7);
        for(let i=0;i<count;i++){
          const x=gardenRandom(-100,100),y=gardenRandom(-85,55),start=i*gardenRandom(200,480);
          stroke(curve([gardenRandom(-22,22),80],[x*.4,gardenRandom(20,65)],[x,y]),start,gardenRandom(.9,2.5));
          bloom(x,y,gardenRandom(12,35),start+700);
          if(Math.random()<.65)leafAt(x*.6,45,gardenRandom(-2.8,-.3),gardenRandom(20,38),start+1000);
        }
      }
      return {kind,x:Math.random(),y:.08+Math.random()*.81,scale:groupScale,angle:kind==='flowers'?gardenRandom(-Math.PI,Math.PI):isBranch?gardenRandom(-1.15,1.15):gardenRandom(-.65,.65),strokes,born:t,life:latest+2300,drawTime:latest,opacity:gardenRandom(.32,.63)};
    }
    function garden(t){
      if(reduce)return;
      const idleDoodles=!lastText&&!finished&&!pending;
      const resultDoodles=finished&&!pending&&resultStart&&t>=resultStart;
      const gardenLimit=resultDoodles?8:12;
      if((idleDoodles||resultDoodles)&&t>=nextGarden&&gardens.length<gardenLimit){
        gardens.push(growCluster(t));
        nextGarden=t+(resultDoodles?gardenRandom(1050,1900):gardenRandom(650,1350));
      }
      gardens=gardens.filter(g=>t-g.born<g.life);
      for(const g of gardens){
        const age=t-g.born,alpha=g.opacity*(1-smoothUnit((age-g.drawTime-450)/1850));
        mx.save();mx.translate(W*g.x,H*g.y);mx.rotate(g.angle);mx.scale(g.scale,g.scale);mx.fillStyle=`rgba(255,255,255,${alpha})`;
        for(const s of g.strokes){
          const p=Math.max(0,Math.min(1,(age-s.start)/s.duration));if(!p)continue;
          const count=Math.max(2,Math.ceil(p*s.pts.length));
          if(count!==s.lastCount){s.outline=pressureOutline(s.pts.slice(0,count),s.width,s.phase,s.strength);s.lastCount=count;}
          mx.fill(s.outline);
        }
        mx.restore();
      }
    }

    function rect(x,y,w,h,color){sx.fillStyle=color;sx.fillRect(x,y,w,h);}
    function poly(points,color){sx.fillStyle=color;sx.beginPath();points.forEach((p,i)=>i?sx.lineTo(...p):sx.moveTo(...p));sx.closePath();sx.fill();}
    function line(points,color,width=2){sx.strokeStyle=color;sx.lineWidth=width;sx.lineCap='round';sx.lineJoin='round';sx.beginPath();points.forEach((p,i)=>i?sx.lineTo(...p):sx.moveTo(...p));sx.stroke();}
    function circle(x,y,r,color){sx.fillStyle=color;sx.beginPath();sx.arc(x,y,r,0,Math.PI*2);sx.fill();}
    function windowPane(x,y,w,h,lit){rect(x-4,y-4,w+8,h+8,'#a18175');rect(x,y,w,h,lit?'#eebc7d':'#263e50');if(lit){poly([[x,y],[x+w*.43,y],[x+w*.7,y+h],[x,y+h]],'#d28d66');rect(x+w*.67,y,3,h,'#f4ce92');}rect(x+w*.48,y,3,h,'#4a5555');rect(x,y+h*.48,w,3,'#4a5555');rect(x-7,y+h+4,w+14,5,'#b69a81');}
    function balcony(x,y,w){line([[x,y],[x,y+17],[x+w,y+17],[x+w,y]],'#253c47',2);line([[x,y+3],[x+w,y+3]],'#263d47',2);for(let i=7;i<w;i+=10)line([[x+i,y+3],[x+i,y+17]],'#263d47',1.5);}
    function car(x,y,color,reverse=false){sx.save();sx.translate(x,y);if(reverse)sx.scale(-1,1);
      poly([[-27,21],[95,21],[146,40],[11,43]],'#0a253b55');
      sx.fillStyle=color;sx.beginPath();sx.roundRect(-58,-20,136,32,9);sx.fill();poly([[-40,-20],[-20,-46],[26,-46],[51,-20]],color);poly([[-29,-23],[-15,-41],[6,-41],[6,-23]],'#a4b2aa');poly([[12,-41],[24,-41],[43,-23],[12,-23]],'#536c75');line([[-52,-13],[65,-13]],'#e4b8a55c',2);
      circle(-30,12,13,'#152b3a');circle(48,12,13,'#152b3a');circle(-30,12,5,'#7e8d91');circle(48,12,5,'#7e8d91');rect(70,-12,8,6,'#ffe1a0');rect(-60,-10,5,7,'#e56553');
      poly([[78,-8],[207,21],[85,21]],'#efc48512');line([[80,31],[142,32]],'#ebc08750',3);sx.restore();}
    function cyclist(x,t){sx.save();sx.translate(x,516);const spin=t/380;sx.strokeStyle='#213844';sx.lineWidth=3;for(const cx of [-25,38]){sx.beginPath();sx.arc(cx,0,21,0,Math.PI*2);sx.stroke();line([[cx-19*Math.cos(spin),-19*Math.sin(spin)],[cx+19*Math.cos(spin),19*Math.sin(spin)]],'#91aaa180',1);}
      line([[-25,0],[-5,-30],[11,0],[-25,0]],'#bf9969',3);line([[-5,-30],[28,-30],[11,0]],'#bf9969',3);line([[38,0],[26,-43],[35,-45]],'#c6b38f',3);line([[-13,-33],[0,-33]],'#182d3d',4);
      const foot=[9+Math.cos(spin)*10,Math.sin(spin)*10];line([[-3,-54],[-16,-27],foot],'#232f49',7);line([[0,-55],[15,-27],[18-Math.cos(spin)*10,-Math.sin(spin)*10]],'#314255',6);line([[-3,-54],[4,-79],[24,-58],[29,-42]],'#c57356',9);circle(8,-92,9,'#d9b28a');poly([[-2,-99],[15,-103],[20,-97],[-2,-95]],'#23434a');line([[1,-77],[-20,-76]],'#d39c65',5);circle(38,-34,2,'#ffdea0');sx.restore();}
    const motionVideo=root.querySelector('video');
    const heldVideoFrame=document.createElement('canvas'),heldVideoContext=heldVideoFrame.getContext('2d');
    let heldVideoReady=false;
    if(motionVideo&&motionVideo.getAttribute('src')&&!reduce){motionVideo.loop=false;motionVideo.play().catch(()=>{});root.addEventListener('pointerdown',()=>{if(motionVideo.paused)motionVideo.play().catch(()=>{});});}
    document.addEventListener('visibilitychange',()=>{if(!motionVideo||reduce)return;if(document.hidden)motionVideo.pause();else if(motionVideo.getAttribute('src'))motionVideo.play().catch(()=>{});});
    function street(t){
      sx.fillStyle='#182332';sx.fillRect(0,0,1200,760);
      if(motionVideo&&!reduce&&Number.isFinite(motionVideo.duration)&&motionVideo.duration>0&&motionVideo.currentTime>=motionVideo.duration-.11&&!motionVideo.seeking){
        // Seek just before the native loop boundary and hold the previous decoded
        // frame while seeking. The video itself has a circular dissolve here.
        motionVideo.currentTime=.035;motionVideo.play().catch(()=>{});
      }
      const videoReady=motionVideo&&!reduce&&!motionVideo.seeking&&motionVideo.readyState>=2&&motionVideo.videoWidth>0;
      if(videoReady){
        if(heldVideoFrame.width!==motionVideo.videoWidth||heldVideoFrame.height!==motionVideo.videoHeight){heldVideoFrame.width=motionVideo.videoWidth;heldVideoFrame.height=motionVideo.videoHeight;}
        heldVideoContext.drawImage(motionVideo,0,0);heldVideoReady=true;
      }
      if(!videoReady&&!heldVideoReady&&!artReady)return;
      const backgroundSource=videoReady?motionVideo:heldVideoReady?heldVideoFrame:painting;
      const sourceWidth=videoReady?motionVideo.videoWidth:heldVideoReady?heldVideoFrame.width:painting.naturalWidth,sourceHeight=videoReady?motionVideo.videoHeight:heldVideoReady?heldVideoFrame.height:painting.naturalHeight;
      const scale=Math.max(1200/sourceWidth,760/sourceHeight);
      const w=sourceWidth*scale,h=sourceHeight*scale;
      sx.drawImage(backgroundSource,(1200-w)/2,(760-h)/2,w,h);
      sx.save();sx.globalCompositeOperation='color';sx.fillStyle='rgba(69,66,131,.16)';sx.fillRect(0,0,1200,760);sx.restore();
      if(reduce)return;
      const sec=t/1000;
      // Local light changes, not a whole-screen brightness pulse.
      function glow(x,y,rx,ry,strength){
        sx.save();sx.translate(x,y);sx.scale(rx,ry);sx.globalCompositeOperation='screen';
        const light=sx.createRadialGradient(0,0,0,0,0,1);light.addColorStop(0,`rgba(255,215,148,${strength})`);light.addColorStop(1,'rgba(255,215,148,0)');
        sx.fillStyle=light;sx.fillRect(-1,-1,2,2);sx.restore();
      }
      const breath=.085+.035*Math.sin(sec*.71)+.016*Math.sin(sec*1.91+.8);
      glow(845,242,315,115,breath);glow(835,615,270,125,breath*.52);
      glow(550,277,55,100,.075+.025*Math.sin(sec*.49+2));
      const sweep=(sec%17)/17;
      if(sweep<.55){const travel=sweep/.55;glow(-150+travel*1500,610,210,75,Math.sin(Math.PI*travel)*.12);}
      // A soft silhouette crosses the illuminated interior, then leaves it quiet.
      const pass=(sec+6)%29;
      if(pass<11){
        const u=pass/11,x=625+u*440,opacity=Math.sin(Math.PI*u)*.20;
        sx.save();sx.beginPath();sx.rect(590,170,540,258);sx.clip();sx.filter='blur(13px)';
        sx.fillStyle=`rgba(10,17,34,${opacity})`;sx.beginPath();sx.ellipse(x,266,16,22,0,0,Math.PI*2);sx.fill();
        sx.beginPath();sx.ellipse(x,348,31,69,-.04,0,Math.PI*2);sx.fill();sx.restore();
      }
    }
    // Original Codrops/Lucas Bebber renderer and drop sprites; see embedded credits.
    const painting=new Image(),dropAlpha=new Image(),dropColor=new Image();
    let artReady=false,glass=null,glassDrops=null,glassSize='',glassFailed=false;
    painting.onload=()=>{artReady=true;};
    painting.src=HOPPER_ART;dropAlpha.src=CODROPS_ALPHA;dropColor.src=CODROPS_COLOR;
    const glassCanvas=document.createElement('canvas');
    const glassForeground=document.createElement('canvas');glassForeground.width=96;glassForeground.height=64;
    const gfg=glassForeground.getContext('2d');
    let beads=[],nextBead=0;
    const between=(a,b)=>a+Math.random()*(b-a);
    function addBead(t,initial=false){
      let x=between(.1,.9)*W,y=between(.08,.34)*H;
      const sets=[...(!finished||t-finished<1000?[records]:[]),...(finished&&t-finished>3000?related:[])].filter(r=>r.length&&t>(r.at(-1).strokes.at(-1)?.start??0)+(r.at(-1).strokes.at(-1)?.duration??0));
      if(!initial&&sets.length&&Math.random()<.65){
        const pool=sets.flatMap((r,i)=>Array(i===0?6:i===1?3:1).fill(r));
        const r=pool[Math.floor(Math.random()*pool.length)],letter=r[Math.floor(Math.random()*r.length)];
        x=W*letter.x-wordWidth(r.map(k=>k.char).join(''))*letter.scale/2+(letter.at+15)*letter.scale;
        y=H*letter.y+20*letter.scale;
      }
      const bead={x,y,r:between(4.3,6),born:t,until:t+between(700,2800),moving:false,path:[]};
      beads.push(bead);
    }
    function advanceBeads(t){
      beads=beads.filter(d=>d.y<H+12&&t-d.born<46000);
      if(!reduce&&beads.length<4&&t>=nextBead){addBead(t);nextBead=t+between(6500,10500);}
      for(const d of beads){
        if(!reduce){
          if(t>=d.until){
            d.moving=!d.moving;
            if(d.moving){d.fromX=d.x;d.fromY=d.y;d.dx=between(-2.5,2.5);d.distance=between(36,100);d.start=t;d.duration=between(1350,2450);d.until=t+d.duration;}
            else{d.x=d.fromX+d.dx;d.y=d.fromY+d.distance;d.until=t+between(1000,3600);}
          }
          if(d.moving){const u=Math.min(1,(t-d.start)/d.duration),ease=u*u*u*(10+u*(-15+6*u));d.x=d.fromX+d.dx*ease;d.y=d.fromY+d.distance*ease;}
        }
        if(!d.path.length||Math.hypot(d.x-d.path.at(-1).x,d.y-d.path.at(-1).y)>.65)d.path.push({x:d.x,y:d.y,t});
        d.path=d.path.filter(p=>t-p.t<6500);
      }
    }
    function glassTrails(t){
      mx.save();mx.lineCap='round';mx.lineJoin='round';
      for(const d of beads)for(let i=1;i<d.path.length;i++){
        const a=d.path[i-1],b=d.path[i];
        // Stop just above the round lens, leaving the original refraction visible.
        if(d.y-b.y<d.r*.85)continue;
        const fade=Math.max(0,1-(t-b.t)/6500)*Math.min(1,(46000-(t-d.born))/2500);
        mx.strokeStyle=`rgba(255,255,255,${fade*.32})`;mx.lineWidth=d.r*.64;mx.beginPath();mx.moveTo(a.x,a.y);mx.lineTo(b.x,b.y);mx.stroke();
      }
      mx.restore();
    }
    function originalGlass(t){
      if(glassFailed||!artReady||!dropAlpha.complete||!dropColor.complete||!dropAlpha.naturalWidth||!dropColor.naturalWidth)return;
      try{
        const size=canvas.width+'x'+canvas.height;
        if(size!==glassSize){
          glassCanvas.width=canvas.width;glassCanvas.height=canvas.height;
          glassDrops=new CodropsRain.Raindrops(canvas.width,canvas.height,dpr,dropAlpha,dropColor,{minR:3,maxR:8,maxDrops:0,raining:false,dropletsRate:0});
          for(let i=0;i<850;i++)glassDrops.drawDroplet(Math.random()*W,Math.random()*H,.5+Math.random()*.9);
          beads=[];if(!reduce)for(let i=0;i<3;i++)addBead(t,true);nextBead=t+9000;
          if(!glass){glass=new CodropsRain.RainRenderer(glassCanvas,glassDrops.canvas,glassForeground,fog,null,{brightness:1.04,alphaMultiply:6,alphaSubtract:3,minRefraction:256,maxRefraction:512,parallaxBg:0,parallaxFg:0});}
          else{glass.canvasLiquid=glassDrops.canvas;glass.gl.gl.viewport(0,0,canvas.width,canvas.height);glass.gl.createUniform('2f','resolution',canvas.width,canvas.height);}
          glass.gl.createUniform('1f','textureRatio',W/H);glassSize=size;
        }
        gfg.drawImage(base,0,0,96,64);
        advanceBeads(t);
        glassDrops.clearCanvas();glassDrops.ctx.drawImage(glassDrops.droplets,0,0);
        for(const d of beads){
          glassDrops.clearDroplets(d.x,d.y,d.r*.7);
          glassDrops.drawDrop(glassDrops.ctx,{x:d.x,y:d.y,r:d.r,spreadX:0,spreadY:-1/3});
        }
        glass.updateTextures();glass.draw();
        fx.clearRect(0,0,W,H);fx.drawImage(glassCanvas,0,0,W,H);
      }catch(error){glassFailed=true;console.error('Glass renderer unavailable:',error);}
    }

    let drawable=false;
    function fit(){
      const r=root.getBoundingClientRect();
      drawable=Number.isFinite(r.width)&&Number.isFinite(r.height)&&r.width>0&&r.height>0;
      // Embedded previews can be hidden or not laid out yet. Preserve the last
      // valid backing stores and wait for ResizeObserver to report a real size.
      if(!drawable)return;
      W=r.width;H=r.height;narrow=W<530;
      dpr=Math.max(.1,Math.min(Number.isFinite(devicePixelRatio)?devicePixelRatio:1,1.5));
      const width=Math.max(1,Math.round(W*dpr)),height=Math.max(1,Math.round(H*dpr));
      [canvas,base,fog,mask].forEach(c=>{if(c.width!==width)c.width=width;if(c.height!==height)c.height=height;});
      ctx.setTransform(dpr,0,0,dpr,0,0);condensationTexture();
      if(lastText)records=main(lastText,clock,records);if(finished)labels();
    }
    function wordWidth(word){return [...word].reduce((a,c)=>a+(letters[c]?.width||20)+5,0);}
    function arrange(word,x,y,scale,clarity,start){let at=0,time=start;const rec=[];for(const char of word){const g=letters[char];if(!g){rec.push({char,at,x,y,scale,clarity,strokes:[],native:true});at+=25;continue;}const group=[];for(const st of g.strokes){const duration=Math.max(35,st.len*2.4/opts.speed);group.push({...st,start:time,duration});time+=duration+22/opts.speed;}rec.push({char,at,x,y,scale,clarity,strokes:group});at+=g.width+5;time+=28/opts.speed;}return rec;}
    function main(word,start,old=[]){const scale=Math.min(narrow?1.65:2.25,(W-64)/Math.max(wordWidth(word),1));const result=arrange(word,.5,.44,scale,1,start);let match=0;while(match<old.length&&match<result.length&&old[match].char===result[match].char){result[match].strokes=old[match].strokes;match++;}if(match&&match<result.length){let cursor=Math.max(clock,old[match-1].strokes.at(-1).start+old[match-1].strokes.at(-1).duration);for(let i=match;i<result.length;i++){for(const s of result[i].strokes){s.start=cursor;cursor+=s.duration+22;}}}return result;}
    // Closed stroke silhouettes keep pressure changes smooth and avoid dark joints.
    function pressureOutline(points,width,phase,strength){
      const left=[],right=[],last=points.length-1;
      for(let i=0;i<=last;i++){
        const a=points[Math.max(0,i-2)],b=points[Math.min(last,i+2)],p=points[i];
        const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,u=i/Math.max(1,last);
        const taper=.62+.38*Math.pow(Math.sin(Math.PI*u),.45);
        const pressure=1+strength*Math.sin(u*Math.PI*2+phase)+.12*Math.sin(u*Math.PI*4+phase*.7);
        const radius=Math.max(.65,width*pressure*taper*.5);
        left.push([p[0]-dy/length*radius,p[1]+dx/length*radius]);right.push([p[0]+dy/length*radius,p[1]-dx/length*radius]);
      }
      const path=new Path2D();path.moveTo(...left[0]);for(let i=1;i<left.length;i++)path.lineTo(...left[i]);
      for(let i=right.length-1;i>=0;i--)path.lineTo(...right[i]);path.closePath();
      return path;
    }
    function freehandPressureOutline(stroke){
      const points=stroke.points,left=[],right=[],last=points.length-1;
      if(last<1)return null;
      for(let i=0;i<=last;i++){
        const before=points[Math.max(0,i-2)],after=points[Math.min(last,i+2)],point=points[i];
        const dx=after.x-before.x,dy=after.y-before.y,length=Math.hypot(dx,dy)||1;
        const localSpeed=Math.hypot(after.x-before.x,after.y-before.y)/Math.max(1,Math.min(last,i+2)-Math.max(0,i-2));
        const u=i/last,taper=.58+.42*Math.pow(Math.sin(Math.PI*u),.42);
        const stylus=.76+Math.max(.12,point.pressure)*.48;
        const handWave=1+stroke.strength*Math.sin(i*.38+stroke.phase)+.09*Math.sin(i*.83+stroke.phase*.6);
        const speedPressure=1-Math.min(.28,localSpeed*.022);
        const radius=Math.max(.8,5.2*stylus*handWave*speedPressure*taper);
        left.push([point.x-dy/length*radius,point.y+dx/length*radius]);right.push([point.x+dy/length*radius,point.y-dx/length*radius]);
      }
      const path=new Path2D();path.moveTo(...left[0]);for(let i=1;i<left.length;i++)path.lineTo(...left[i]);
      for(let i=right.length-1;i>=0;i--)path.lineTo(...right[i]);path.closePath();return path;
    }
    function trace(c,rec,t,opacity=1){
      const len=rec.span||wordWidth(rec.map(r=>r.char).join(''));
      for(const r of rec){
        c.save();c.translate(W*r.x,H*r.y);c.rotate(r.tilt||0);
        c.translate((-len/2+r.at)*r.scale,-35*r.scale);c.scale(r.scale,r.scale);
        c.translate(r.dx||0,r.dy||0);c.rotate(r.angle||0);c.scale(r.glyphX||1,r.glyphY||1);
        c.lineCap='round';c.lineJoin='round';c.strokeStyle=`rgba(255,255,255,${r.clarity*opacity})`;c.fillStyle=c.strokeStyle;
        if(r.native){c.font='italic 42px Georgia';c.fillText(r.char,0,55);}
        for(const s of r.strokes){
          const p=reduce?1:Math.max(0,Math.min(1,(t-s.start)/s.duration));if(!p)continue;
          if(s.outline&&p===1){c.fill(s.outline);continue;}
          c.lineWidth=opts.width*Math.min(1,r.scale/1.5)/r.scale*(r.pressure||1)*(s.pressure||1);
          const count=Math.max(2,Math.ceil(s.pts.length*p));c.beginPath();c.moveTo(...s.pts[0]);
          for(let k=1;k<count;k++)c.lineTo(...s.pts[k]);c.stroke();
        }
        c.restore();
      }
    }
    function drawFreehand(c,t,opacity=1){
      freehandStrokes=freehandStrokes.filter(stroke=>!stroke.ended||t-stroke.ended<4000);
      c.save();c.lineCap='round';c.lineJoin='round';
      for(const stroke of freehandStrokes){
        const age=stroke.ended?t-stroke.ended:0;
        const alpha=opacity*(stroke.ended?1-smoothUnit(age/4000):1);
        if(alpha<=0||!stroke.points.length)continue;
        c.fillStyle=`rgba(255,255,255,${alpha})`;
        if(stroke.points.length===1){const p=stroke.points[0];c.beginPath();c.arc(p.x,p.y,3.8+p.pressure*2.2,0,Math.PI*2);c.fill();continue;}
        if(stroke.outlinePointCount!==stroke.points.length){stroke.outline=freehandPressureOutline(stroke);stroke.outlinePointCount=stroke.points.length;}
        if(stroke.outline)c.fill(stroke.outline);
      }
      c.restore();
    }
    // User-supplied rain recording with independent, softly filtered word tones.
    const soundButton=root.querySelector('.fw-sound');
    const rainAudio=document.createElement('audio');rainAudio.src=mediaRoot+'urban-rain.mp3';rainAudio.loop=true;rainAudio.preload='none';rainAudio.volume=.32;rainAudio.hidden=true;rainAudio.setAttribute('aria-hidden','true');root.append(rainAudio);
    const cafeAudio=document.createElement('audio');cafeAudio.src=mediaRoot+'cafe-ambience.mp3';cafeAudio.loop=true;cafeAudio.preload='none';cafeAudio.volume=1;cafeAudio.hidden=true;cafeAudio.setAttribute('aria-hidden','true');root.append(cafeAudio);
    const ambienceTracks=[rainAudio,cafeAudio];
    let soundContext=null,soundMaster=null,soundBus=null,muted=false,audioVoices=0;
    try{muted=localStorage.getItem('mist-muted')==='true';}catch{}
    function soundState(){soundButton.setAttribute('aria-label',muted?'Enable sound':'Mute sound');soundButton.setAttribute('aria-pressed',String(!muted));soundButton.classList.toggle('is-muted',muted);}
    soundState();
    function startSound(){
      if(muted||document.hidden)return;
      if(motionVideo){motionVideo.volume=.08;motionVideo.muted=false;}
      for(const track of ambienceTracks)if(track.paused)track.play().catch(()=>{});
      try{
        if(!soundContext){
          const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
          soundContext=new Audio();soundButton.dataset.audioState=soundContext.state;soundContext.onstatechange=()=>{soundButton.dataset.audioState=soundContext.state;};soundMaster=soundContext.createGain();soundMaster.gain.value=.22;soundMaster.connect(soundContext.destination);
          soundBus=soundContext.createBiquadFilter();soundBus.type='lowpass';soundBus.frequency.value=680;soundBus.Q.value=.3;
          const dry=soundContext.createGain();dry.gain.value=.45;soundBus.connect(dry);dry.connect(soundMaster);
          const reverb=soundContext.createConvolver(),impulse=soundContext.createBuffer(2,soundContext.sampleRate*2.4,soundContext.sampleRate);
          for(let ch=0;ch<2;ch++){const a=impulse.getChannelData(ch);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,3)*.35;}
          reverb.buffer=impulse;const wet=soundContext.createGain();wet.gain.value=.35;soundBus.connect(reverb);reverb.connect(wet);wet.connect(soundMaster);
        }
        if(soundContext.state==='suspended')soundContext.resume().catch(()=>{});
      }catch{muted=true;soundState();}
    }
    function whisperNote(index=0,result=false){
      if(muted||!soundContext||soundContext.state!=='running'||audioVoices>=8||document.hidden)return;
      const now=soundContext.currentTime,osc=soundContext.createOscillator(),gain=soundContext.createGain();audioVoices++;
      const pitches=[174.61,196,233.08,261.63,293.66,349.23,392];osc.type='sine';osc.frequency.value=pitches[index%pitches.length]*(result?1:.5);
      osc.detune.setValueAtTime(-8+Math.random()*16,now);osc.detune.linearRampToValueAtTime(-5+Math.random()*10,now+1.3);
      const duration=result?2.3:.95,level=result?.16:.085;
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(level,now+(result?.32:.09));gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
      osc.connect(gain);gain.connect(soundBus);osc.start(now);osc.stop(now+duration+.05);
      osc.onended=()=>{osc.disconnect();gain.disconnect();audioVoices--;};
    }
    root.addEventListener('pointerdown',e=>{if(!e.target.closest('.fw-sound'))startSound();});
    input.addEventListener('keydown',startSound);
    input.addEventListener('input',startSound);
    soundButton.addEventListener('click',()=>{muted=!muted;try{localStorage.setItem('mist-muted',String(muted));}catch{}soundState();if(muted){if(motionVideo)motionVideo.muted=true;ambienceTracks.forEach(track=>track.pause());if(soundContext)soundContext.suspend().catch(()=>{});}else startSound();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){ambienceTracks.forEach(track=>track.pause());if(soundContext)soundContext.suspend().catch(()=>{});}else if(!muted&&soundContext)startSound();});
    window.addEventListener('pagehide',()=>{ambienceTracks.forEach(track=>track.pause());if(soundContext)soundContext.suspend().catch(()=>{});});





    let resultWords=[],resultScores=[],handSeed=1,pending=false,resultStart=0,requestId=0;
    const soundedResults=new Set();
    const smoothUnit=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
    function queryVisibility(t){return finished?(reduce?0:1-smoothUnit((t-finished)/1700)):1;}
    function labels(){
      if(!finished||!resultWords.length){related=[];return;}
      const slots=narrow?[[.45,.32],[.64,.15],[.40,.57],[.66,.75],[.27,.83],[.30,.45],[.7,.48]]:[[.43,.39],[.76,.21],[.20,.60],[.74,.64],[.49,.79],[.22,.20],[.48,.15]];
      const scores=resultScores.map(s=>Math.max(0,Math.min(1,s)));
      const low=Math.min(...scores),high=Math.max(...scores);
      const size=scores.map(s=>.62+(high>low?(s-low)/(high-low):.5)*.52);
      const clarity=scores.map(s=>.24+.74*s);
      const room=narrow?W*.76:W*.30;
      const fitScale=Math.min(narrow?.72:1,...resultWords.map((word,i)=>room/(wordWidth(word)*size[i]*1.14)));
      let seed=handSeed;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
      related=resultWords.map((word,i)=>{
        const tilt=(rand()-.5)*.19,x=slots[i][0],y=slots[i][1];
        const rec=arrange(word,x,y,size[i]*fitScale,clarity[i],-100000);
        let cursor=0;const wordPressure=3.8+rand()*1.8,baselinePhase=rand()*6.28;
        for(let j=0;j<rec.length;j++){
          const r=rec[j];r.tilt=tilt;r.at=cursor;r.dx=(rand()-.5)*1.8;
          r.dy=Math.sin(j*.85+baselinePhase)*2.5+(rand()-.5)*3.2;r.angle=(rand()-.5)*.105;
          r.glyphX=.92+rand()*.16;r.glyphY=.87+rand()*.26;
          r.strokes=r.strokes.map(s=>({...s,outline:pressureOutline(s.pts,wordPressure*(.80+rand()*.4),rand()*6.28,.26+rand()*.13)}));
          cursor+=(letters[r.char]?.width||20)*r.glyphX+3+rand()*5;
        }
        rec.span=cursor;
        return rec;
      });
      // Irregular negative space, with bounded collision-free placement.
      const originalScales=related.map(rec=>rec[0].scale);
      for(let pass=0;pass<12;pass++){
      const boxes=[];let placed=true;
      for(let i=0;i<related.length;i++){
        const rec=related[i];for(const r of rec)r.scale=originalScales[i]*Math.pow(.88,pass);
        const scale=rec[0].scale,tilt=Math.abs(rec[0].tilt);
        const span=rec.span;
        const bw=span*scale+100*scale*tilt+20,bh=100*scale+span*scale*tilt+16;
        let chosen=null;
        for(let attempt=0;attempt<220;attempt++){
          const cx=attempt<60?slots[i][0]*W+(rand()-.5)*W*.15:W*(.12+rand()*.76);
          const cy=attempt<60?slots[i][1]*H+(rand()-.5)*H*.12:H*(.13+rand()*.69);
          const x=Math.max(bw/2+20,Math.min(W-bw/2-20,cx)),y=Math.max(bh/2+28,Math.min(H-bh/2-88,cy));
          const box={x:x-bw/2,y:y-bh/2,w:bw,h:bh,cx:x,cy:y};
          if(boxes.every(b=>box.x>b.x+b.w+18||box.x+box.w+18<b.x||box.y>b.y+b.h+18||box.y+box.h+18<b.y)){chosen=box;break;}
        }
        // Repack every word at a smaller size instead of accepting an overlap.
        if(!chosen){placed=false;break;}
        boxes.push(chosen);for(const r of rec){r.x=chosen.cx/W;r.y=(chosen.cy)/H;}
      }
      if(placed)break;
      }
    }
    function revealResults(t,fade){
      if(!finished||pending||!resultStart)return;
      const allShown=1900+(related.length-1)*240;
      const ending=1-smoothUnit((t-resultStart-allShown-6500)/3500);
      related.forEach((r,i)=>{
        const progress=reduce?1:smoothUnit((t-resultStart-i*240)/1900);
        if(!progress)return;
        if(!soundedResults.has(i)){soundedResults.add(i);whisperNote(i,true);}
        mx.filter=`blur(${(1-progress)*3+(1-ending)*2+(1-resultScores[i])*.7}px)`;trace(mx,r,t,fade*progress*ending);
      });
      mx.filter='none';
      if(ending===0&&!resetAt)completeCycle();
    }
    function completeCycle(){
      records=[];related=[];resultWords=[];resultScores=[];freehandStrokes=[];activeFreehand=null;resultStart=0;finished=false;pending=false;lastText='';
      reset.hidden=true;input.value='';input.disabled=false;form.hidden=false;message.textContent='';
      canvas.setAttribute('aria-label','A misted window with hand-drawn flowers');
      form.classList.remove('fw-return');void form.offsetWidth;form.classList.add('fw-return');
      nextGarden=clock+350;
    }
    function showError(text){
      pending=false;finished=false;resultStart=0;related=[];resultWords=[];resultScores=[];
      form.hidden=false;input.disabled=false;reset.hidden=true;root.classList.remove('is-loading');root.setAttribute('aria-busy','false');
      message.classList.add('is-error');message.textContent=text;input.focus();
    }
    function acceptResults(data){
      if(!Array.isArray(data.results)||!data.results.length)throw Error('No related words were found.');
      const items=data.results.slice(0,7);
      if(items.some(r=>typeof r.word!=='string'||!Number.isFinite(r.score)))throw Error('Please try again.');
      resultWords=items.map(r=>r.word);resultScores=items.map(r=>r.score);soundedResults.clear();
      pending=false;resultStart=reduce?clock:Math.max(clock,finished+1250);labels();root.classList.remove('is-loading');root.setAttribute('aria-busy','false');
      canvas.setAttribute('aria-label','Related to '+lastText+': '+items.map(r=>r.word+', cosine similarity '+r.score.toFixed(3)).join('; '));
      message.textContent='Related words: '+resultWords.join(', ');
    }
    async function submitWord(){
      if(pending||finished||!lastText)return;
      const id=++requestId;finished=clock||1;pending=true;handSeed=Math.floor(Math.random()*4294967296);
      form.hidden=true;input.disabled=true;reset.hidden=false;message.classList.remove('is-error');message.textContent='Finding related words…';
      root.classList.add('is-loading');root.setAttribute('aria-busy','true');
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),180000);
      try{
        if(window.condenseLookup){const data=await window.condenseLookup(lastText);if(id===requestId)acceptResults(data);return;}
        const response=await fetch('/api/similar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word:lastText,top_n:7}),signal:controller.signal});
        const data=await response.json();if(id!==requestId)return;
        if(!response.ok)throw Error(data.error||'Please try again.');acceptResults(data);
      }catch(error){if(id===requestId)showError(error.name==='AbortError'?'The model is taking longer than expected. Please try again.':error.message==='Failed to fetch'?'Unable to connect. Please try again.':error.message);}
      finally{clearTimeout(timeout);}
    }


    function draw(t){if(!root.isConnected)return;requestAnimationFrame(draw);if(document.hidden)return;if(!drawable||[canvas,scene,base,fog,mask].some(c=>c.width<1||c.height<1))return;if(t-lastFrame<32)return;lastFrame=t;clock=t;street(reduce?5000:t);bx.setTransform(dpr,0,0,dpr,0,0);bx.clearRect(0,0,W,H);bx.drawImage(scene,0,0,W,H);
      bx.fillStyle='rgba(5,17,25,.06)';bx.fillRect(0,0,W,H);
      ctx.clearRect(0,0,W,H);ctx.drawImage(base,0,0,W,H);
      fx.setTransform(dpr,0,0,dpr,0,0);fx.globalCompositeOperation='source-over';fx.clearRect(0,0,W,H);fx.filter='blur('+opts.blur+'px)';fx.drawImage(base,-20*dpr,-20*dpr,base.width+40*dpr,base.height+40*dpr, -20,-20,W+40,H+40);fx.filter='none';
      const tint=fx.createLinearGradient(0,0,0,H);tint.addColorStop(0,`rgba(198,211,241,${Math.min(.9,opts.fog*1.5)})`);tint.addColorStop(.26,`rgba(191,206,232,${opts.fog*1.35})`);tint.addColorStop(.55,`rgba(140,158,194,${opts.fog*.6})`);tint.addColorStop(1,'rgba(23,29,65,.32)');fx.fillStyle=tint;fx.fillRect(0,0,W,H);
      originalGlass(t);
      mx.setTransform(dpr,0,0,dpr,0,0);mx.clearRect(0,0,W,H);const fade=resetAt?Math.max(0,1-(t-resetAt)/650):1;trace(mx,records,t,fade*queryVisibility(t));
      revealResults(t,fade);drawFreehand(mx,t,fade);
      // Quiet condensation rivulets. Their short trails close as the drop passes.
      garden(t);glassTrails(t);
      fx.globalCompositeOperation='destination-out';fx.drawImage(mask,0,0,W,H);fx.globalCompositeOperation='source-over';ctx.drawImage(fog,0,0,W,H);
      // Very faint moisture rim reinforces the wiped stroke without becoming white ink.
      ctx.save();ctx.globalAlpha=.035;ctx.shadowColor='#fff9d8';ctx.shadowBlur=2;trace(ctx,records,t,fade*queryVisibility(t));ctx.restore();
      const edge=ctx.createRadialGradient(W*.5,H*.42,Math.min(W,H)*.2,W*.5,H*.42,Math.max(W,H)*.8);edge.addColorStop(0,'#18333b00');edge.addColorStop(1,'#15323b77');ctx.fillStyle=edge;ctx.fillRect(0,0,W,H);
      if(resetAt&&t-resetAt>650){records=[];related=[];resultWords=[];resultScores=[];freehandStrokes=[];activeFreehand=null;resultStart=0;idleSince=clock;resetAt=0;finished=false;lastText='';form.hidden=false;input.value='';input.disabled=false;input.focus();}
    }
    input.addEventListener('input',()=>{const clean=input.value.toLowerCase().replace(/[^a-z]/g,'').slice(0,20);message.textContent=clean!==input.value.toLowerCase()?'This study supports English letters only.':'';input.value=clean;message.classList.remove('is-error');const old=records;lastText=clean;records=main(clean,clock,old);const strokes=records.flatMap(r=>r.strokes),end=strokes.length?strokes.at(-1).start+strokes.at(-1).duration:clock;const factor=Math.min(1,1200/Math.max(1,end-clock));if(factor<1)for(const s of strokes){if(s.start>=clock){s.start=clock+(s.start-clock)*factor;s.duration*=factor;}else if(s.start+s.duration>clock)s.duration=clock-s.start+(s.start+s.duration-clock)*factor;}canvas.setAttribute('aria-label',clean?'Writing on the glass: '+clean:'Misted window at dusk');});
    form.addEventListener('submit',e=>{e.preventDefault();submitWord();});
    reset.addEventListener('click',()=>{requestId++;pending=false;root.classList.remove('is-loading');root.setAttribute('aria-busy','false');message.textContent='';message.classList.remove('is-error');resetAt=clock;reset.hidden=true;root.querySelectorAll('.fw-label').forEach(e=>e.remove());});
    function freehandPoint(event){const r=canvas.getBoundingClientRect();return {x:(event.clientX-r.left)*W/r.width,y:(event.clientY-r.top)*H/r.height,pressure:event.pressure>0?event.pressure:.5};}
    canvas.addEventListener('pointerdown',event=>{
      if(event.pointerType==='mouse'&&event.button!==0)return;
      event.preventDefault();startSound();
      activeFreehand={points:[freehandPoint(event)],born:clock,ended:0,phase:Math.random()*Math.PI*2,strength:.12+Math.random()*.10,outline:null,outlinePointCount:0};freehandStrokes.push(activeFreehand);
      canvas.setPointerCapture?.(event.pointerId);
    });
    canvas.addEventListener('pointermove',event=>{
      if(!activeFreehand)return;event.preventDefault();const point=freehandPoint(event),last=activeFreehand.points.at(-1);
      if(Math.hypot(point.x-last.x,point.y-last.y)>1.25)activeFreehand.points.push(point);
    });
    function finishFreehand(event){if(!activeFreehand)return;activeFreehand.ended=clock;activeFreehand=null;if(event&&canvas.hasPointerCapture?.(event.pointerId))canvas.releasePointerCapture(event.pointerId);}
    canvas.addEventListener('pointerup',finishFreehand);canvas.addEventListener('pointercancel',finishFreehand);
    new ResizeObserver(fit).observe(root);fit();requestAnimationFrame(draw);

  })();
  
