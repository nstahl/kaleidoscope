// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas element
    const kaleidoscopeCanvas = document.getElementById('kaleidoscope_canvas');
    // Create an offscreen canvas

    const offscreenCanvas = new OffscreenCanvas(
                                    kaleidoscopeCanvas.width, 
                                    kaleidoscopeCanvas.height);

    // source image
    let sourceImage = new Image();

    const tileWidth = 200;

    // Check if the browser supports canvas
    if (kaleidoscopeCanvas.getContext) {
        setupKaleidoscope();
        loadImage();
    } else {
        console.log('Canvas is not supported in this browser.');
    }

    function setupKaleidoscope() {
        console.log('Setup kaleidoscope canvas');
        const ctx = kaleidoscopeCanvas.getContext('2d');
        ctx.fillStyle = "rgb(200 0 0)";
        ctx.fillRect(0, 0, kaleidoscopeCanvas.width, kaleidoscopeCanvas.height);
    }

    function loadImage() {
        console.log('Load source image into offscreen canvas');


        const offscreenCtx = offscreenCanvas.getContext('2d');

        sourceImage.addEventListener("load", () => {
          offscreenCtx.drawImage(sourceImage, 0, 0);
          console.log('Image loaded');
          trackMousePosition();
        });
        
        sourceImage.src = "trees.jpeg";
    }

    function drawTile(ctx, x, y) {
        ctx.drawImage(offscreenCanvas, x, y, tileWidth, tileWidth, 0, 0, tileWidth, tileWidth);
    }

    function drawKaleidoscope(x, y) {
        console.log('Drawing kaleidoscope');
        const ctx = kaleidoscopeCanvas.getContext('2d');

        ctx.clearRect(0, 0, kaleidoscopeCanvas.width, kaleidoscopeCanvas.height);
        const centerX = Math.floor(kaleidoscopeCanvas.width / 2);
        const centerY = Math.floor(kaleidoscopeCanvas.height / 2);

        ctx.save();
        ctx.translate(centerX, centerY);

        for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            drawTile(ctx, x, y);
            ctx.save();
            ctx.scale(1, -1);
            drawTile(ctx, x, y);
            ctx.restore();
        }

        ctx.restore();
    }   

    function drawClipping(x, y) {
        console.log('Drawing clipping');

        const ctx = offscreenCanvas.getContext('2d');

        // Save the current canvas state
        ctx.save();

        // Clear the entire canvas
        ctx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

        // Create a clipping path
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + tileWidth, y);
        ctx.arc(x, y, tileWidth, 0, Math.PI / 8);
        ctx.closePath();
        ctx.clip();
        // Draw the image
        ctx.drawImage(sourceImage, 0, 0);

        // Get the clipped image data
        tileImageData = ctx.getImageData(x, y, tileWidth, tileWidth);

        // Restore the canvas state
        ctx.restore();
    }

    function trackMousePosition() {
        kaleidoscopeCanvas.addEventListener('mousemove', function(event) {
            const rect = kaleidoscopeCanvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            drawClipping(x, y);
            drawKaleidoscope(x, y);
        });
    }

});
