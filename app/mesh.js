
var gl;

var smoothing = 4;
var nRows = 64;
var nColumns = 64;

analyser.fftSize = 2048;
var bufferLength = analyser.fftSize;
var dataArray = new Uint8Array(bufferLength);

var buffer = [];
var bufLen = 5;

var data = new Array(nRows);
data.fill(new Array(nColumns).fill(0));

const black = vec4(0.0, 0.0, 0.0, 1.0);
var magenta = vec4(1,1,0,1);  //magenta means use shader colors
var gridColor = magenta;


var vertexPositionAttribute;

var pointsArray = [];

var fColor;

var near = -10;
var far = 10;
var radius = 6.0;
//var theta  = -Math.PI/2;
//var phi    = -Math.PI/4;
//console.log("var theta="+theta+";\nvar phi="+phi+";")
var theta=-1.57;
var phi=-0.8727335374002834;
var dr = 5.0 * Math.PI/180.0;

var camera = {
    near: -10,
    far: 5,
    aspect: 0.7,
    fovAngle: 45,
    z: .4
}

var vertices = [], normals = [];
var indices = [];
var indexBuffer;
var verticesBuffer, normalsBuffer;

//var dx = 0.0, dy = 0.0, dz = 0.0;
//console.log("var dx="+dx+", dy="+dy+", dz="+dz+";")
var dx=-0.27497259058634904, dy=0.6095288320997905, dz=0.0008958460067709551;

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
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    canvas.width=window.innerWidth-50;
    canvas.height=window.innerHeight-50;

    gl.viewport( 0, 0, canvas.width, canvas.height );
    
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    // enable depth testing and polygon offset
    // so lines will be in front of filled triangles
    
    //gl.enable(gl.DEPTH_TEST);
    //gl.depthFunc(gl.LESS);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 2.0);

// vertex array of nRows*nColumns quadrilaterals 
// (two triangles/quad) from data

    var program = initShaders( gl, "mountain-terrain-shader", "fragment-shader" );
    gl.useProgram( program );

    vertexPositionAttribute = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);



    for(var i=0; i<nRows; i++) {
        for(var j=0; j<nColumns;j++) {
            var x=(i+1/2-nColumns/2)/(nColumns-1)*2;
            var z=(j+1/2-nRows/2)/(nRows-1)*2;
            vertices.push([x, 0, z]);
        }
    }

    //console.log(flatten(vertices));

    for(var i=0; i<nRows-1; i++) {
        for(var j=0; j<nColumns-1;j++) {
            var index=i*nColumns+j;
            indices.push([index, index+1, index+nColumns]);
            indices.push([index+1, index+nColumns+1, index+nColumns]);
        }
    }

    //indices=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    indices=flatten(indices);

    //console.log(indices);

    verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(indices)), gl.STATIC_DRAW);

    normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    //console.log(new Uint16Array(flatten(indices)));
   


    
    /*for(var i=0; i<nRows-1; i++) {
        for(var j=0; j<nColumns-1;j++) {
            pointsArray.push( [2*i/nRows-1, data[i][j], 2*j/nColumns-1, 1.0]);
            pointsArray.push( [2*(i+1)/nRows-1, data[i+1][j], 2*j/nColumns-1, 1.0]); 
            pointsArray.push( [2*(i+1)/nRows-1, data[i+1][j+1], 2*(j+1)/nColumns-1, 1.0]);
            pointsArray.push( [2*i/nRows-1, data[i][j+1], 2*(j+1)/nColumns-1, 1.0] );
        }
    }*/
    //
    //  Load shaders and initialize attribute buffers
    //
    
    

    /*vBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );*/
    
    fColor = gl.getUniformLocation(program, "fColor");

     gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
 
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
	initControls();

    render();
 
}

function initControls(){
    document.getElementById("gridLines").onchange=function(checkbox){
        //console.log(checkbox);
        if(checkbox.srcElement.checked){
            gridColor=black;
        }
        else{
            gridColor=magenta;
        }
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
                dx += Math.sin(theta) * 0.1 * Math.sin(phi);
                dy -= Math.sin(theta) * 0.1 * Math.cos(phi);
                dz += Math.sin(phi) * 0.1 * Math.cos(theta);
            }
            //down
            else if (event.keyCode == 40 || event.keyCode == 83)
            {
                event.preventDefault();
                dx -= Math.sin(theta) * 0.1 * Math.sin(phi);
                dy += Math.sin(theta) * 0.1 * Math.cos(phi);
                dz -= Math.sin(phi) * 0.1 * Math.cos(theta);
            }
            //left
            else if (event.keyCode == 37 || event.keyCode == 65)
            {
                event.preventDefault();
                dx += Math.cos(theta) * 0.1;
                dz += Math.sin(theta) * 0.1;
            }
            //right
            else if (event.keyCode == 39 || event.keyCode == 68)
            {
                event.preventDefault();
                dx -= Math.cos(theta) * 0.1;
                dz -= Math.sin(theta) * 0.1;
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

  for(var i=0;i<nRows-1;++i){
    for(var j=0;j<nColumns;j++){
        vertices[nColumns*(i)+j][1]=vertices[nColumns*(i+1)+j][1];
    }
  }
    for(var j=0;j<nColumns;j++){
        //console.log(vertices[j][1]);
        vertices[nColumns*(nRows-1)+j][1]=line[j];
    }

  //console.log(line);
  
    //data.shift();
    //data.push(newArray.slice(0,nColumns));

    /*var data2  = data.map(function(arr) {
                            return arr.slice();
                          });*/

    /*function smoothArray( values, smoothing ){
      for(var j=0;j<values[0].length;++j){
          var value = values[0][j]; // start with the first input
          for (var i=1, len=values.length; i<len; ++i){
            var currentValue = values[i][j];
            value += (currentValue - value) / smoothing;
            values[i][j] = value;
          }
      }
    }

    function smoothArray2( values, smoothing ){
      for(var j=0;j<values.length;++j){
          var value = values[j][0]; // start with the first input
          for (var i=1, len=values[j].length; i<len; ++i){
            var currentValue = values[j][i];
            value += (currentValue - value) / (smoothing/2);
            values[j][i] = value;
          }
          value = values[j][values[j].length-1];
          for (var i=values[j].length-2; i>=0; --i){
            var currentValue = values[j][i];
            value += (currentValue - value) / (smoothing/2);
            values[j][i] = value;
          }
      }
    }*/

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

    //smoothArray(data2, smoothing);
    //smoothArray2(data2, 3);
    //data2 = data2.slice(smoothing, data2.length-smoothing);

    /*pointsArray = [];
    for(var i=0; i<nRows-1; i++) {
        for(var j=0; j<nColumns-1;j++) {
            pointsArray.push( [2*i/nRows-1,     shift+scale*data[i][j],     2*j/nColumns-1,      camera.z]);
            pointsArray.push( [2*(i+1)/nRows-1, shift+scale*data[i+1][j],   2*j/nColumns-1,      camera.z]); 
            pointsArray.push( [2*(i+1)/nRows-1, shift+scale*data[i+1][j+1], 2*(j+1)/nColumns-1,  camera.z]);
            pointsArray.push( [2*i/nRows-1,     shift+scale*data[i][j+1],   2*(j+1)/nColumns-1,  camera.z]);
        }
    }*/

    /*gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );

    gl.bufferSubData( gl.ARRAY_BUFFER, 0, flatten(pointsArray));


    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);*/

    var eye = [ radius*Math.sin(theta)*Math.cos(phi) + dx, 
                radius*Math.sin(theta)*Math.sin(phi) + dy,
                radius*Math.cos(theta) + dz] ;
    var at = [dx, dy, dz];

    modelViewMatrix = lookAt( eye, at, up );
    projectionMatrix = perspective(camera.fovAngle, camera.aspect, camera.near, camera.far);

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    
    // draw each quad as two filled red triangles
    // and then as two black line loops
    var currentMax = 0;
   /* for (var m = 0; m < pointsArray.length; m++){
        
        //res =  Math.max.apply(pointsArray[m].map(function(o) {return o[2]}));
        //console.log(res);
    }*/

    //console.log(flatten(indices));
    gl.uniform4fv(fColor, flatten(magenta));
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(vertices));
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    //gl.drawElements(gl.POINTS, indices.length, gl.UNSIGNED_SHORT, 0);
    
    /*
    for(var i=0; i<pointsArray.length; i+=4) {
        gl.uniform4fv(fColor, flatten(magenta));
        gl.drawArrays( gl.TRIANGLE_FAN, pointsArray.length-4-i, 4 );
        gl.uniform4fv(fColor, flatten(gridColor));        
        gl.drawArrays( gl.LINE_LOOP, pointsArray.length-4-i, 4 );
    }*/

    requestAnimFrame(render);
}