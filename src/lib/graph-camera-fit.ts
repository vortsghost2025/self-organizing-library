export interface DisplayPoint {
  x: number;
  y: number;
}

export interface CameraFit {
  x: number;
  y: number;
  ratio: number;
}

export interface CameraFitOptions {
  containerWidth: number;
  containerHeight: number;
  trimPercentile?: number;
  paddingFactor?: number;
  minDisplayExtent?: number;
}

export function computeCameraFitFromDisplayPoints(
  points: DisplayPoint[],
  {
    trimPercentile = 0.05,
    paddingFactor = 1.1,
    minDisplayExtent = 0.18,
  }: CameraFitOptions
): CameraFit | null {
  const finitePoints = points.filter(
    (point) => Number.isFinite(point.x) && Number.isFinite(point.y)
  );
  if (!finitePoints.length) return null;

  const xs = finitePoints.map((point) => point.x).sort((left, right) => left - right);
  const ys = finitePoints.map((point) => point.y).sort((left, right) => left - right);
  const lowIndex = Math.floor(xs.length * trimPercentile);
  const highIndex = Math.ceil(xs.length * (1 - trimPercentile)) - 1;
  const minX = xs[Math.max(0, Math.min(lowIndex, xs.length - 1))];
  const maxX = xs[Math.max(0, Math.min(highIndex, xs.length - 1))];
  const minY = ys[Math.max(0, Math.min(lowIndex, ys.length - 1))];
  const maxY = ys[Math.max(0, Math.min(highIndex, ys.length - 1))];

  const width = Math.max(0, maxX - minX);
  const height = Math.max(0, maxY - minY);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  let adjustedMinX = centerX - Math.max(width, minDisplayExtent) / 2;
  let adjustedMaxX = centerX + Math.max(width, minDisplayExtent) / 2;
  let adjustedMinY = centerY - Math.max(height, minDisplayExtent) / 2;
  let adjustedMaxY = centerY + Math.max(height, minDisplayExtent) / 2;

  if (adjustedMinX < 0) {
    adjustedMaxX = Math.min(1, adjustedMaxX - adjustedMinX);
    adjustedMinX = 0;
  }
  if (adjustedMaxX > 1) {
    adjustedMinX = Math.max(0, adjustedMinX - (adjustedMaxX - 1));
    adjustedMaxX = 1;
  }
  if (adjustedMinY < 0) {
    adjustedMaxY = Math.min(1, adjustedMaxY - adjustedMinY);
    adjustedMinY = 0;
  }
  if (adjustedMaxY > 1) {
    adjustedMinY = Math.max(0, adjustedMinY - (adjustedMaxY - 1));
    adjustedMaxY = 1;
  }

  const adjustedWidth = adjustedMaxX - adjustedMinX;
  const adjustedHeight = adjustedMaxY - adjustedMinY;

  return {
    x: (adjustedMinX + adjustedMaxX) / 2,
    y: (adjustedMinY + adjustedMaxY) / 2,
    ratio: Math.max(adjustedWidth, adjustedHeight) * paddingFactor,
  };
}
