// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas element
    const kaleidoscopeCanvas = document.getElementById('kaleidoscope_canvas');

    // in offscreen canvas coordinates
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

    let showThumbnail = false;
    let isGrayscale = true;
    let isTiling = false;
    let isDragging = false;
    let isAminationMode = true;
    const radialStep = Math.PI / 720;
    let currentRadians = 0;

    let sigmoidSteepness = 0.275;
    let oscillationFrequency = 0.00125;

    let lastDrawTime = 0;
    const drawInterval = 50; // 50 milliseconds

    const radialExtension = Math.PI / 100;

    // Check if the browser supports canvas
    if (kaleidoscopeCanvas.getContext) {
        init();
    } else {
        console.log('Canvas is not supported in this browser.');
    }

    function init() {
        resizeCanvas();
        setupKaleidoscope();
        loadImage();
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
        if (sourceImage.complete && !isAminationMode) {
            setupThumbnail();
            drawClipping();
            drawKaleidoscope();
            drawThumbnail();
        }
    }

    function setupKaleidoscope() {
        console.log('Setup kaleidoscope canvas');
        const ctx = kaleidoscopeCanvas.getContext('2d');
        // Add these lines to enable image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (isGrayscale) {
            kaleidoscopeCanvas.classList.toggle('grayscale');
        }

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
          sampleX = offscreenSrcImgCanvas.width / 2;
          sampleY = offscreenSrcImgCanvas.height / 2;
          setupThumbnail();
          draw();
        });
        
        sourceImage.src = "trees.jpeg";
    }

    function getSigmoidalSample(x) {
        // Calculate the sigmoid value between 0 and 1
        const sigmoidValue = 1 / (1 + Math.exp(-sigmoidSteepness * x));

        return sigmoidValue;
    }

    function getSinusoidalSample() {
        const currentTime = performance.now() / 2;
        
        // Calculate the sinusoidal value between -1 and 1
        const sinusoidalValue = Math.sin(currentTime * oscillationFrequency);
        return sinusoidalValue;
    }
    
    function draw() {
        const currentTime = performance.now();
        if (isAminationMode) {
            if (currentTime - lastDrawTime >= drawInterval) {
                drawClipping();
                drawKaleidoscope();
                if (showThumbnail) {
                    drawThumbnail();
                }

                currentRadians += radialStep;
                const xSample = 10*getSinusoidalSample();
                const firstDerivativeOfSigmoid = getSigmoidalSample(xSample) * (1 - getSigmoidalSample(xSample));
                const vectorLength = getSigmoidalSample(xSample) * 250;
                sampleX = offscreenSrcImgCanvas.width / 2 + Math.cos(currentRadians) * vectorLength;
                sampleY = offscreenSrcImgCanvas.height / 2 + Math.sin(currentRadians) * vectorLength;
                lastDrawTime = currentTime;
            }
            window.requestAnimationFrame(draw);
        } else {
            drawClipping();
            drawKaleidoscope();
            if (showThumbnail) {
                drawThumbnail();
            }
        }
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

    function drawCircularTile(ctx) {
        const x = sampleX;
        const y = sampleY;

        // Create a temporary canvas for the blurred image
        const tempCanvas = new OffscreenCanvas(offscreenTileCanvas.width, offscreenTileCanvas.height);
        const tempCtx = tempCanvas.getContext('2d');

        const centerX = Math.floor(tempCanvas.width / 2);
        const centerY = Math.floor(tempCanvas.height / 2);

        tempCtx.save();
        tempCtx.translate(centerX, centerY);
        // draw 16 clipping tiles in radial pattern
        for (let i = 0; i < 8; i++) {
            tempCtx.save();
            tempCtx.rotate(i * Math.PI / 4);
            tempCtx.save();
            tempCtx.rotate(-radialExtension / 2);
            drawClippingTile(tempCtx, x, y);
            tempCtx.restore();
            tempCtx.save();
            tempCtx.scale(1, -1);
            drawClippingTile(tempCtx, x, y);
            tempCtx.restore();
            tempCtx.restore();
        }
        tempCtx.restore();

        // Apply radial blur
        const blurRadius = 3; // Adjust this value to control the blur intensity
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, clippingTileWidth / 4
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        // ctx.translate(-centerX, -centerY);

        ctx.save();
        ctx.filter = `blur(${blurRadius}px)`;
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, clippingTileWidth * 2, clippingTileWidth * 2);
        ctx.restore();
        
        // Draw the original sharp image on top
        ctx.drawImage(tempCanvas, 0, 0);

    }

    function drawTileOffscreen() {
        offscreenTileCanvas.width = 2 * clippingTileWidth;
        offscreenTileCanvas.height = 2 * clippingTileWidth;

        // draw tile offscreen
        const ctx = offscreenTileCanvas.getContext('2d');

        ctx.clearRect(0, 0, offscreenTileCanvas.width, offscreenTileCanvas.height);

        const centerX = Math.floor(offscreenTileCanvas.width / 2);
        const centerY = Math.floor(offscreenTileCanvas.height / 2);

        ctx.save();
        // draw tile at center of offscreen canvas
        drawCircularTile(ctx);
        ctx.restore();
    }

    function drawKaleidoscope() {

        drawTileOffscreen();

        // draw tile into kaleidoscope canvas
        const ctx = kaleidoscopeCanvas.getContext('2d');

        ctx.clearRect(0, 0, kaleidoscopeCanvas.width, kaleidoscopeCanvas.height);

        if (isTiling) {

            const downScaleFactor = isMobilePortrait() ? 1 : 0.5;

            const gridXStep = downScaleFactor * offscreenTileCanvas.width;

            const gridYStep = Math.sqrt(3) * downScaleFactor * clippingTileWidth;

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
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-radialExtension / 2);
        ctx.beginPath();
        ctx.lineTo(clippingTileWidth, 0);
        ctx.arc(0, 0, clippingTileWidth, 0, Math.PI / 8 + radialExtension);
        ctx.lineTo(0, 0);
        ctx.restore();
    }

    function drawClipping() {
        const ctx = offscreenSrcImgCanvas.getContext('2d');

        // Save the current canvas state
        ctx.save();

        // Clear the entire canvas
        ctx.clearRect(0, 0, offscreenSrcImgCanvas.width, offscreenSrcImgCanvas.height);

        drawCircularClippingPath(ctx);

        ctx.clip();
        ctx.drawImage(sourceImage, 0, 0);

        // Restore the canvas state
        ctx.restore();
    }

    function startDrag(event) {
        isDragging = true;
        if (!isAminationMode) {
        updatePosition(event);
        }
        event.preventDefault();
    }
    
    function drag(event) {
        if (isDragging && !isAminationMode) {
            updatePosition(event);
        }
        event.preventDefault();
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
        event.preventDefault();
    }

    // Call resizeCanvas on window resize
    window.addEventListener('resize', resizeCanvas);

    // Add event listener for 't' key press
    document.addEventListener('keydown', function(event) {
        if (event.key === 'a' || event.key === 'A') {
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

    // Add event listener for 'a' to toggle between animation and static mode
    document.addEventListener('keydown', function(event) {
        if (event.key === 'p' || event.key === 'P') {
            isAminationMode = !isAminationMode;
            console.log(`Switched to ${isAminationMode ? 'animation' : 'static'} mode`);
            // Redraw the kaleidoscope with the updated model
            draw();
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 't' || event.key === 'T') {
            showThumbnail = !showThumbnail;
            console.log(`Switched to ${showThumbnail ? 'show' : 'hide'} thumbnail`);
            // Redraw the kaleidoscope with the updated model
            draw();
        }
    });

    // Add event listener for up and down arrow keys to adjust sigmoidSteepness
    document.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowUp') {
            sigmoidSteepness += 0.005;
            console.log(`Increased sigmoidSteepness to ${sigmoidSteepness.toFixed(3)}`);
            if (isAminationMode) {
                // If in animation mode, the change will be reflected in the next frame
            } else {
                // If in static mode, redraw immediately
                draw();
            }
        } else if (event.key === 'ArrowDown') {
            sigmoidSteepness = Math.max(0, sigmoidSteepness - 0.005); // Prevent negative values
            console.log(`Decreased sigmoidSteepness to ${sigmoidSteepness.toFixed(3)}`);
            if (isAminationMode) {
                // If in animation mode, the change will be reflected in the next frame
            } else {
                // If in static mode, redraw immediately
                draw();
            }
        }
    });

    // Add event listener for left and right arrow keys to adjust oscillationFrequency
    document.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowLeft') {
            oscillationFrequency = Math.max(0, oscillationFrequency - 0.00005); // Prevent negative values
            console.log(`Decreased oscillationFrequency to ${oscillationFrequency.toFixed(5)}`);
            if (!isAminationMode) {
                // If in static mode, redraw immediately
                draw();
            }
        } else if (event.key === 'ArrowRight') {
            oscillationFrequency += 0.00005;
            console.log(`Increased oscillationFrequency to ${oscillationFrequency.toFixed(5)}`);
            if (!isAminationMode) {
                // If in static mode, redraw immediately
                draw();
            }
        }
    });

});