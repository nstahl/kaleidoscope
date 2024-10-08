// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas element
    const kaleidoscopeCanvas = document.getElementById('kaleidoscope_canvas');

    // offscreen canvases
    const offscreenSrcImgCanvas = new OffscreenCanvas(0, 0);
    const offscreenTileCanvas = new OffscreenCanvas(kaleidoscopeCanvas.width, kaleidoscopeCanvas.height);

    // source image
    let sourceImage = new Image();
    
    let convertKaleidoscopeToOffscreenXCoords = 1;
    let convertKaleidoscopeToOffscreenYCoords = 1;

    const clippingTileWidth = 300;

    const gridYOffset = Math.sqrt(3*clippingTileWidth*clippingTileWidth);

    // variables for image thumbnail
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
        // Add these lines to enable image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
    }

    function setupThumbnail() {
        console.log('Setup thumbnail');
        const scaleToFitX = thumbnailSize / offscreenSrcImgCanvas.width;
        const scaleToFitY = thumbnailSize / offscreenSrcImgCanvas.height;

        console.log('Thumbnail scaling factor', Math.min(scaleToFitX, scaleToFitY));

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

          // Calculate the scaling factor to convert kaleidoscope canvas coordinates to offscreen canvas coordinates
          convertKaleidoscopeToOffscreenXCoords = offscreenSrcImgCanvas.width / kaleidoscopeCanvas.width;
          convertKaleidoscopeToOffscreenYCoords = offscreenSrcImgCanvas.height / kaleidoscopeCanvas.height;

          // Clear the canvas before drawing
          offscreenCtx.clearRect(0, 0, offscreenSrcImgCanvas.width, offscreenSrcImgCanvas.height);

          console.log('Image loaded');
          setupThumbnail();
          trackMousePosition();
        });
        
        sourceImage.src = "man_with_lion.jpeg";
    }

    function drawThumbnail(x, y) {

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

    function drawClippingTile(ctx, x, y) {
        ctx.drawImage(offscreenSrcImgCanvas, x, y, clippingTileWidth, clippingTileWidth, 0, 0, clippingTileWidth, clippingTileWidth);
    }

    function drawTile(ctx, x, y) {
        // draw 16 clipping tiles in radial pattern
        for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.save();
            drawClippingTile(ctx, x, y);
            ctx.save();
            ctx.scale(1, -1);
            drawClippingTile(ctx, x, y);
            ctx.restore();
            ctx.restore();
        }
    }

    function drawTileOffscreen(x, y) {
        offscreenTileCanvas.width = 2 * clippingTileWidth;
        offscreenTileCanvas.height = 2 * clippingTileWidth;

        // draw tile offscreen
        const ctx = offscreenTileCanvas.getContext('2d');

        ctx.clearRect(0, 0, offscreenTileCanvas.width, offscreenTileCanvas.height);

        const centerX = Math.floor(offscreenTileCanvas.width / 2);
        const centerY = Math.floor(offscreenTileCanvas.height / 2);

        ctx.save();
        ctx.translate(centerX, centerY);
        // draw tile at center of offscreen canvas
        drawTile(ctx, x, y);
        ctx.restore();
    }

    function drawKaleidoscope(x, y) {

        drawTileOffscreen(x, y);

        // draw tile into kaleidoscope canvas
        const ctx = kaleidoscopeCanvas.getContext('2d');

        ctx.clearRect(0, 0, kaleidoscopeCanvas.width, kaleidoscopeCanvas.height);

        if (isTiling) {
            ctx.save();
            ctx.scale(.4, .4);
            ctx.translate(-offscreenTileCanvas.width / 2, -offscreenTileCanvas.height / 2);

            for (let j = 0; j < 4; j++) {
                ctx.save();

                ctx.translate(0, j * gridYOffset);
                // Draw horizontal row
                if (j % 2 != 0) {
                    ctx.translate(offscreenTileCanvas.width / 2, 0);
                }
                for (let i = 0; i < 7; i ++) {
                    ctx.save();
                    ctx.translate(i * offscreenTileCanvas.width, 0);
                    ctx.drawImage(offscreenTileCanvas, 0, 0);
                    ctx.restore();
                }
                ctx.restore();
            }
            // // Draw top and bottom rows
            // for (let i = -5; i <= 5; i += 2) {
            //     for (let j = -1; j <= 1; j += 2) {
            //         ctx.drawImage(offscreenKaleidoscopeTileCanvas, 
            //             i * clippingTileWidth, 
            //             j * gridYOffset);
            //     }
            // }
            ctx.restore();

        } else {
            ctx.save();
            ctx.translate(kaleidoscopeCanvas.width / 2, 
                          kaleidoscopeCanvas.height / 2);
            
            const xScalingFactor = kaleidoscopeCanvas.width / offscreenTileCanvas.width;
            const yScalingFactor = kaleidoscopeCanvas.height / offscreenTileCanvas.height;
            const scalingFactor = Math.min(xScalingFactor, yScalingFactor);

            ctx.scale(scalingFactor, scalingFactor);
            ctx.drawImage(offscreenTileCanvas, 
                          -offscreenTileCanvas.width / 2, 
                          -offscreenTileCanvas.height / 2);
            ctx.restore();
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
        ctx.lineTo(x + clippingTileWidth, y);
        ctx.arc(x, y, clippingTileWidth, 0, Math.PI / 8);
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
            drawThumbnail(x, y);
        });
    }

    // controls

    let isTiling = false;

    // Add event listener for 't' key press
    document.addEventListener('keydown', function(event) {
        if (event.key === 't' || event.key === 'T') {
            isTiling = !isTiling;
            // Redraw the kaleidoscope with the updated drawTiling value
            const rect = kaleidoscopeCanvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) * convertKaleidoscopeToOffscreenXCoords;
            const y = (event.clientY - rect.top) * convertKaleidoscopeToOffscreenYCoords;
            drawClipping(x, y);
            drawKaleidoscope(x, y);
            drawThumbnail(x, y);
        }
    });

    let isGrayscale = false;

    // Modify the event listener for 'g' key press
    document.addEventListener('keydown', function(event) {
    if (event.key === 'g' || event.key === 'G') {
        isGrayscale = !isGrayscale;
        kaleidoscopeCanvas.classList.toggle('grayscale');
        // No need to redraw the kaleidoscope
    }
    });

});
