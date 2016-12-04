
var gl;

var nRows = 50;
var nColumns = 50;

// data for radial hat function: sin(Pi*r)/(Pi*r)

var data = [];
for( var i = 0; i < nRows; ++i ) {
    data.push( [] );
    var x = Math.PI*(4*i/nRows-2.0);
    
    for( var j = 0; j < nColumns; ++j ) {
        var y = Math.PI*(4*j/nRows-2.0);
        var r = Math.sqrt(x*x+y*y);
        
        // take care of 0/0 for r = 0
        
        data[i][j] = Math.sin(i/5+Math.random()/10)*Math.cos(j/5+Math.random()/10)/2+Math.random()/20;
    }
}


var pointsArray = [];

var fColor;

var near = -10;
var far = 10;
var radius = 6.0;
var theta  = -Math.PI/2;
var phi    = -Math.PI/4;
var dr = 5.0 * Math.PI/180.0;

var camera = {
    near: -10,
    far: 5,
    aspect: 1,
    fovAngle: 45,
    z: 1
}

const black = vec4(0.0, 0.0, 0.0, 1.0);
const red = vec4(1.0, 0.0, 0.0, 1.0);
var dx = 0.0, dy = 0.0, dz = 0.0;
var at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var left = -1.0;
var right = 1.0;
var ytop = 2.0;
var bottom = 0;

var modelViewMatrixLoc, projectionMatrixLoc;

var vBufferId;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    // enable depth testing and polygon offset
    // so lines will be in front of filled triangles
    
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 2.0);

// vertex array of nRows*nColumns quadrilaterals 
// (two triangles/quad) from data
    
    for(var i=0; i<nRows-1; i++) {
        for(var j=0; j<nColumns-1;j++) {
            pointsArray.push( vec4(2*i/nRows-1, data[i][j], 2*j/nColumns-1, 1.0));
            pointsArray.push( vec4(2*(i+1)/nRows-1, data[i+1][j], 2*j/nColumns-1, 1.0)); 
            pointsArray.push( vec4(2*(i+1)/nRows-1, data[i+1][j+1], 2*(j+1)/nColumns-1, 1.0));
            pointsArray.push( vec4(2*i/nRows-1, data[i][j+1], 2*(j+1)/nColumns-1, 1.0) );
    }
}
    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    vBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    fColor = gl.getUniformLocation(program, "fColor");
 
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
	initControls();

    render();
 
}

function initControls(){
    // buttons for moving viewer and changing size
/*    document.getElementById("Theta+").onclick = function(){theta += dr;};
    document.getElementById("Theta-").onclick = function(){theta -= dr;};
    document.getElementById("Phi+").onclick = function(){phi += dr;};
    document.getElementById("Phi-").onclick = function(){phi -= dr;};
    document.getElementById("Wide").onclick = function(){left  *= 0.9; right *= 0.9;};
    document.getElementById("Narrow").onclick = function(){left *= 1.1; right *= 1.1;};
    document.getElementById("Tall").onclick = function(){ytop  *= 0.9; bottom *= 0.9;};
    document.getElementById("Short").onclick = function(){ytop *= 1.1; bottom *= 1.1;};
*/    //Keydown Event listener, binds arrow keys to rotation
    keyHandler();
}
function keyHandler(){
    document.addEventListener('mousewheel', function(event)
    {
        event.preventDefault();
        if (event.deltaY > 0) camera.z += 0.1;
        else camera.z -= 0.1;        
    })
    document.addEventListener('keydown', function(event)
    {
        event = event || window.event;
        if (event.ctrlKey)
        {
            event.preventDefault();
            switch (event.keyCode)
            {
                case 37 || 65: //left arrow
                    theta -= dr;
                    break;
                case 39 || 68: //right arrow
                    theta += dr;
                    break;
                case 38 || 87: //up arrow
                    phi += dr;
                    break;
                case 40 || 83: //down arrow
                    phi -= dr;
                    break;
                default:
                    break;
            }
        }
        else
        {
            //up
            if (event.keyCode == 38 || event.keyCode == 87)
            {
                event.preventDefault();
                dx -= Math.sin(theta) * 0.1 * Math.sin(phi);
                dy += Math.sin(theta) * 0.1 * Math.cos(phi);
                dz -= Math.sin(phi) * 0.1 * Math.cos(theta);
                at[0] = dx;
                at[1] = dy;
                at[2] = dz;
            }
            //down
            else if (event.keyCode == 40 || event.keyCode == 83)
            {
                event.preventDefault();
                dx += Math.sin(theta) * 0.1 * Math.sin(phi);
                dy -= Math.sin(theta) * 0.1 * Math.cos(phi);
                dz += Math.sin(phi) * 0.1 * Math.cos(theta);
                at[0] = dx;
                at[1] = dy;
                at[2] = dz;
            }
            //left
            else if (event.keyCode == 37 || event.keyCode == 65)
            {
                event.preventDefault();
                dx -= Math.cos(theta) * 0.1;
                dz -= Math.sin(theta) * 0.1;

                at[0] = dx;
                at[2] = dz;
            }
            //right
            else if (event.keyCode == 39 || event.keyCode == 68)
            {
                event.preventDefault();
                dx += Math.cos(theta) * 0.1;
                dz += Math.sin(theta) * 0.1;
                at[0] = dx;
                at[2] = dz;
            }
       }
});
}
function degToRad(degrees){
	return degrees * Math.PI / 180;
}
function radToDeg(r){
	return r * 180 / Math.PI;
}
var count = 0;

function render()
{
  var canvas = document.getElementById( "gl-canvas" );
  canvas.width  = window.innerWidth-20;
  canvas.height = window.innerHeight-150;

  if(count==2){
        data.push(data.shift());
        count=0;
    }
    count++;

    pointsArray = [];
    for(var i=0; i<nRows-1; i++) {
        for(var j=0; j<nColumns-1;j++) {
            pointsArray.push( vec4(2*i/nRows-1, data[i][j]*((i)/nRows)+Math.sin(Math.PI*(i/nRows))/2, 2*j/nColumns-1, camera.z));
            pointsArray.push( vec4(2*(i+1)/nRows-1, data[i+1][j]*((i)/nRows)+Math.sin(Math.PI*((i+1)/nRows))/2, 2*j/nColumns-1, camera.z)); 
            pointsArray.push( vec4(2*(i+1)/nRows-1, data[i+1][j+1]*((i)/nRows)+Math.sin(Math.PI*((i+1)/nRows))/2, 2*(j+1)/nColumns-1, camera.z));
            pointsArray.push( vec4(2*i/nRows-1, data[i][j+1]*((i)/nRows)+Math.sin(Math.PI*(i/nRows))/2, 2*(j+1)/nColumns-1, camera.z) );
        }
    }

    gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );
    gl.bufferSubData( gl.ARRAY_BUFFER, 0, flatten(pointsArray));


    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye = vec3( radius*Math.sin(theta)*Math.cos(phi) + dx, 
                    radius*Math.sin(theta)*Math.sin(phi) + dy,
                    radius*Math.cos(theta) + dz) ;

    modelViewMatrix = lookAt( eye, at, up );
    projectionMatrix = perspective(camera.fovAngle, camera.aspect, camera.near, camera.far);

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    
    // draw each quad as two filled red triangles
    // and then as two black line loops
    
    for(var i=0; i<pointsArray.length; i+=4) { 

        gl.uniform4fv(fColor, flatten(red));
        gl.drawArrays( gl.TRIANGLE_FAN, i, 4 );
        gl.uniform4fv(fColor, flatten(black));
        gl.drawArrays( gl.LINE_LOOP, i, 4 );
    }
    

    requestAnimFrame(render);
}