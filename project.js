
var timeToGenerateCube=false,timeToGenerateCollectible=false;
var canvas;
var body;
var joycanvas;
var joycanvasContext;
var spacebut;
var gl;

var points = [];
var normals = [];
var pointcolors = [];
var objectsToRender = [];

var program;

var sensitivity=0.002;
var keyboardSensitivity=0.1;
var joySensitivity=0.002;

var perspectiveMatrix;
var perspectiveMatrixLoc;
var cameraMatrix;
var cameraMatrixLoc;

var cube1,cube2,cube3;
var floor,player;

var keysPressed=[];
var spaceTriggered=false;

var joyX=0.0,joyY=0.0;

var floorLimitX1;
var floorLimitX2;
var floorLimitY1;
var floorLimitY2;
var floorLimitZ1;
var floorLimitZ2;

var angle=-1;

var eye=vec3(-1.3,4.0,4.0);
var at=vec3(0.0,0.0,0.7);
var up=vec3(0.0,1.0,0.0);

var cubeColors=[
	vec4(0.90,0.77,0.0,1.0),
	vec4(0.65,0.00,0.87,1.0),
	vec4(0.00,0.54,0.68,1.0),
	vec4(0.45,0.87,0.13,1.0)
];


var lightPosition = vec4(5.0,-4.0, -8.0, 0.0 );
var lightAmbient = vec4(0.13, 0.13, 0.13, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 0.7, 0.7, 0.7, 1.0 );

var materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialSpecular = vec4( 0.3, 0.3, 0.3, 1.0 );
var materialShininess = 20.0;

var ambientProduct;
var specularProduct;



window.onload = function init()
{
	joycanvas=document.getElementById( "joy-canvas" );
    canvas = document.getElementById( "gl-canvas" );
	body=document.getElementById("body");
	canvas.style.position="absolute";
	canvas.style.top="0px";
	canvas.style.left="0px";
	canvas.style.width=window.screen.width+"px";
	canvas.style.height=window.screen.height+"px";
	canvas.width=window.screen.width*window.devicePixelRatio;
	canvas.height=window.screen.height*window.devicePixelRatio;
	
	joycanvas.style.position="absolute";
	joycanvas.style.top=window.screen.height*0.4+"px";
	joycanvas.style.left=window.screen.width*0.75+"px";
	joycanvas.style.width=120+"px";
	joycanvas.style.height=120+"px";
	joycanvas.width=120*window.devicePixelRatio
	joycanvas.height=120*window.devicePixelRatio;
	joycanvasContext=joycanvas.getContext("2d");
	drawJoyPosition(0,0);
	spacebut=document.getElementById("spacebut");
	spacebut.style.position="absolute";
	spacebut.style.top=window.screen.height*0.6+"px";
	spacebut.style.left=window.screen.width*0.1+"px";
	spacebut.style.width=120+"px";
	spacebut.style.height=60+"px";
	
	document.addEventListener("pointerlockchange", mouseCaptureHandler, false);
	document.addEventListener("mozpointerlockchange", mouseCaptureHandler, false);
	document.addEventListener("keydown",handleKeyDown,false);
	document.addEventListener("keyup",handleKeyUp,false);
	joycanvas.addEventListener("touchstart",joyStartTouch,false);
	joycanvas.addEventListener("touchmove",joyMoveTouch,false);
	joycanvas.addEventListener("touchcancel",joyStopTouch,false);
	joycanvas.addEventListener("touchend",joyStopTouch,false);
	spacebut.addEventListener("touchstart",doJumpStart,false);
	spacebut.addEventListener("touchcancel",doJumpStop,false);
	spacebut.addEventListener("touchend",doJumpStop,false);
	
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    // enable hidden-surface removal

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	ambientProduct = mult(lightAmbient, materialAmbient);
    specularProduct = mult(lightSpecular, materialSpecular);
	
	//perspective( fovy, aspect, near, far )
	perspectiveMatrix=perspective(50.0,canvas.width/canvas.height,0.3,20.0);
	perspectiveMatrixLoc=gl.getUniformLocation(program,"projectionMatrix");
	gl.uniformMatrix4fv(perspectiveMatrixLoc,false,flatten(perspectiveMatrix));
	
	//lookAt( eye, at, up ) / lookAt( eye, at, computeVerticalUp(eye) )
	cameraMatrix=lookAt(eye,at,up);
	cameraMatrixLoc=gl.getUniformLocation(program,"modelViewMatrix");
	gl.uniformMatrix4fv(cameraMatrixLoc,false,flatten(cameraMatrix));
	
	gl.uniform4fv( gl.getUniformLocation(program,
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
       "lightPosition"),flatten(lightPosition) );
	   gl.uniform4fv( gl.getUniformLocation(program,
       "lightDiffuse"),flatten(lightDiffuse) );
    gl.uniform1f( gl.getUniformLocation(program,
       "shininess"),materialShininess );
	   
	
	floor=new Cube();
	floor.setColor(0.24,0.29,0.38,1.0);
	floor.setSizes(5.0,0.15,5.0);
	floor.currentPos.setPosition(0.0,-0.3,0.0);
	floor.moveToPosition();
	floorLimitX1=floor.vertices[4][0];
	floorLimitX2=floor.vertices[5][0];
	floorLimitY1=floor.vertices[4][1]+0.001;
	floorLimitY2=floor.vertices[4][1]+3.0;
	floorLimitZ1=floor.vertices[4][2];
	floorLimitZ2=floor.vertices[0][2];
	player=new Cube();
	player.setColor(0.90,0.77,0.0,1.0);
	player.setSizes(0.15,0.15,0.15);
	player.currentPos.setPosition(0.0,-0.04,0.0);
	player.moveToPosition();
	player.setLimitBoundaries([floorLimitX1,floorLimitY1,floorLimitZ1],[floorLimitX2,floorLimitY2,floorLimitZ2]);
	cube1=new Cube();
	cube1.setColor(0.65,0.00,0.87,1.0);
	cube1.setSizes(0.15,0.15,0.15);
	cube1.currentPos.setPosition(-0.3,0.0,-1.0);
	cube1.moveToPosition();
	cube2=new Cube();
	cube2.setColor(0.00,0.54,0.68,1.0);
	cube2.setSizes(0.1,0.1,0.1);
	cube2.currentPos.setPosition(0.3,0.0,-0.5);
	cube2.moveToPosition();
	cube3=new Cube();
	cube3.setColor(0.45,0.87,0.13,1.0);
	cube3.setSizes(0.09,0.09,0.09);
	cube3.currentPos.setPosition(0.4,0.0,0.1);
	cube3.moveToPosition();
	cube3.setMovement(0.0,0.0,0.01);
	cube3.setLimitBoundaries([floorLimitX1-0.3,-100.0,floorLimitZ1-0.3],[floorLimitX2+0.3,100.0,floorLimitZ2+0.3]);
	cube1.display=false;
	cube2.display=false;
	cube3.display=false;
	generateNextCubeTimer();
	generateNextCollectibleTimer();
	render();
};

function handleKeyDown(e)
{
	if(!keysPressed.includes(e.which))
	{
		keysPressed.push(e.which);
	}
}

function handleKeyUp(e)
{
	keysPressed.splice(keysPressed.indexOf(e.which),1);
}

function doJumpStart(e)
{
	keysPressed.push(32);
	spacebut.addEventListener("mouseup",doJumpStop,false);
}

function doJumpStop(e)
{
	spacebut.removeEventListener("mouseup",doJumpStop,false);
	keysPressed.splice(keysPressed.indexOf(32),1);
}

function drawJoyPosition(x,y)
{
	joycanvasContext.clearRect(0,0,joycanvas.width,joycanvas.height);
	joycanvasContext.beginPath();
	joycanvasContext.strokeStyle="#FFFFFF";
	joycanvasContext.arc(joycanvas.width/2, joycanvas.height/2, joycanvas.width/2-10, 0, 2 * Math.PI);
	joycanvasContext.stroke();
	joycanvasContext.beginPath();
	joycanvasContext.arc(joycanvas.width/2+x, joycanvas.height/2+y, joycanvas.width/4, 0, 2 * Math.PI);
	joycanvasContext.fillStyle="#ABABAB";
	joycanvasContext.fill();
	joycanvasContext.stroke();
}

var initPosX,initPosY;

function joyStart(e)
{
	initPosX=e.clientX;
	initPosY=e.clientY;
	document.addEventListener("mousemove",joyMove,false);
	document.addEventListener("mouseup",joyStop,false);
}

function joyStop(e)
{
	document.removeEventListener("mousemove",joyMove,false);
	document.removeEventListener("mouseup",joyStop,false);
	joyX=0.0;
	joyY=0.0;
	drawJoyPosition(0,0);
}

function joyMove(e)
{
	var moveX,moveY;
	var permWidth=joycanvas.width/4-1;
	moveX=e.clientX-initPosX;
	moveY=e.clientY-initPosY;
	if(moveX<-permWidth)
	{
		moveX=-permWidth;
	}
	if(moveX>permWidth)
	{
		moveX=permWidth;
	}
	if(moveY<-permWidth)
	{
		moveY=-permWidth;
	}
	if(moveY>permWidth)
	{
		moveY=permWidth;
	}
	drawJoyPosition(moveX,moveY);
	joyX=moveX*joySensitivity;
	joyY=moveY*joySensitivity;
}

function joyStartTouch(e)
{
	e.preventDefault();
	initPosX=e.targetTouches[0].pageX;
	initPosY=e.targetTouches[0].pageY;
}

function joyStopTouch(e)
{
	e.preventDefault();
	joyX=0.0;
	joyY=0.0;
	drawJoyPosition(0,0);
}

function joyMoveTouch(e)
{
	e.preventDefault();
	var moveX,moveY;
	var permWidth=joycanvas.width/4-1;
	moveX=e.targetTouches[0].pageX-initPosX;
	moveY=e.targetTouches[0].pageY-initPosY;
	if(moveX<-permWidth)
	{
		moveX=-permWidth;
	}
	if(moveX>permWidth)
	{
		moveX=permWidth;
	}
	if(moveY<-permWidth)
	{
		moveY=-permWidth;
	}
	if(moveY>permWidth)
	{
		moveY=permWidth;
	}
	drawJoyPosition(moveX,moveY);
	joyX=moveX*joySensitivity;
	joyY=moveY*joySensitivity;
}

function updatePositionJoy()
{
	player.moveToOrigin();
	player.currentPos.x+=joyX;
	player.currentPos.z+=joyY;
	player.moveToPosition();
}

function mouseCaptureHandler()
{
	 if (document.pointerLockElement === canvas ||
      document.mozPointerLockElement === canvas) 
	 {
		 document.addEventListener("mousemove", updatePosition);
	 }
	 else
	 {
		 document.removeEventListener("mousemove", updatePosition);
	 }
}

function updatePosition(e)
{
	player.moveToOrigin();
	player.currentPos.x+=e.movementX*sensitivity;
	player.currentPos.z+=e.movementY*sensitivity;
	player.moveToPosition();
}

function fullscreenAndNextClickCaptureMouse()
{
	if(!document.fullscreenElement)
	{
		document.documentElement.requestFullscreen();
	}
	else
	{
		canvas.requestPointerLock = canvas.requestPointerLock ||
                            canvas.mozRequestPointerLock;
		canvas.requestPointerLock();
	}
}

function multMatWithVec(m,v)
{
	var i,j;
	var resv=[];
	if(!m.matrix)
	{
		throw "multMatWithVec(m,v): m is not a matrix";
	}
	if(v.matrix)
	{
		throw "multMatWithVec(m,v): v is a matrix";
	}
	if(m.length!=v.length)
	{
		throw "multMatWithVec(m,v): Illegal multiplication: Number of columns of m does not equal number of rows in column vector"
	}
	else
	{
		var sum=0.0;
		var mNrRows=m[0].length;
		for(i=0;i<mNrRows;i++)
		{
			for(j=0;j<m.length;j++)
			{
				sum+=m[j][i]*v[j];
			}
			resv.push(sum);
			sum=0.0;
		}
	}
	return resv;
}

function generateRandomInInterval(a1,a2)
{
	return Math.random()*(a2-a1)+a1;
}

function generateNextCollectibleTimer()
{
	if(!timeToGenerateCollectible)
	{
		timeToGenerateCollectible=true;
	}
	setTimeout(generateNextCollectibleTimer,3000);
}

function checkIfInAnotherCollectible(collectible)
{
	var i;
	for(i=0;i<objectsToRender.length-1;i++)
	{
		if(
			objectsToRender[i].collectible &&
			objectsToRender[i].currentPos.x-objectsToRender[i].sizes[0]*5<=collectible.currentPos.x &&
			collectible.currentPos.x<=objectsToRender[i].currentPos.x+objectsToRender[i].sizes[0]*5 &&
			objectsToRender[i].currentPos.z-objectsToRender[i].sizes[2]*5<=collectible.currentPos.z &&
			collectible.currentPos.z<=objectsToRender[i].currentPos.z+objectsToRender[i].sizes[2]*5
		)
		{
			return true;
		}
	}
	return false;
}

function generateNextCollectible()
{
	if(timeToGenerateCollectible)
	{
		var color;
		var offsetFromFloorLimit=0.9;
		color=Math.floor(Math.random()*cubeColors.length);
		while(cubeColors[color]==player.colors[0])
		{
			color=Math.floor(Math.random()*cubeColors.length);
		}
		var collectible=new Cube();
		collectible.collectible=true;
		collectible.generated=true;
		collectible.setColor(cubeColors[color][0],cubeColors[color][1],cubeColors[color][2],cubeColors[color][3]);
		collectible.setSizes(0.05,0.05,0.05);
		collectible.currentPos.y=0.03+collectible.sizes[1];
		
		collectible.currentPos.x=generateRandomInInterval(floorLimitX1+collectible.sizes[0]+offsetFromFloorLimit,floorLimitX2-collectible.sizes[0]-offsetFromFloorLimit);
		collectible.currentPos.z=generateRandomInInterval(floorLimitZ1+collectible.sizes[2]+offsetFromFloorLimit,floorLimitZ2-collectible.sizes[2]-offsetFromFloorLimit);
		while(
			(player.currentPos.x-player.sizes[0]*9<=collectible.currentPos.x &&
			collectible.currentPos.x<=player.currentPos.x+player.sizes[0]*9 &&
			player.currentPos.z-player.sizes[2]*9<=collectible.currentPos.z &&
			collectible.currentPos.z<=player.currentPos.z+player.sizes[2]*9) ||
			checkIfInAnotherCollectible(collectible)
		)
		{
			collectible.currentPos.x=generateRandomInInterval(floorLimitX1+collectible.sizes[0]+offsetFromFloorLimit,floorLimitX2-collectible.sizes[0]-offsetFromFloorLimit);
			collectible.currentPos.z=generateRandomInInterval(floorLimitZ1+collectible.sizes[2]+offsetFromFloorLimit,floorLimitZ2-collectible.sizes[2]-offsetFromFloorLimit);
		}
		
		collectible.moveToPosition();
		timeToGenerateCollectible=false;
	}
}

function generateNextCubeTimer()
{
	if(!timeToGenerateCube)
	{
		timeToGenerateCube=true;
	}
	setTimeout(generateNextCubeTimer,500);
}

function generateNextCube()
{
	if(timeToGenerateCube)
	{
		var whichSide=Math.floor(Math.random()*4);
		var distOut=2.1;
		var speed=generateRandomInInterval(0.03,0.07);
		var cube=new Cube();
		cube.generated=true;
		var color=Math.floor(Math.random()*cubeColors.length);
		cube.setColor(cubeColors[color][0],cubeColors[color][1],cubeColors[color][2],cubeColors[color][3]);
		cube.setSizes(generateRandomInInterval(0.1,0.7),generateRandomInInterval(player.sizes[1]+0.001,0.7),generateRandomInInterval(0.1,0.7));
		cube.setLimitBoundaries([floorLimitX1-distOut-0.001-cube.sizes[0],-10.0,floorLimitZ1-distOut-0.001-cube.sizes[2]],[floorLimitX2+distOut+0.001+cube.sizes[0],10.0,floorLimitZ2+distOut+0.001+cube.sizes[2]]);
		cube.currentPos.y=floorLimitY1+cube.sizes[1];
		switch(whichSide)
		{
			case 0: 
				cube.currentPos.x=floorLimitX1-distOut;
				cube.currentPos.z=generateRandomInInterval(floorLimitZ1,floorLimitZ2);
				cube.setMovement(speed,0.0,0.0);
			break;
			case 1:
				cube.currentPos.x=generateRandomInInterval(floorLimitX1,floorLimitX2);
				cube.currentPos.z=floorLimitZ1-distOut;
				cube.setMovement(0.0,0.0,speed);
			break;
			case 2:
				cube.currentPos.x=floorLimitX2+distOut;
				cube.currentPos.z=generateRandomInInterval(floorLimitZ1,floorLimitZ2);
				cube.setMovement(-speed,0.0,0.0);
			break;
			case 3:
				cube.currentPos.x=generateRandomInInterval(floorLimitX1,floorLimitX2);
				cube.currentPos.z=floorLimitZ2+distOut;
				cube.setMovement(0.0,0.0,-speed);
			break;
		}
		cube.moveToPosition();
		timeToGenerateCube=false;
	}
}

class CurrentPosition {
	x=0.0;
	y=0.0;
	z=0.0;
	setPosition(x,y,z)
	{
		this.x=x;
		this.y=y;
		this.z=z;
	}
	addToPosition(x,y,z)
	{
		this.x+=x;
		this.y+=y;
		this.z+=z;
	}
}

class Cube {
	display=true;
	generated=false;
	collectible=false;
	vertices=[
		vec4(-1.0,1.0,1.0,1.0),
		vec4(1.0,1.0,1.0,1.0),
		vec4(-1.0,-1.0,1.0,1.0),
		vec4(1.0,-1.0,1.0,1.0),
		vec4(-1.0,1.0,-1.0,1.0),
		vec4(1.0,1.0,-1.0,1.0),
		vec4(-1.0,-1.0,-1.0,1.0),
		vec4(1.0,-1.0,-1.0,1.0)
	];
	sizes=[1.0,1.0,1.0];
	movement=[0.0,0.0,0.0];
	limitBoundaries=[[-100.0,-100.0,-100.0],[100.0,100.0,100.0]];
	colors=[
		vec4(1.0,0.0,0.0,1.0),
		vec4(1.0,0.0,0.0,1.0),
		vec4(0.0,0.0,0.0,1.0),
		vec4(0.0,0.0,0.0,1.0),
		vec4(1.0,0.0,0.0,1.0),
		vec4(1.0,0.0,0.0,1.0),
		vec4(0.0,0.0,0.0,1.0),
		vec4(0.0,0.0,0.0,1.0)
	];
	indices=[
		0,2,1,
		1,2,3,
		1,3,5,
		5,3,7,
		4,5,6,
		6,5,7,
		4,6,2,
		4,2,0,
		0,1,5,
		5,4,0,
		3,2,6,
		6,7,3
		
	];
	renderTransforms=[];
	currentPos=new CurrentPosition();
	constructor()
	{
		objectsToRender.push(this);
	}

	draw()
	{
		if(this.display)
		{
			var i;
			for(i=0;i<this.indices.length;i=i+3)
			{
				points.push(this.vertices[this.indices[i]]);
				pointcolors.push(this.colors[this.indices[i]]);
				points.push(this.vertices[this.indices[i+1]]);
				pointcolors.push(this.colors[this.indices[i+1]]);
				points.push(this.vertices[this.indices[i+2]]);
				pointcolors.push(this.colors[this.indices[i+2]]);
				var t1 = subtract(this.vertices[this.indices[i+1]], this.vertices[this.indices[i]]);
				var t2 = subtract(this.vertices[this.indices[i+2]], this.vertices[this.indices[i]]);
				var normal = normalize(cross(t2, t1));
				normal = vec4(normal);
				normal[3]  = 0.0;

				normals.push(normal);
				normals.push(normal);
				normals.push(normal);
			}
		}
	}
	setColor(r,g,b,a)
	{
		var i;
		for(i=0;i<8;i++)
		{
			this.colors[i]=vec4(r,g,b,a);
		}
	}
	setSizes(x,y,z)
	{
		this.sizes[0]=x;
		this.sizes[1]=y;
		this.sizes[2]=z;
		this.doTransformation(scalem(x,y,z));
	}
	setMovement(x,y,z)
	{
		this.movement[0]=x;
		this.movement[1]=y;
		this.movement[2]=z;
	}
	setLimitBoundaries(b1,b2)
	{
		this.limitBoundaries[0]=b1;
		this.limitBoundaries[1]=b2;
	}
	addRenderTransformation(transform)
	{
		this.renderTransforms.push(transform);
	}
	doMovement()
	{
		this.moveToOrigin();
		this.currentPos.x+=this.movement[0];
		this.currentPos.y+=this.movement[1];
		this.currentPos.z+=this.movement[2];
		this.moveToPosition();
	}
	doRenderTransformations()
	{
		if(this.display)
		{
			var i,j;
			for(j=0;j<this.renderTransforms.length;j++)
			{
				for(i=0;i<this.vertices.length;i++)
				{
					this.vertices[i]=multMatWithVec(this.renderTransforms[j],this.vertices[i]);
				}
			}
		}
	}
	emptyRenderTransformations()
	{
		this.renderTransforms=[];
	}
	doTransformation(transform)
	{
		var i;
		for(i=0;i<this.vertices.length;i++)
		{
			this.vertices[i]=multMatWithVec(transform,this.vertices[i]);
		}
	}
	addMoveToPosition()
	{
		this.renderTransforms.push(transpose(translate(this.currentPos.x,this.currentPos.y,this.currentPos.z)));
	}
	addMoveToOrigin()
	{
		this.renderTransforms.push(transpose(translate(-this.currentPos.x,-this.currentPos.y,-this.currentPos.z)));
	}
	moveToPosition()
	{
		this.doTransformation(transpose(translate(this.currentPos.x,this.currentPos.y,this.currentPos.z)));
	}
	moveToOrigin()
	{
		this.doTransformation(transpose(translate(-this.currentPos.x,-this.currentPos.y,-this.currentPos.z)));
	}
	moveOnKeyboardPress()
	{
		var yMultiplier=1.5;
		this.moveToOrigin();
		if(keysPressed.includes(87)) //W
		{
			this.currentPos.z-=keyboardSensitivity;
		}
		if(keysPressed.includes(65)) //A
		{
			this.currentPos.x-=keyboardSensitivity;
		}
		if(keysPressed.includes(83)) //S
		{
			this.currentPos.z+=keyboardSensitivity;
		}
		if(keysPressed.includes(68)) //D
		{
			this.currentPos.x+=keyboardSensitivity;
		}
		if(keysPressed.includes(67)) //C
		{
			document.exitPointerLock = document.exitPointerLock    ||
					   document.mozExitPointerLock;
			document.exitPointerLock();
		}
		if(keysPressed.includes(32)) //SPACE
		{
			if(!spaceTriggered)
			{
				this.setMovement(0.0,keyboardSensitivity*yMultiplier,0.0);
			}
			if(this.currentPos.y>=this.limitBoundaries[1][1]-this.sizes[1])
			{
				spaceTriggered=true;
				this.setMovement(0.0,-keyboardSensitivity*yMultiplier,0.0);
			}
		}
		else
		{
			spaceTriggered=false;
			this.setMovement(0.0,-keyboardSensitivity*yMultiplier,0.0);
		}
		this.moveToPosition();
	}
	//do not rotate any cube
	checkCollision()
	{
		var i,j;
		var detected=[];
		var ok=false;
		for(i=0;i<objectsToRender.length;i++)
		{
			if(objectsToRender[i]!=this && objectsToRender[i].display)
			{
				ok=false;
				for(j=0;j<objectsToRender[i].vertices.length;j++)
				{
								
					if(this.vertices[6][0]<=objectsToRender[i].vertices[j][0] && objectsToRender[i].vertices[j][0]<=this.vertices[7][0])
					{
						if(this.vertices[6][1]<=objectsToRender[i].vertices[j][1] && objectsToRender[i].vertices[j][1]<=this.vertices[4][1])
						{
							if(this.vertices[6][2]<=objectsToRender[i].vertices[j][2] && objectsToRender[i].vertices[j][2]<=this.vertices[2][2])
							{
								ok=true;
							}
						}
					}
					if(objectsToRender[i].vertices[6][0]<=this.vertices[j][0] && this.vertices[j][0]<=objectsToRender[i].vertices[7][0])
					{
						if(objectsToRender[i].vertices[6][1]<=this.vertices[j][1] && this.vertices[j][1]<=objectsToRender[i].vertices[4][1])
						{
							if(objectsToRender[i].vertices[6][2]<=this.vertices[j][2] && this.vertices[j][2]<=objectsToRender[i].vertices[2][2])
							{
								ok=true;
							}
						}
					}
				}
				if(ok)
				{
					detected.push(objectsToRender[i]);
				}
			}
		}
		return detected;
	}
	limitPosition()
	{
		this.moveToOrigin();
		var ok=false;
		if(this.currentPos.x<this.limitBoundaries[0][0]+this.sizes[0])
		{
			this.currentPos.x=this.limitBoundaries[0][0]+this.sizes[0];
			ok=true;
		}
		if(this.currentPos.x>this.limitBoundaries[1][0]-this.sizes[0])
		{
			this.currentPos.x=this.limitBoundaries[1][0]-this.sizes[0];
			ok=true;
		}
		if(this.currentPos.y<this.limitBoundaries[0][1]+this.sizes[1])
		{
			this.currentPos.y=this.limitBoundaries[0][1]+this.sizes[1];
			ok=true;
		}
		if(this.currentPos.y>this.limitBoundaries[1][1]-this.sizes[1])
		{
			this.currentPos.y=this.limitBoundaries[1][1]-this.sizes[1];
			ok=true;
		}
		if(this.currentPos.z<this.limitBoundaries[0][2]+this.sizes[2])
		{
			this.currentPos.z=this.limitBoundaries[0][2]+this.sizes[2];
			ok=true;
		}
		if(this.currentPos.z>this.limitBoundaries[1][2]-this.sizes[2])
		{
			this.currentPos.z=this.limitBoundaries[1][2]-this.sizes[2];
			ok=true;
		}
		this.moveToPosition();
		return ok;
	}
}

function clearVertices()
{
	points=[];
	pointcolors=[];
	normals=[];
}

function sendToGPU()
{
	var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

	var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointcolors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	gl.uniformMatrix4fv(cameraMatrixLoc,false,flatten(cameraMatrix));
}

function restartGame()
{
	player.moveToOrigin();
	player.currentPos.setPosition(0.0,-0.04,0.0);
	player.moveToPosition();
	var i,len=0;
	for(i=0;i<objectsToRender.length;i++)
	{
		if(objectsToRender[i].generated)
		{
			len++;
		}
		else
		{
			objectsToRender.splice(i-len,len);
			i-=len;
			len=0;
		}
	}
	if(len>0)
	{
		objectsToRender.splice(i-len,len);
		len=0;
	}
}

function render()
{
	var i;
	var collided;
	var limitedPos=false;
	clearVertices();
	player.moveOnKeyboardPress();
	updatePositionJoy();
	generateNextCube();
	generateNextCollectible();
	for(i=0;i<objectsToRender.length;i++)
	{
		objectsToRender[i].doRenderTransformations();
		objectsToRender[i].doMovement();
		limitedPos=objectsToRender[i].limitPosition();
		if(limitedPos && objectsToRender[i].generated)
		{
			objectsToRender.splice(i,1);
			i--;
		}
		else
		{
			objectsToRender[i].draw();
		}
	}
	cameraMatrix=lookAt(vec3(player.currentPos.x+eye[0],player.currentPos.y+eye[1],player.currentPos.z+eye[2]),vec3(player.currentPos.x+at[0],player.currentPos.y+at[1],player.currentPos.z+at[2]),up);
	collided=player.checkCollision();
	for(i=0;i<collided.length;i++)
	{
		if(collided[i]!=player)
		{
			if(!equal(collided[i].colors[0],player.colors[0]))
			{
				if(!collided[i].collectible)
				{
					restartGame();
				}
				else
				{
					player.setColor(collided[i].colors[0][0],collided[i].colors[0][1],collided[i].colors[0][2],collided[i].colors[0][3]);
					objectsToRender.splice(objectsToRender.indexOf(collided[i]),1);
				}
			}
		}
	}
	sendToGPU();
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
	window.requestAnimFrame(render);
}
