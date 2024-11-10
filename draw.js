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
    let isGrayscale = false;
    let isDragging = false;
    let isAminationMode = true;
    const radialStep = Math.PI / 720;
    let currentRadians = 0;

    let sigmoidSteepness = 0.275;
    let oscillationFrequency = 0.00075;

    let lastDrawTime = 0;
    const drawInterval = 15; // 50 milliseconds

    const radialExtension = Math.PI / 100;

    // Add near the top with other state variables
    let touchStartX = 0;
    let touchEndX = 0;
    let mouseStartX = 0;
    let mouseEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    let mouseStartY = 0;
    let mouseEndY = 0;
    const imageUrls = ["pond.jpg", "trees.jpeg", "leafs.jpg", "ny-bay.jpg", 
                        "cold-spring.jpg", "hudson.jpg", "waterfall.png"]; // Add all your image URLs here
    let currentImageIndex = 0;

    // Add new function to handle image uploads
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const imageUrl = URL.createObjectURL(file);
            imageUrls.push(imageUrl);
            currentImageIndex = imageUrls.length - 1;
            loadImage(imageUrl);
        }
    }

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

        // Add swipe detection listeners for both touch and mouse
        kaleidoscopeCanvas.addEventListener('touchstart', handleTouchStart);
        kaleidoscopeCanvas.addEventListener('touchend', handleTouchEnd);
        kaleidoscopeCanvas.addEventListener('mousedown', handleMouseStart);
        kaleidoscopeCanvas.addEventListener('mouseup', handleMouseEnd);

        // Add file input listener
        const fileInput = document.getElementById('imageUpload');
        if (fileInput) {
            fileInput.addEventListener('change', handleImageUpload);
        }
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

    function loadImage(imageUrl) {
        console.log('Loading imageUrl', imageUrl);
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
        
        sourceImage.src = imageUrl || imageUrls[currentImageIndex];
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

    function getAverageColorAtCenter(canvas) {
        const ctx = canvas.getContext('2d');
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);
        const sampleSize = 50; // Sample a 5x5 pixel area
        const halfSample = Math.floor(sampleSize / 2);
        
        const imageData = ctx.getImageData(
            centerX - halfSample, 
            centerY - halfSample, 
            sampleSize, 
            sampleSize
        );
        
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
            r += imageData.data[i];
            g += imageData.data[i + 1];
            b += imageData.data[i + 2];
        }
        
        const pixelCount = sampleSize * sampleSize;
        return {
            r: Math.round(r / pixelCount),
            g: Math.round(g / pixelCount),
            b: Math.round(b / pixelCount)
        };
    }

    function drawCircle(ctx) {
        const x = sampleX;
        const y = sampleY;

        const tempCanvasKaleidoscope = new OffscreenCanvas(offscreenTileCanvas.width, offscreenTileCanvas.height);
        const tempCtxKaleidoscope = tempCanvasKaleidoscope.getContext('2d');

        const centerX = Math.floor(tempCanvasKaleidoscope.width / 2);
        const centerY = Math.floor(tempCanvasKaleidoscope.height / 2);

        tempCtxKaleidoscope.save();
        tempCtxKaleidoscope.translate(centerX, centerY);

        tempCtxKaleidoscope.save();
        tempCtxKaleidoscope.rotate(- Math.PI / 100);
        for (let i = 0; i < 8; i++) {
            tempCtxKaleidoscope.save();
            tempCtxKaleidoscope.rotate(i * Math.PI / 4);
            tempCtxKaleidoscope.save();
            tempCtxKaleidoscope.rotate(-radialExtension / 2);
            drawClippingTile(tempCtxKaleidoscope, x, y);
            tempCtxKaleidoscope.restore();
            tempCtxKaleidoscope.save();
            tempCtxKaleidoscope.scale(1, -1);
            drawClippingTile(tempCtxKaleidoscope, x, y);
            tempCtxKaleidoscope.restore();
            tempCtxKaleidoscope.restore();
        }
        tempCtxKaleidoscope.restore();

        // draw 16 clipping tiles in radial pattern
        for (let i = 0; i < 8; i++) {
            tempCtxKaleidoscope.save();
            tempCtxKaleidoscope.rotate(i * Math.PI / 4);
            tempCtxKaleidoscope.save();
            tempCtxKaleidoscope.rotate(-radialExtension / 2);
            drawClippingTile(tempCtxKaleidoscope, x, y);
            tempCtxKaleidoscope.restore();
            tempCtxKaleidoscope.save();
            tempCtxKaleidoscope.scale(1, -1);
            drawClippingTile(tempCtxKaleidoscope, x, y);
            tempCtxKaleidoscope.restore();
            tempCtxKaleidoscope.restore();
        }
        tempCtxKaleidoscope.restore();

        // draw inner dot
        const tempCanvasInnerDot = new OffscreenCanvas(offscreenTileCanvas.width, offscreenTileCanvas.height);
        const tempCtxInnerDot = tempCanvasInnerDot.getContext('2d');

        const avgColor = getAverageColorAtCenter(tempCanvasKaleidoscope);
        const rgbaColor = `rgba(${avgColor.r}, ${avgColor.g}, ${avgColor.b}`;
        
        const gradientInnerDot = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, clippingTileWidth / 20
        );
        
        gradientInnerDot.addColorStop(0, `${rgbaColor}, 1)`);
        gradientInnerDot.addColorStop(0.8, `${rgbaColor}, 1)`);
        gradientInnerDot.addColorStop(1, `${rgbaColor}, 0)`);

        tempCtxInnerDot.filter = `blur(3px)`;
        tempCtxInnerDot.fillStyle = gradientInnerDot;
        tempCtxInnerDot.fillRect(0, 0, tempCanvasInnerDot.width, tempCanvasInnerDot.height);

        //  draw fading boundary
        const tempCanvasOuterFade = new OffscreenCanvas(offscreenTileCanvas.width, offscreenTileCanvas.height);
        const tempCtxOuterFade = tempCanvasOuterFade.getContext('2d');

        const gradientOuterFade = tempCtxOuterFade.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, clippingTileWidth
        );
        gradientOuterFade.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradientOuterFade.addColorStop(.98, 'rgba(255, 255, 255, 1)');
        gradientOuterFade.addColorStop(1, 'rgba(255, 255, 255, 0)');
        tempCtxOuterFade.fillStyle = gradientOuterFade;
        tempCtxOuterFade.fillRect(0, 0, tempCanvasOuterFade.width, tempCanvasOuterFade.height);
        // before you draw, define that you only want to draw where there is overlapping content
        tempCtxOuterFade.globalCompositeOperation = 'source-in';
        tempCtxOuterFade.drawImage(tempCanvasKaleidoscope, 0, 0);

        ctx.drawImage(tempCanvasOuterFade, 0, 0);
        ctx.drawImage(tempCanvasInnerDot, 0, 0);
    }

    function drawTileOffscreen() {
        offscreenTileCanvas.width = 2 * clippingTileWidth;
        offscreenTileCanvas.height = 2 * clippingTileWidth;

        // draw tile offscreen
        const ctx = offscreenTileCanvas.getContext('2d');

        ctx.clearRect(0, 0, offscreenTileCanvas.width, offscreenTileCanvas.height);

        ctx.save();
        // draw tile at center of offscreen canvas
        drawCircle(ctx);
        ctx.restore();
    }

    function drawKaleidoscope() {

        drawTileOffscreen();

        // draw tile into kaleidoscope canvas
        const ctx = kaleidoscopeCanvas.getContext('2d');

        ctx.clearRect(0, 0, kaleidoscopeCanvas.width, kaleidoscopeCanvas.height);
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

    // Modify the event listener for 'g' key press
    document.addEventListener('keydown', function(event) {
        if (event.key === 'g' || event.key === 'G') {
            isGrayscale = !isGrayscale;
            kaleidoscopeCanvas.classList.toggle('grayscale');
            console.log(`Switched to ${isGrayscale ? 'grayscale' : 'color'}`);
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

    // Update touch handler functions and add mouse handler functions
    function handleTouchStart(event) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        console.log('touchStartX', touchStartX, 'touchStartY', touchStartY);
    }

    function handleTouchEnd(event) {
        touchEndX = event.changedTouches[0].clientX;
        touchEndY = event.changedTouches[0].clientY;
        console.log('touchEndX', touchEndX, 'touchEndY', touchEndY);
        
        // Calculate horizontal and vertical distances
        const horizontalSwipe = touchEndX - touchStartX;
        const verticalSwipe = touchEndY - touchStartY;
        
        // If vertical movement is greater than horizontal, handle as vertical swipe
        if (Math.abs(verticalSwipe) > Math.abs(horizontalSwipe)) {
            handleVerticalSwipe(verticalSwipe);
        } else {
            handleHorizontalSwipe(horizontalSwipe);
        }
    }

    function handleMouseStart(event) {
        mouseStartX = event.clientX;
        mouseStartY = event.clientY;
        console.log('mouseStartX', mouseStartX, 'mouseStartY', mouseStartY);
    }

    function handleMouseEnd(event) {
        mouseEndX = event.clientX;
        mouseEndY = event.clientY;
        console.log('mouseEndX', mouseEndX, 'mouseEndY', mouseEndY);
        
        // Calculate horizontal and vertical distances
        const horizontalSwipe = mouseEndX - mouseStartX;
        const verticalSwipe = mouseEndY - mouseStartY;
        
        // If vertical movement is greater than horizontal, handle as vertical swipe
        if (Math.abs(verticalSwipe) > Math.abs(horizontalSwipe)) {
            handleVerticalSwipe(verticalSwipe);
        } else {
            handleHorizontalSwipe(horizontalSwipe);
        }
    }

    function handleHorizontalSwipe(swipeDistance) {
        console.log('handleHorizontalSwipe', swipeDistance);
        const swipeThreshold = 50; // Minimum distance for a swipe (positive value)

        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                // Swipe right detected - go to previous image
                console.log('Swipe right detected');
                currentImageIndex = (currentImageIndex - 1 + imageUrls.length) % imageUrls.length;
            } else {
                // Swipe left detected - go to next image
                console.log('Swipe left detected');
                currentImageIndex = (currentImageIndex + 1) % imageUrls.length;
            }
            loadImage(imageUrls[currentImageIndex]);
        }
    }

    function handleVerticalSwipe(swipeDistance) {
        console.log('handleVerticalSwipe', swipeDistance);
        const swipeThreshold = 50; // Minimum distance for a swipe

        if (Math.abs(swipeDistance) > swipeThreshold) {
            // Toggle grayscale mode
            isGrayscale = !isGrayscale;
            kaleidoscopeCanvas.classList.toggle('grayscale');
            console.log(`Switched to ${isGrayscale ? 'grayscale' : 'color'}`);
        }
    }

    document.getElementById('file-input').addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          handleImageUpload(e);
        }
    });

});