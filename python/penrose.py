import math
import cmath
import cairo


#------ Configuration --------
IMAGE_SIZE = (1000, 1000)
NUM_SUBDIVISIONS = 8
#-----------------------------


goldenRatio = (1 + math.sqrt(5)) / 2

def subdivide(triangles):
    result = []
    for color, A, B, C in triangles:
        if color == 0:
            # Subdivide red triangle
            P = A + (B - A) / goldenRatio
            result += [(0, C, P, B), (1, P, C, A)]
        else:
            # Subdivide blue triangle
            Q = B + (A - B) / goldenRatio
            R = B + (C - B) / goldenRatio
            result += [(1, R, C, A), (1, Q, R, B), (0, R, Q, A)]
    return result

# Create wheel of red triangles around the origin
triangles = []
for i in xrange(10):
    B = cmath.rect(1, (2*i - 1) * math.pi / 10)
    C = cmath.rect(1, (2*i + 1) * math.pi / 10)
    if i % 2 == 0:
        B, C = C, B  # Make sure to mirror every second triangle
    triangles.append((0, 0j, B, C))

# Perform subdivisions
for i in xrange(NUM_SUBDIVISIONS):
    triangles = subdivide(triangles)

print triangles

# Prepare cairo surface
#surface = cairo.ImageSurface(cairo.FORMAT_ARGB32, IMAGE_SIZE[0], IMAGE_SIZE[1])
#cr = cairo.Context(surface)
#cr.translate(IMAGE_SIZE[0] / 2.0, IMAGE_SIZE[1] / 2.0)
#wheelRadius = 1.2 * math.sqrt((IMAGE_SIZE[0] / 2.0) ** 2 + (IMAGE_SIZE[1] / 2.0) ** 2)
#cr.scale(wheelRadius, wheelRadius)

# Draw red triangles
#for color, A, B, C in triangles:
#    if color == 0:
#        cr.move_to(A.real, A.imag)
#        cr.line_to(B.real, B.imag)
#        cr.line_to(C.real, C.imag)
#        cr.close_path()
#cr.set_source_rgb(1.0, 0.35, 0.35)
#cr.fill()    
