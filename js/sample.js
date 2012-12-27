//fcts
var drawLogo = function() {
  
  var nexamples = 4;
  var batch = d3.select("#batch");
  
  for(var i = 0; i<nexamples; i++) {
    var newDiv = batch.append("div")
      .attr("class", "batch_instance")
      .attr("id", "batch_" + formatter(i));
    var rndData = perturbData(1/2);
    drawLogo(width/2, height/2, clippingRadius/2, newDiv, rndData);
  
  }

};

//exec

console.log('Setup');

var width = 600
    height = 600
    padding = 0;
    
var color = d3.scale.category20();
var imgPath = 'img/2621.JPG';

var svg = d3.select('#image')
          .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('id', 'imageSVG');

    svg.append('g')
        .attr('id', 'imageGroup')
      .append('svg:img')
        .attr('x', 0)
        .attr('y', 0)      
        .attr('width', 300)
        .attr('height', 300)
        .attr('xlink:href', imgPath);
        
        
            
            
            /*.append('svg:image')
      .attr('x', function(d) {return d.x-d.scale/2;})
      .attr('y', function(d) {return d.y-d.scale/2;})
      .attr("class", "dot")
      .attr("clip-path", "url(#"+ visdiv[0][0].id + "_clipper)")
      .attr('width', function(d) {return d.scale;})
      .attr('height', function(d) {return d.scale;})
      .attr('xlink:href', function(d, i){return "images/" + (i+1) + ".png";});
      */



//drawLogo(width, height, clippingRadius, demoDiv, anchorPoints);