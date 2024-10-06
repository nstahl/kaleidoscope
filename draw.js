// Wait for the DOM to be fully loaded before executing the script
document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas element
    const imageCanvas = document.getElementById('image_canvas');
    // source image
    let img = new Image();

    // Check if the browser supports canvas
    if (imageCanvas.getContext) {
        loadImage(document.getElementById('image_canvas'));
        
    } else {
        console.log('Canvas is not supported in this browser.');
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

    function drawClipping(canvas, x, y) {
        console.log('Drawing clipping');

        const ctx = canvas.getContext('2d');

        // Save the current canvas state
        ctx.save();

        // Clear the entire canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Create a clipping path
        ctx.beginPath();
        ctx.arc(x, y, 60, 0, 2 * Math.PI);
        ctx.clip();


        // Draw the image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Restore the canvas state
        ctx.restore();
    }

    function trackMousePosition(canvas) {
        canvas.addEventListener('mousemove', function(event) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            drawClipping(canvas, x, y);
        });
    }

});
