// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas element
    const kaleidoscopeCanvas = document.getElementById('kaleidoscope_canvas');
    // Create an offscreen canvas

    const offscreenSrcImgCanvas = new OffscreenCanvas(0, 0);
    const offscreenKaleidoscopeTileCanvas = new OffscreenCanvas(kaleidoscopeCanvas.width, kaleidoscopeCanvas.height);

    const drawTiling = true;

    // source image
    let sourceImage = new Image();
    
    let convertKaleidoscopeToOffscreenXCoords = 1;
    let convertKaleidoscopeToOffscreenYCoords = 1;

    const tileWidth = 300;

    const thumbnailSize = 200;

    const gridYOffset = Math.sqrt(3*tileWidth*tileWidth);

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
        const scaleToFitX = thumbnailSize / offscreenSrcImgCanvas.width;
        const scaleToFitY = thumbnailSize / offscreenSrcImgCanvas.height;

        console.log('Scaling factor', Math.min(scaleToFitX, scaleToFitY));

        if (scaleToFitX < scaleToFitY) {
            // fit to width
            thumbnailWidth = thumbnailSize;
            thumbnailHeight = offscreenSrcImgCanvas.height * scaleToFitX;
        } else {
            // fit to height
            thumbnailWidth = offscreenSrcImgCanvas.width * scaleToFitY;
            thumbnailHeight = thumbnailSize;
        }

        console.log('thumbnailWidth', thumbnailWidth);
        console.log('thumbnailHeight', thumbnailHeight);
    }

    function loadImage() {
        console.log('Load source image into offscreen canvas');


        const offscreenCtx = offscreenSrcImgCanvas.getContext('2d');

        sourceImage.addEventListener("load", () => {
          // Set the offscreen canvas size to the source image size
          offscreenSrcImgCanvas.width = sourceImage.width;
          offscreenSrcImgCanvas.height = sourceImage.height;

          // Calculate the scaling factor to fit the image within the canvas
          convertKaleidoscopeToOffscreenXCoords = offscreenSrcImgCanvas.width / kaleidoscopeCanvas.width;
          convertKaleidoscopeToOffscreenYCoords = offscreenSrcImgCanvas.height / kaleidoscopeCanvas.height;

          // Clear the canvas before drawing
          offscreenCtx.clearRect(0, 0, offscreenSrcImgCanvas.width, offscreenSrcImgCanvas.height);

          console.log('Image loaded');
          setupMap();
          trackMousePosition();
        });
        
        sourceImage.src = "man_with_lion.jpeg";
    }

    function drawMap(x, y) {

        const ctx = kaleidoscopeCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

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
        const dotX = thumbnailX + (x / offscreenSrcImgCanvas.width) * thumbnailWidth;
        const dotY = thumbnailY + (y / offscreenSrcImgCanvas.height) * thumbnailHeight;

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
        ctx.drawImage(offscreenSrcImgCanvas, x, y, tileWidth, tileWidth, 0, 0, tileWidth, tileWidth);
    }

    function drawKaleidoscope(x, y) {
        let ctx = offscreenKaleidoscopeTileCanvas.getContext('2d');

        ctx.clearRect(0, 0, offscreenKaleidoscopeTileCanvas.width, offscreenKaleidoscopeTileCanvas.height);
        const centerX = Math.floor(offscreenKaleidoscopeTileCanvas.width / 2);
        const centerY = Math.floor(offscreenKaleidoscopeTileCanvas.height / 2);

        ctx.save();
        ctx.translate(centerX, centerY);

        const tilingScalingFactor = .5;
        if (drawTiling) {
            ctx.scale(tilingScalingFactor, tilingScalingFactor);
        }

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

        ctx = kaleidoscopeCanvas.getContext('2d');
        ctx.clearRect(0, 0, kaleidoscopeCanvas.width, kaleidoscopeCanvas.height);
        if (drawTiling) {
            // Draw horizontal row
            for (let i = -4; i <= 4; i += 2) {
                ctx.drawImage(offscreenKaleidoscopeTileCanvas, i * tileWidth * tilingScalingFactor, 0);
            }
            // Draw top and bottom rows
            for (let i = -5; i <= 5; i += 2) {
                for (let j = -5; j <= 5; j += 2) {
                    ctx.drawImage(offscreenKaleidoscopeTileCanvas, 
                        i * tileWidth * tilingScalingFactor, 
                        j * gridYOffset * tilingScalingFactor);
                }
            }
        } else {
            ctx.drawImage(offscreenKaleidoscopeTileCanvas, 0, 0);
        }

    }   

    function drawClipping(x, y) {
        const ctx = offscreenSrcImgCanvas.getContext('2d');

        // Save the current canvas state
        ctx.save();

        // Clear the entire canvas
        ctx.clearRect(0, 0, offscreenSrcImgCanvas.width, offscreenSrcImgCanvas.height);

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
