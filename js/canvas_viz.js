function updateCanvas() {

    context.clearRect(0, 0, canvas.width, canvas.height);
    draw(imageObj);
    }

    function drawClipping(image) {

       //draw arc
      context.beginPath();
      context.moveTo(0,0);
      context.arc(0,0, radius, startAngle, endAngle);
      context.closePath();

      context.clip();
      context.drawImage(image, imageOrigin.x, imageOrigin.y, image.width/4, image.height/4);
      

    }
    function draw(image) {

      var wedgeAngle = Math.abs(endAngle-startAngle);
      var rotations = Math.PI/wedgeAngle;
      context.save();
      for(var j=0; j<rotations; j++) {
        context.save();
        context.rotate(2*wedgeAngle)
        for(var i=0; i<2;i++) {
          context.save();
          context.scale(1,Math.pow(-1, i));
          drawClipping(image);
          context.restore();
        }
      }
    context.restore();
    }
      //setup
      var canvas = document.getElementById('kaleidoCanvas');
      var context = canvas.getContext('2d');
      var x = canvas.width / 2;
      var y = canvas.height / 2;
      var radius = x;
      var startAngle = 0;
      var endAngle = Math.PI/4;
      var counterClockwise = false;
      var imageOrigin = {x: -20, y:-20};

      //center kaleidoscope
      context.save();
      context.translate(x,y);

      var imageObj = new Image();

      imageObj.onload = function() {
        draw(imageObj);
      };
      imageObj.src = 'data/2621.JPG';
    