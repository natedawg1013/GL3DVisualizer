
var gl;

var smoothing = 4;
var nRows = 64;
var nColumns = 64;

analyser.fftSize = 2048;
var bufferLength = analyser.fftSize;
var dataArray = new Uint8Array(bufferLength);

var buffer = [];
var bufLen = 5;

var ground=true;
var groundColor=true;
var grid=false;
var gridColor=false;
var points=false;
var pointsColor=false;
var lighting=false;
var squareMesh=false;

var data = new Array(nRows);
data.fill(new Array(nColumns).fill(0));

const black = vec4(0.0, 0.0, 0.0, 1.0);
var magenta = vec4(1,1,0,1);  //magenta means use shader colors


var vertexPositionAttribute, normalAttribute;

var program;

var pointsArray = [];

var fColor;

var near = -10;
var far = 10;
var radius = 6.0;
//var theta  = -Math.PI/2;
//var phi    = -Math.PI/4;
//console.log("var theta="+theta+";\nvar phi="+phi+";")
var theta=1.57;
var phi=0.25;
var dr = 0.5 * Math.PI/180.0;

var camera = {
    near: 0.1,
    far: 15,
    aspect: 0.7,
    fovAngle: 45,
    z: 3.0
}
var controls = {
    IDLE: 0,
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4,
    YAWUP: 5,
    YAWDOWN: 6,
    PITCHUP: 7,
    PITCHDOWN: 8
}
var state = controls.IDLE;

var vertices = [], normals = [];
var indices = [], meshIndices = [];
var indexBuffer, meshIndexBuffer;
var verticesBuffer, normalsBuffer;

//var dx = 0.0, dy = 0.0, dz = 0.0;
//console.log("var dx="+dx+", dy="+dy+", dz="+dz+";")
var dx=-0.275, dy=0.61, dz=0;

const up = vec3(0.0, 1.0, 0.0);

var modelViewMatrixLoc, projectionMatrixLoc;

var vBufferId;

window.onresize = function resize(){
    var canvas = document.getElementById( "gl-canvas" );
    canvas.width=window.innerWidth-50;
    canvas.height=window.innerHeight-50;
    gl.viewport( 0, 0, canvas.width, canvas.height );
    console.log(canvas.width + "," + canvas.height)
}

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    document.getElementById("gridCheck").checked=grid;
    document.getElementById("groundCheck").checked=ground;
    document.getElementById("pointsCheck").checked=points;
    document.getElementById("gridColor").checked=gridColor;
    document.getElementById("groundColor").checked=groundColor;
    document.getElementById("pointsColor").checked=pointsColor;
    document.getElementById("lightingCheck").checked=lighting;

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    canvas.width=window.innerWidth-50;
    canvas.height=window.innerHeight-50;

    gl.viewport( 0, 0, canvas.width, canvas.height );
    
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    // enable depth testing and polygon offset
    // so lines will be in front of filled triangles
    
    gl.enable(gl.DEPTH_TEST);
    //gl.depthFunc(gl.LESS);
    //gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 2.0);

// vertex array of nRows*nColumns quadrilaterals 
// (two triangles/quad) from data

    program = initShaders( gl, "mountain-terrain-shader", "fragment-shader" );
    gl.useProgram( program );

    vertexPositionAttribute = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);

    normalAttribute = gl.getAttribLocation(program, "vNormal");
    gl.enableVertexAttribArray(normalAttribute);

    for(var i=0; i<nRows; i++) {
        for(var j=0; j<nColumns;j++) {
            var x=(i+1/2-nColumns/2)/(nColumns-1)*2;
            var z=(j+1/2-nRows/2)/(nRows-1)*2;
            vertices.push([x, 0, z]);
            normals.push([0,1,0]);
        }
    }
    for(var i=0; i<nRows-1; i++) {
        for(var j=0; j<nColumns-1;j++) {
            var index=i*nColumns+j;
            indices.push([index, index+1, index+nColumns]);
            indices.push([index+1, index+nColumns+1, index+nColumns]);            
        }
    }

    for(var i=0; i<nRows-1; i++) {
        for(var j=0; j<nColumns-1;j++) {
            var index=i*nColumns+j;
            indices.push([index, index+1, index+nColumns]);
            indices.push([index+1, index+nColumns+1, index+nColumns]);            
        }
    }

    for(var i=0; i<nRows-1; i++) {
        for(var j=0; j<nColumns-1;j++) {
            var index=i*nColumns+j;
            meshIndices.push([index,index+nColumns, index+nColumns+1,  index+1]);      
        }
    }

    indices=flatten(indices);
    meshIndices = flatten(meshIndices);

    verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(indices)), gl.STATIC_DRAW);

    meshIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(meshIndices)), gl.STATIC_DRAW);

    normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    
    fColor = gl.getUniformLocation(program, "fColor");
 
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
	initControls();

    render();
 
}
function calculateSurfaceNormals(a, b, c)
{
    var normal, u ,v;
    u = subtractVectors(a, b);
    v = subtractVectors(a, c); 
    normal = cross(u, v);
    return normal;
}
function crossVec(u, v)
{
    var normal = [];
    normal[0] = (u[1] * v[2]) - (u[2] * v[1]);
    normal[1] = (u[2] * v[0]) - (u[0] * v[2]);
    normal[2] = (u[0] * v[1]) - (u[1] * v[0]);
    return normal;
}
function subtractVectors(a,b)
{
    var res = new Array();
    for (var i = 0; i < a.length; i++){
        res[i] = a[i] - b[i];
    }
    //console.log(res);
    return res;
}
function normalizeArray(arr)
{
    var magnitude = 0.0;
    for (var i = 0; i < arr.length; i++){
        magnitude += arr[i];
    }
    magnitude /= Math.sqrt(magnitude);

}
function initControls()
{
    document.getElementById("gridCheck").onchange=function(checkbox){
        if(checkbox.srcElement.checked) grid=true;
        else grid=false;
    }
    document.getElementById("groundCheck").onchange=function(checkbox){
        if(checkbox.srcElement.checked) ground=true;
        else ground=false;
    }
    document.getElementById("pointsCheck").onchange=function(checkbox){
        if(checkbox.srcElement.checked) points=true;
        else points=false;
    }
    document.getElementById("gridColor").onchange=function(checkbox){
        if(checkbox.srcElement.checked) gridColor=true;
        else gridColor=false;
    }
    document.getElementById("groundColor").onchange=function(checkbox){
        if(checkbox.srcElement.checked) groundColor=true;
        else groundColor=false;
    }
    document.getElementById("pointsColor").onchange=function(checkbox){
        if(checkbox.srcElement.checked) pointsColor=true;
        else pointsColor=false;
    }
    document.getElementById("lightingCheck").onchange=function(checkbox){
        if(checkbox.srcElement.checked) lighting=true;
        else lighting=false;
    }
    keyHandler();
}
function keyHandler(){
    document.addEventListener('mousewheel', function(event)
    {
        event.preventDefault();
        if (event.deltaY > 0) camera.z += 0.1;
        else camera.z -= 0.1;        
    })
    document.addEventListener('keyup', function(event)
    {
        state = controls.IDLE;
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
                    state = controls.YAWDOWN;
                    //theta -= dr;
                    break;
                case 39 || 68: //right arrow
                    state = controls.YAWUP;
                   // theta += dr;
                    break;
                case 38 || 87: //up arrow
                    state = controls.PITCHUP;
                  //  phi += dr;
                    break;
                case 40 || 83: //down arrow
                    state = controls.PITCHDOWN;
                 //   phi -= dr;
                    break;
                default:
                    break;
            }
        }
        else
        {
            //up
            switch(event.keyCode){
                case 38 || 87:
                    event.preventDefault();
                    state = controls.UP;

                    break;
                case 40 || 83:
                    event.preventDefault();
                    state = controls.DOWN;
                    
                    break;
                case 37 || 65:
                    event.preventDefault();
                    state = controls.LEFT;

                    break;
                case 39 || 68:
                    event.preventDefault();
                    state = controls.RIGHT;

                    break;


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
function renderControls(){
    switch(state){
        case controls.UP:
            dx += Math.sin(theta) * 0.01 * Math.sin(phi);
            dy -= Math.sin(theta) * 0.01 * Math.cos(phi);
            dz += Math.sin(phi) * 0.01 * Math.cos(theta);
            break;
        case controls.DOWN:
            dx -= Math.sin(theta) * 0.01 * Math.sin(phi);
            dy += Math.sin(theta) * 0.01 * Math.cos(phi);
            dz -= Math.sin(phi) * 0.01 * Math.cos(theta);
            break;
        case controls.LEFT:
            dx += Math.cos(theta) * 0.01;
            dz += Math.sin(theta) * 0.01;
            break;
        case controls.RIGHT:
            dx -= Math.cos(theta) * 0.01;
            dz -= Math.sin(theta) * 0.01;
            break;
        case controls.PITCHUP:
            phi += dr;
            break;
        case controls.PITCHDOWN:
            phi -= dr;
            break;
        case controls.YAWUP:
            theta += dr;
            break;
        case controls.YAWDOWN:
            theta -= dr;
            break;
        default:
            break;
      }
}
function render()
{
  gl.clearColor(.5,.5,.9,1.0)
  analyser.getByteTimeDomainData(dataArray);
  var newArray = new Array(nColumns);
  newArray.fill(0);
  var factor = (dataArray.length)/nColumns;

  for(var i=0;i<dataArray.length;i++){
    newArray[Math.floor(i/factor)]+=((dataArray[i]-127)/255);
  } 
  for(var i=0;i<64;i++){
    newArray[i]/=factor;
  }
  renderControls();
  buffer.push(newArray);
  if(buffer.length>bufLen) buffer.shift();

  var line = Array(buffer[0].length);
  line.fill(0.0);

  
  for(var i=0;i<buffer[0].length;i++){
    for(var j=0;j<buffer.length;j++){
        line[i]+=buffer[j][i]/(Math.abs(j-buffer.length/2));
    }
    line[i]/=buffer.length;
  }

  //data.shift();
  //data.push(line);

  for(var i=nRows-2;i>=0;--i){
    for(var j=0;j<nColumns;j++){
        vertices[nColumns*(i+1)+j][1]=vertices[nColumns*(i)+j][1];
        
    }
  }
    for(var j=0;j<nColumns;j++){
        //console.log(vertices[j][1]);
        vertices[j][1]=line[j];
    }
    var vertexFlag= new Array(vertices.length);
    for (var k=0;k < indices.length;k+=3){
        var v1 = vertices[indices[k]],
            v2 = vertices[indices[k+1]],
            v3 = vertices[indices[k+2]];
        //if(vertexFlag[indices[k]]!=1){
            normals[indices[k]]=calculateSurfaceNormals(v1,v2,v3);
            vertexFlag[indices[k]]=1;
        //}
    }


    function remSS(values){
        for(var i=0;i<values.length;i++){
            var total=0;
            var count=0;
            for(var j=0;j<values[i].length;j++){
                total+=values[i][j];
                count++;
            }
            var avg=total/count;
            //console.log(avg);
            for(var j=0;j<values[i].length;j++){
                values[i][j]-=avg;
            }
        }
    }

    remSS(data);
    var scale = 1.5;
    var shift = 0.1;


    var eye = [ camera.z*Math.sin(theta)*Math.cos(phi) + dx, 
                camera.z*Math.sin(theta)*Math.sin(phi) + dy,
                camera.z*Math.cos(theta) + dz] ;
    var at = [dx, dy, dz];

    modelViewMatrix = lookAt( eye, at, up );
    projectionMatrix = perspective(camera.fovAngle, camera.aspect, camera.near, camera.far);

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    
    // draw each quad as two filled triangles
    // and then as two black line loops
    //console.log(flatten(indices));
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices));
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(normals));
    gl.vertexAttribPointer(normalAttribute, 3, gl.FLOAT, false, 0, 0);    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var isGround = gl.getUniformLocation(program, "ground");
    var lightingOn = gl.getUniformLocation(program, "lighting");
    gl.uniform1i( lightingOn, lighting );


    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(ground){
        if(groundColor)
            gl.uniform4fv(fColor, flatten(magenta));
        else
            gl.uniform4fv(fColor, flatten(black));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.uniform1i( isGround, true );
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    if(grid){
        if(gridColor)
            gl.uniform4fv(fColor, flatten(magenta));
        else
            gl.uniform4fv(fColor, flatten(black));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshIndexBuffer);
        gl.uniform1i( isGround, false );
        for(var i=meshIndices.length-4;i>=0;i-=4)
            gl.drawElements(gl.LINE_LOOP, 4, gl.UNSIGNED_SHORT, i*2);
        
    }
    
    if(points){
        if(pointsColor)
            gl.uniform4fv(fColor, flatten(magenta));
        else
            gl.uniform4fv(fColor, flatten(black));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.uniform1i( isGround, false );
        gl.drawElements(gl.POINT, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    requestAnimFrame(render);
}
