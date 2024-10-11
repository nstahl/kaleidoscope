// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas element
    const kaleidoscopeCanvas = document.getElementById('kaleidoscope_canvas');

    let sampleX = 0;
    let sampleY = 0;

    // offscreen canvases
    const offscreenSrcImgCanvas = new OffscreenCanvas(kaleidoscopeCanvas.width, kaleidoscopeCanvas.height);
    const offscreenTileCanvas = new OffscreenCanvas(kaleidoscopeCanvas.width, kaleidoscopeCanvas.height);

    // source image
    let sourceImage = new Image();
    
    let convertKaleidoscopeToOffscreenXCoords = 1;
    let convertKaleidoscopeToOffscreenYCoords = 1;

    const clippingTileWidth = 300;

    // variables for image thumbnail
    let thumbnailSize = 200;

    let thumbnailWidth;
    let thumbnailHeight;

    let isCircular = false;
    let isGrayscale = false;
    let isTiling = true;
    let isDragging = false;

    // Check if the browser supports canvas
    if (kaleidoscopeCanvas.getContext) {
        setupKaleidoscope();
        loadImage();
    } else {
        console.log('Canvas is not supported in this browser.');
    }

    // Add this function to resize the canvas
    function resizeCanvas() {
        console.log('window.innerWidth', window.innerWidth);
        kaleidoscopeCanvas.width = window.innerWidth;
        console.log('window.innerHeight', window.innerHeight);
        kaleidoscopeCanvas.height = window.innerHeight;
        // Recalculate conversion factors
        convertKaleidoscopeToOffscreenXCoords = offscreenSrcImgCanvas.width / kaleidoscopeCanvas.width;
        convertKaleidoscopeToOffscreenYCoords = offscreenSrcImgCanvas.height / kaleidoscopeCanvas.height;
        // Redraw the kaleidoscope
        if (sourceImage.complete) {
            setupThumbnail();
            drawClipping();
            drawKaleidoscope();
            drawThumbnail();
        }
    }
    
    // Call resizeCanvas initially and on window resize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function setupKaleidoscope() {
        console.log('Setup kaleidoscope canvas');
        const ctx = kaleidoscopeCanvas.getContext('2d');
        // Add these lines to enable image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Add touch and mouse event listeners
        kaleidoscopeCanvas.addEventListener('mousedown', startDrag);
        kaleidoscopeCanvas.addEventListener('mousemove', drag);
        kaleidoscopeCanvas.addEventListener('mouseup', endDrag);
        kaleidoscopeCanvas.addEventListener('mouseleave', endDrag);

        kaleidoscopeCanvas.addEventListener('touchstart', startDrag);
        kaleidoscopeCanvas.addEventListener('touchmove', drag);
        kaleidoscopeCanvas.addEventListener('touchend', endDrag);
        kaleidoscopeCanvas.addEventListener('touchcancel', endDrag);
    }

    function isMobilePortrait() {
        // Check if the device is mobile using a simple user agent check
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        // Check if the device is in portrait orientation
        const isPortrait = window.innerHeight > window.innerWidth;
        return isMobile && isPortrait;
    }

    function setupThumbnail() {
        console.log('Setup thumbnail');

        if (isMobilePortrait()) {
            thumbnailSize = 500;
        } else {
            thumbnailSize = 200;
        }

        const scaleToFitX = thumbnailSize / offscreenSrcImgCanvas.width;
        const scaleToFitY = thumbnailSize / offscreenSrcImgCanvas.height;

        console.log('Thumbnail scaling factor', Math.min(scaleToFitX, scaleToFitY));
        console.log('Is mobile in portrait mode:', isMobilePortrait());

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
          draw();
        });
        
        sourceImage.src = "trees.jpeg";
    }

    function draw() {
        drawClipping();
        drawKaleidoscope();
        drawThumbnail();
    }

    function drawThumbnail() {
        const x = sampleX;
        const y = sampleY;

        const ctx = kaleidoscopeCanvas.getContext('2d');
        // Clear any transformations applied to the context
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const padding = 10;

        const thumbnailX = padding;
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

    function drawClippingTile(ctx) {
        const x = sampleX;
        const y = sampleY;
        ctx.drawImage(offscreenSrcImgCanvas, x, y, clippingTileWidth, clippingTileWidth, 0, 0, clippingTileWidth, clippingTileWidth);
    }

    function drawHexagonalTile(ctx) {
        const x = sampleX;
        const y = sampleY;
        for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.rotate(i * 2 * Math.PI / 3);
            drawClippingTile(ctx, x, y);
            ctx.save();
            ctx.scale(1, -1);
            drawClippingTile(ctx, x, y);
            ctx.restore();
            ctx.restore();
        }
    }

    function drawCircularTile(ctx) {
        const x = sampleX;
        const y = sampleY;
        // draw 16 clipping tiles in radial pattern
        for (let i = 0; i < 8; i++) {
            ctx.save();
            ctx.rotate(i* Math.PI / 4);
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
        if (isCircular) {
            drawCircularTile(ctx);
        } else {
            drawHexagonalTile(ctx);
        }
        ctx.restore();
    }

    function drawKaleidoscope() {

        drawTileOffscreen();

        // draw tile into kaleidoscope canvas
        const ctx = kaleidoscopeCanvas.getContext('2d');

        ctx.clearRect(0, 0, kaleidoscopeCanvas.width, kaleidoscopeCanvas.height);

        if (isTiling) {

            const downScaleFactor = isMobilePortrait() ? 1 : 0.5;

            const gridXStep = isCircular ? 
                                downScaleFactor * offscreenTileCanvas.width : 
                                3 * downScaleFactor * offscreenTileCanvas.width / 2;

            const gridYStep = isCircular ?
                                Math.sqrt(3) * downScaleFactor * clippingTileWidth :
                                (Math.sqrt(3) / 2) * downScaleFactor * clippingTileWidth;

            const nrows = Math.ceil(kaleidoscopeCanvas.height / gridYStep) + 1;
            const ncols = Math.ceil(kaleidoscopeCanvas.width / gridXStep) + 1;

            ctx.save();
            ctx.translate(-downScaleFactor * offscreenTileCanvas.width / 2, 
                          -downScaleFactor * offscreenTileCanvas.height / 2);

            for (let j = 0; j < nrows; j++) {
                ctx.save();

                ctx.translate(0, j * gridYStep);
                if (j % 2 != 0) {
                    ctx.translate(gridXStep / 2, 0);
                }
                for (let i = 0; i < ncols; i ++) {
                    ctx.save();
                    ctx.translate(i * gridXStep, 0);
                    ctx.scale(downScaleFactor, downScaleFactor);
                    ctx.drawImage(offscreenTileCanvas, 0, 0);
                    ctx.restore();
                }
                ctx.restore();
            }

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

    function drawCircularClippingPath(ctx) {
        const x = sampleX;
        const y = sampleY;
        // Create a clipping path
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + clippingTileWidth, y);
        ctx.arc(x, y, clippingTileWidth, 0, Math.PI / 8);
        ctx.closePath();
    }

    function drawHexagonalClippingPath(ctx) {
        const x = sampleX;
        const y = sampleY;
        // Create a clipping path
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + clippingTileWidth, y);
        ctx.lineTo(x + clippingTileWidth / 2, 
                   y + (Math.sqrt(3) * clippingTileWidth / 2));
        ctx.closePath();
    }

    function drawClipping() {
        const ctx = offscreenSrcImgCanvas.getContext('2d');

        // Save the current canvas state
        ctx.save();

        // Clear the entire canvas
        ctx.clearRect(0, 0, offscreenSrcImgCanvas.width, offscreenSrcImgCanvas.height);

        if (isCircular) {
            drawCircularClippingPath(ctx);
        } else {
            drawHexagonalClippingPath(ctx);
        }

        ctx.clip();
        ctx.drawImage(sourceImage, 0, 0);

        // Restore the canvas state
        ctx.restore();
    }

    function startDrag(event) {
        isDragging = true;
        updatePosition(event);
    }
    
    function drag(event) {
        if (isDragging) {
            updatePosition(event);
        }
    }
    
    function endDrag() {
        isDragging = false;
    }
    
    function updatePosition(event) {
        const rect = kaleidoscopeCanvas.getBoundingClientRect();
        let clientX, clientY;
    
        if (event.type.startsWith('touch')) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
    
        sampleX = (clientX - rect.left) * convertKaleidoscopeToOffscreenXCoords;
        sampleY = (clientY - rect.top) * convertKaleidoscopeToOffscreenYCoords;
        draw();
    }

    // Add event listener for 't' key press
    document.addEventListener('keydown', function(event) {
        if (event.key === 't' || event.key === 'T') {
            isTiling = !isTiling;
            draw();
        }
    });

    // Modify the event listener for 'g' key press
    document.addEventListener('keydown', function(event) {
    if (event.key === 'g' || event.key === 'G') {
        isGrayscale = !isGrayscale;
        kaleidoscopeCanvas.classList.toggle('grayscale');
        // No need to redraw the kaleidoscope
    }
    });

    // Add event listener for 'm' key press to switch between circular and hexagonal models
    document.addEventListener('keydown', function(event) {
        if (event.key === 'm' || event.key === 'M') {
            isCircular = !isCircular;
            console.log(`Switched to ${isCircular ? 'circular' : 'hexagonal'} model`);
            // Redraw the kaleidoscope with the updated model
            draw();
        }
    });


});
