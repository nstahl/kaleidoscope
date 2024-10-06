// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas element
    const imageCanvas = document.getElementById('image_canvas');
    const kaleidoscopeCanvas = document.getElementById('kaleidoscope_canvas');
    const tempCanvas = document.getElementById('temp_canvas');

    // source image
    let img = new Image();
    let tileImageData;
    const tileWidth = 200;

    // Check if the browser supports canvas
    if (imageCanvas.getContext) {
        setupKaleidoscope(kaleidoscopeCanvas);
        loadImage(imageCanvas);
        
    } else {
        console.log('Canvas is not supported in this browser.');
    }

    function setupKaleidoscope(canvas) {
        console.log('Setup kaleidoscope canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "rgb(200 0 0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function loadImage(canvas) {
        console.log('Load source image into canvas');
        const ctx = canvas.getContext('2d');

        img.addEventListener("load", () => {
          ctx.drawImage(img, 0, 0);
          console.log('Image loaded');
          // Add mouse tracking
          trackMousePosition(canvas);
        });
        
        img.src = "trees.jpeg";
    }

    function drawKaleidoscope(canvas) {
        console.log('Drawing kaleidoscope');
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const centerX = Math.floor(canvas.width / 2);
        const centerY = Math.floor(canvas.height / 2);

        // Create a temporary canvas to hold the tile image
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(tileImageData, 0, 0);

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.scale(1, -1);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
    }   

    function drawClipping(canvas, x, y) {
        console.log('Drawing clipping');

        const ctx = canvas.getContext('2d');

        // Save the current canvas state
        ctx.save();

        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Create a clipping path
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + tileWidth, y);
        ctx.arc(x, y, tileWidth, 0, Math.PI / 8);
        ctx.closePath();
        ctx.clip();
        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Get the clipped image data
        tileImageData = ctx.getImageData(x, y, tileWidth, tileWidth);

        // Restore the canvas state
        ctx.restore();
    }

    function trackMousePosition(canvas) {
        canvas.addEventListener('mousemove', function(event) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            drawClipping(canvas, x, y);
            drawKaleidoscope(kaleidoscopeCanvas);
        });
    }

});
