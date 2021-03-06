//fcts
function dragmove(d) {
  //update
  arcOrigin.x += d3.event.dx;
  arcOrigin.y += d3.event.dy;
  d3.select('#theClipPath')
      .attr("transform", "translate(" + (arcOrigin.x) + "," + (arcOrigin.y) + ")");
  d3.select('#refGroup')
    .attr("transform", "translate(" + (arcOrigin.x) + "," + (arcOrigin.y) + ")");
  d3.select('#atom')
    .attr('transform', 'translate(' + (-arcOrigin.x) + ',' + (-arcOrigin.y) +')');
  d3.select('#theKaleidoImage')
    .attr('y',  (-arcOrigin.y))
    .attr('x',  (-arcOrigin.x));
      //.attr("cy", d.y = Math.max(radius, Math.min(height - radius, d3.event.y)));
}

function addImage(parentTag, name) {

    return parentTag.append('svg:image')
      .attr('id', 'theImage')
      .attr('x', 0)
      .attr('y', 0)
      .attr("class", "dot")
      .attr('width', width)
      .attr('height', height)
      .attr('opacity', .5)
      .attr('xlink:href', imgPath);

}

function addPath(parentTag, name) {
  return parentTag.selectAll('path').data([arcObj])
    .enter().append('path')
          .attr('id', name)
          .attr('class', 'geom')
          .attr('d', function(d) {return arc(d);});
}

function addClipPath(parentTag, name) {

var toReturn = parentTag.append('clipPath')
                      .attr('id', name);


    addPath(toReturn, '');                   

}

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

//define what path for clipping
var pieAngle = Math.PI/4;
var pieStartAngle = Math.PI/2;
var arcOrigin = {x: width/5, y:height/4};
var arc = d3.svg.arc();
var arcObj = {innerRadius: 0,
              outerRadius: 200,
              startAngle: pieStartAngle,
              endAngle: pieStartAngle+pieAngle};


//ACTUAL DIV//
//add image with no transformation
var svg = d3.select('#image')
          .append('svg')
            .attr('width', width)
            .attr('height', height);

addImage(svg, 'imageMain');
//draw path for reference
var tempGroup = svg.append('g')
    .attr("transform", "translate(" + (arcOrigin.x) + "," + (arcOrigin.y) + ")");
addPath(tempGroup, 'refPath');


//add clipped image
var clipImage = addImage(svg, 'clippedImage');
//add clipping path
tempGroup = svg.append('g')
    .attr("transform", "translate(" + (arcOrigin.x) + "," + (arcOrigin.y) + ")");
addClipPath(tempGroup, 'myClipper');

clipImage.attr('clip-path', 'url(#myClipper)');

//MIRROR DIV//
var groupMirror = d3.select('#mirrorsample')
          .append('svg')
            .attr('width', width)
            .attr('height', height)
          .append('g')
            .attr('transform', 'scale(1,-1) translate(0, ' + (-height) + ')');


addImage(groupMirror, 'imageMirror');
//draw clipping path for reference
tempGroup = groupMirror.append('g')
    .attr("transform", "translate(" + (arcOrigin.x) + "," + (arcOrigin.y) + ")");
addPath(tempGroup, 'refPathMirror');



/*
//add clipped image
svg.append('svg:use')
    .attr('id', 'wedge')
    .attr('xlink:href', '#theImage')
    .attr('opacity', 1)
    .attr('clip-path', 'url(#theClipPath)')
    .call(drag);

//mirrored//
//sampler setup//
var mSvgGroup = d3.select('#mirrorsample')
          .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('id', 'kSvg')
          .append('g')
            .attr('transform', 'scale(1,-1) translate(0, -' +height +')');

mSvgGroup.append('svg:image')
  .attr('id', 'theKaleidoImage')
  .attr('x', 0)
  .attr('y', 0)
  .attr("class", "dot")
  .attr('width', width)
  .attr('height', height)
  .attr('xlink:href', imgPath);

/*

var clipTag = defsTag.append('clipPath')
                      .attr('id', 'theClipPath')
                      .attr("transform", "translate(" + (arcOrigin.x) + "," + (arcOrigin.y) + ")");

clipTag.selectAll('path').data([arcObj])
  .enter().append('path')
        .attr('class', 'geom')
        .attr('d', function(d) {return arc(d);});

var arcObjRefl = {innerRadius: 0,
              outerRadius: 200,
              startAngle: (pieStartAngle-pieAngle),
              endAngle: pieStartAngle};

var clipTagRefl = kSvg.append('clipPath')
                  .attr('id', 'theKaleidoClipPathRefl');

clipTagRefl.selectAll('path').data([arcObjRefl])
  .enter().append('path')
        .attr('class', 'geom')
        .attr('d', function(d) {return arc(d);});



var clipTag = kSvg.append('clipPath')
                  .attr('id', 'theKaleidoClipPath');

clipTag.selectAll('path').data([arcObj])
  .enter().append('path')
        .attr('class', 'geom')
        .attr('d', function(d) {return arc(d);});

kSvg.append('svg:image')
  .attr('id', 'theKaleidoImage')
  .attr('x', (-arcOrigin.x))
  .attr('y', (-arcOrigin.y))
  .attr("class", "dot")
  .attr('width', width)
  .attr('height', height)
  .attr('xlink:href', imgPath)
  .attr('clip-path', 'url(#theKaleidoClipPath)');

var groupRefl = kSvg.append('g')
                    .attr('transform', 'scale(1,-1)');


groupRefl.append('svg:image')
  .attr('id', 'theKaleidoImageRefl')
  .attr('x', (-arcOrigin.x))
  .attr('y', (-arcOrigin.y))
  .attr('opacity', .5)
  .attr("class", "dot")
  .attr('width', width)
  .attr('height', height)
  .attr('xlink:href', imgPath)
  .attr('clip-path', 'url(#theKaleidoClipPathRefl)');

/*
kSvg.append('svg:use')
    .attr('id', 'rot1')
    .attr('transform', 'rotate(45)')
    .attr('xlink:href', '#theKaleidoImage');

kSvg.append('g')
  .attr('transform', 'scale(1,-1)')
    .append('svg:use')
    .attr('id', 'refl1')
    .attr('xlink:href', '#theKaleidoImage');

/*
var kGroup = kSvg.append('g')
      .attr('id', 'kGroupSeed')
      .attr('transform', 'translate(' + ((width/2)) + ',' + ((height/2)) +')');

    kGroup.append('svg:use')
      .attr('id', 'atom')
      .attr('transform', 'translate(' + (-arcOrigin.x) + ',' + (-arcOrigin.y) + ')')
      .attr('xlink:href', '#wedge');

    kGroup.append('svg:use')
      .attr('transform', 'rotate(45)')
      .attr('xlink:href', '#atom');

  kGroup.append('svg:use')
      .attr('transform', 'scale(1,-1)')
      .attr('xlink:href', '#atom');


/*
    kGroup.append('svg:use')
      .attr('transform', 'translate(0, ' + (2*arcOrigin.y) + ') scale(1,-1)')
      .attr('xlink:href', '#kGroupSeed');
*/
/*
  kGroup.append('g')
      .attr('id', 'kGroupAggr')
      .attr('transform', 'rotate(45)')
    .append('svg:use')
      .attr('xlink:href', '#kGroupSeed');

*/

/*

    kGroup.append('svg:use')
      .attr('transform', 'translate(0, ' + (height) + ') scale(1,-1)')
      .attr('xlink:href', '#kGroupSeed');


    kSvg.append('g')
      .attr('id', 'kGroupAggr')
      .attr('transform', 'rotate(45,' + width/2 + ',' + height/2 + ')')
    .append('svg:use')
      .attr('xlink:href', '#kGroupSeed');
*/













        
        
            
    