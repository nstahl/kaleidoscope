//fcts


//exec

console.log('Setup');

var width = 500,
    height = 500,
    padding = 0;

var drag = d3.behavior.drag()
    .origin(arcOrigin)
    .on("drag", dragmove);
    
var color = d3.scale.category20();
var imgPath = "data/2621.JPG";

var svg = d3.select('#image')
          .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('id', 'imageSVG');

//add def tag
var defsTag = svg.append('defs');


var srcImage = svg.append('g')
      .attr('id', 'imageGroup')
      .attr('opacity', .5)
      .attr("transform", "translate(" + (padding/2) + "," + (padding/2) + ")")
    .append('svg:image')
      .attr('id', 'theImage')
      .attr('x', 0)
      .attr('y', 0)
      .attr("class", "dot")
      .attr('width', width)
      .attr('height', height)
      
      .attr('xlink:href', imgPath);

//define what path for clipping
var arcOrigin = {x: width/3, y:height/3};
var arc = d3.svg.arc();
var arcObj = {innerRadius: 0,
              outerRadius: 200,
              startAngle: Math.PI/2,
              endAngle: 3*Math.PI/4};


var pathTag = defsTag.selectAll('path').data([arcObj])
  .enter().append('path')
        .attr('id', 'arcPath')
        .attr('class', 'geom')
        .attr('d', function(d) {return arc(d);});

var clipTag = defsTag.append('clipPath')
                      .attr('id', 'theClipPath')
                      .attr("transform", "translate(" + (arcOrigin.x) + "," + (arcOrigin.y) + ")");

clipTag.selectAll('path').data([arcObj])
  .enter().append('path')
        .attr('class', 'geom')
        .attr('d', function(d) {return arc(d);});

//draw clipping path for reference
svg.append('g')
    .attr('id', 'refGroup')
    .attr("transform", "translate(" + (arcOrigin.x) + "," + (arcOrigin.y) + ")")
  .append('svg:use')
    .attr('xlink:href', '#arcPath')
    .attr('class', 'geom');


//add clipped image
svg.append('svg:use')
    .attr('xlink:href', '#theImage')
    .attr('opacity', 1)
    .attr('clip-path', 'url(#theClipPath)')
    .call(drag);

function dragmove(d) {
  arcOrigin.x += d3.event.dx;
  arcOrigin.y += d3.event.dy;
  d3.select('#theClipPath')
      .attr("transform", "translate(" + (arcOrigin.x) + "," + (arcOrigin.y) + ")");
  d3.select('#refGroup')
    .attr("transform", "translate(" + (arcOrigin.x) + "," + (arcOrigin.y) + ")");
      //.attr("cy", d.y = Math.max(radius, Math.min(height - radius, d3.event.y)));
}





        
        
            
    