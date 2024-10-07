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
    
    let convertKaleidoscopeToOffscreenXCoords = 1;
    let convertKaleidoscopeToOffscreenYCoords = 1;

    const tileWidth = 300;

    const thumbnailSize = 200;
    let thumbnailWidth;
    let thumbnailHeight;

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

    function setupMap() {
        console.log('Setup map');
        const scaleToFitX = thumbnailSize / offscreenCanvas.width;
        const scaleToFitY = thumbnailSize / offscreenCanvas.height;

        if (scaleToFitX < scaleToFitY) {
            // fit to width
            thumbnailWidth = thumbnailSize;
            thumbnailHeight = offscreenCanvas.height * scaleToFitX;
        } else {
            // fit to height
            thumbnailWidth = offscreenCanvas.width * scaleToFitY;
            thumbnailHeight = thumbnailSize;
        }

        console.log('thumbnailWidth', thumbnailWidth);
        console.log('thumbnailHeight', thumbnailHeight);
    }

    function loadImage() {
        console.log('Load source image into offscreen canvas');


        const offscreenCtx = offscreenCanvas.getContext('2d');

        sourceImage.addEventListener("load", () => {
          // Set the offscreen canvas size to the source image size
          offscreenCanvas.width = sourceImage.width;
          offscreenCanvas.height = sourceImage.height;

          // Calculate the scaling factor to fit the image within the canvas
          convertKaleidoscopeToOffscreenXCoords = offscreenCanvas.width / kaleidoscopeCanvas.width;
          convertKaleidoscopeToOffscreenYCoords = offscreenCanvas.height / kaleidoscopeCanvas.height;

          // Clear the canvas before drawing
          offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

          console.log('Image loaded');
          setupMap();
          trackMousePosition();
        });
        
        sourceImage.src = "canaletto.jpeg";
    }

    function drawMap(x, y) {

        const ctx = kaleidoscopeCanvas.getContext('2d');
        const padding = 10;

        const thumbnailX = kaleidoscopeCanvas.width - thumbnailWidth - padding;
        const thumbnailY = kaleidoscopeCanvas.height - thumbnailHeight - padding;

        // Draw thumbnail
        ctx.drawImage(sourceImage, thumbnailX, thumbnailY, thumbnailWidth, thumbnailHeight);

        // Draw border around thumbnail
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(thumbnailX, thumbnailY, thumbnailWidth, thumbnailHeight);

        // Calculate dot position
        const dotX = thumbnailX + (x / offscreenCanvas.width) * thumbnailWidth;
        const dotY = thumbnailY + (y / offscreenCanvas.height) * thumbnailHeight;

        // Draw glowing dot
        ctx.beginPath();
        ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'white';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        // Reset shadow
        ctx.shadowBlur = 0;

    }

    function drawTile(ctx, x, y) {
        ctx.drawImage(offscreenCanvas, x, y, tileWidth, tileWidth, 0, 0, tileWidth, tileWidth);
    }

    function drawKaleidoscope(x, y) {
        const ctx = kaleidoscopeCanvas.getContext('2d');

        ctx.clearRect(0, 0, kaleidoscopeCanvas.width, kaleidoscopeCanvas.height);
        const centerX = Math.floor(kaleidoscopeCanvas.width / 2);
        const centerY = Math.floor(kaleidoscopeCanvas.height / 2);

        ctx.save();
        ctx.translate(centerX, centerY);

        for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.save();
            drawTile(ctx, x, y);
            ctx.save();
            ctx.scale(1, -1);
            drawTile(ctx, x, y);
            ctx.restore();
            ctx.restore();
        }

        ctx.restore();
    }   

    function drawClipping(x, y) {
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

        ctx.drawImage(sourceImage, 0, 0);

        // Restore the canvas state
        ctx.restore();
    }

    function trackMousePosition() {
        kaleidoscopeCanvas.addEventListener('mousemove', function(event) {
            const rect = kaleidoscopeCanvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) * convertKaleidoscopeToOffscreenXCoords;
            const y = (event.clientY - rect.top) * convertKaleidoscopeToOffscreenYCoords;
            drawClipping(x, y);
            drawKaleidoscope(x, y);
            drawMap(x, y);
        });
    }

});
