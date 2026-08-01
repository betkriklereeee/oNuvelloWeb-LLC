from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "assets" / "brand"
SIZE = 32
VIEWBOX = 64
SCALE = 8


canvas_size = VIEWBOX * SCALE
icon_large = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
draw = ImageDraw.Draw(icon_large)


def point(x: float, y: float) -> tuple[int, int]:
    return round(x * SCALE), round(y * SCALE)


def cubic(start, control_1, control_2, end, steps=36):
    points = []
    for index in range(steps + 1):
        t = index / steps
        u = 1 - t
        x = (
            u**3 * start[0]
            + 3 * u**2 * t * control_1[0]
            + 3 * u * t**2 * control_2[0]
            + t**3 * end[0]
        )
        y = (
            u**3 * start[1]
            + 3 * u**2 * t * control_1[1]
            + 3 * u * t**2 * control_2[1]
            + t**3 * end[1]
        )
        points.append(point(x, y))
    return points


# Recreate the SVG artwork on a transparent canvas. The old ICO fallback was
# flattened onto white, which showed up as square corners in dark browser tabs.
draw.rounded_rectangle(
    (0, 0, canvas_size - 1, canvas_size - 1),
    radius=15 * SCALE,
    fill="#101418",
)
draw.line([point(8, 25), point(8, 8), point(25, 8)], fill="#ac3931", width=5 * SCALE)
draw.line([point(39, 56), point(56, 56), point(56, 39)], fill="#ac3931", width=5 * SCALE)
draw.polygon(
    [
        point(15, 49),
        point(15, 16),
        point(23, 16),
        point(42, 38),
        point(42, 16),
        point(50, 16),
        point(50, 49),
        point(42, 49),
        point(23, 27),
        point(23, 49),
    ],
    fill="#b8ebe1",
)

wave = cubic((14, 42), (25, 32), (34, 34), (42, 42))
wave += cubic((42, 42), (46, 46), (50, 47), (54, 45))[1:]
wave_width = 3 * SCALE
draw.line(wave, fill="#ac3931", width=wave_width, joint="curve")
radius = wave_width // 2
for x, y in (wave[0], wave[-1]):
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill="#ac3931")

icon = icon_large.resize((SIZE, SIZE), Image.Resampling.LANCZOS)

icon.save(BRAND / "favicon-32.png", optimize=True)
for target in (ROOT / "favicon.ico", BRAND / "favicon.ico"):
    icon.save(target, format="ICO", sizes=[(16, 16), (32, 32)])
