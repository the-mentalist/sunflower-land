import { GameState, PlacedItem, Position } from "features/game/types/game";
import { EXPANSION_ORIGINS, LAND_SIZE } from "../../lib/constants";
import { Coordinates } from "../../components/MapPlacement";
import {
  ANIMAL_DIMENSIONS,
  COLLECTIBLES_DIMENSIONS,
  getKeys,
} from "features/game/types/craftables";
import { BUILDINGS_DIMENSIONS } from "features/game/types/buildings";
import {
  MUSHROOM_DIMENSIONS,
  RESOURCE_DIMENSIONS,
} from "features/game/types/resources";

type BoundingBox = Position;

/**
 * Extracts the bounding box for a collection of resources e.g. Shrubs.
 * @param resource
 * @param expansionIndex
 * @returns Array of bounding boxes
 */
const extractBoundingBox = <T extends Record<number, BoundingBox>>(
  resource: T,
  expansionIndex: number
): BoundingBox[] => {
  const { x: xOffset, y: yOffset } = EXPANSION_ORIGINS[expansionIndex];

  return Object.values(resource).map(({ x, y, height, width }) => ({
    x: x + xOffset,
    y: y + yOffset,
    height,
    width,
  }));
};

/**
 * Axis aligned bounding box collision detection
 * https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
 */
export function isOverlapping(
  boundingBox1: BoundingBox,
  boundingBox2: BoundingBox
) {
  const xmin1 = boundingBox1.x;
  const xmin2 = boundingBox2.x;

  const xmax1 = boundingBox1.x + boundingBox1.width;
  const xmax2 = boundingBox2.x + boundingBox2.width;

  const ymin1 = boundingBox1.y - boundingBox1.height;
  const ymin2 = boundingBox2.y - boundingBox2.height;

  const ymax1 = boundingBox1.y;
  const ymax2 = boundingBox2.y;

  return xmin1 < xmax2 && xmax1 > xmin2 && ymin1 < ymax2 && ymax1 > ymin2;
}

const splitBoundingBox = (boundingBox: BoundingBox) => {
  const boxCount = boundingBox.width * boundingBox.height;

  return Array.from({ length: boxCount }).map((_, i) => ({
    x: boundingBox.x + (i % boundingBox.width),
    y: boundingBox.y - Math.floor(i / boundingBox.width),
    width: 1,
    height: 1,
  }));
};

function detectWaterCollision(expansions: number, boundingBox: BoundingBox) {
  const expansionBoundingBoxes: BoundingBox[] = new Array(expansions)
    .fill(null)
    .map((_, expansionIndex) => ({
      x: EXPANSION_ORIGINS[expansionIndex].x - LAND_SIZE / 2,
      y: EXPANSION_ORIGINS[expansionIndex].y + LAND_SIZE / 2,
      width: LAND_SIZE,
      height: LAND_SIZE,
    }));

  /**
   * A bounding box may overlap multiple land expansions.
   *
   * To check if a bounding box completely overlaps land, the
   * bounding box is split into smaller, 1 by 1 bounding boxes,
   * and each box is checked independently.
   */
  const isOverlappingExpansion = (boundingBox: BoundingBox) => {
    return expansionBoundingBoxes.some((expansionBoundingBox) =>
      isOverlapping(boundingBox, expansionBoundingBox)
    );
  };
  const smallerBoxes = splitBoundingBox(boundingBox);
  const isOverLand = smallerBoxes.every(isOverlappingExpansion);

  return !isOverLand;
}

const PLACEABLE_DIMENSIONS = {
  ...BUILDINGS_DIMENSIONS,
  ...COLLECTIBLES_DIMENSIONS,
  ...RESOURCE_DIMENSIONS,
};

function detectPlaceableCollision(state: GameState, boundingBox: BoundingBox) {
  const {
    collectibles,
    buildings,
    crops,
    trees,
    stones,
    gold,
    iron,
    fruitPatches,
  } = state;

  const placed = {
    ...collectibles,
    ...buildings,
  };

  const placeableBounds = getKeys(placed).flatMap((name) => {
    const items = placed[name] as PlacedItem[];
    const dimensions = PLACEABLE_DIMENSIONS[name];

    return items.map((item) => ({
      x: item.coordinates.x,
      y: item.coordinates.y,
      height: dimensions.height,
      width: dimensions.width,
    }));
  });

  const resources = [
    ...Object.values(trees),
    ...Object.values(stones),
    ...Object.values(iron),
    ...Object.values(gold),
    ...Object.values(crops),
    ...Object.values(fruitPatches),
  ];

  const resourceBoundingBoxes = resources.map((item) => ({
    x: item.x,
    y: item.y,
    height: item.height,
    width: item.width,
  }));

  const boundingBoxes = [...placeableBounds, ...resourceBoundingBoxes];

  return boundingBoxes.some((resourceBoundingBox) =>
    isOverlapping(boundingBox, resourceBoundingBox)
  );
}

function detectChickenCollision(state: GameState, boundingBox: BoundingBox) {
  const { chickens } = state;

  const boundingBoxes = getKeys(chickens).flatMap((name) => {
    const chicken = chickens[name];
    const dimensions = ANIMAL_DIMENSIONS.Chicken;

    return {
      x: chicken.coordinates?.x ?? -999,
      y: chicken.coordinates?.y ?? -999,
      height: dimensions.height,
      width: dimensions.width,
    };
  });

  return boundingBoxes.some((resourceBoundingBox) =>
    isOverlapping(boundingBox, resourceBoundingBox)
  );
}

function detectMushroomCollision(state: GameState, boundingBox: BoundingBox) {
  const { mushrooms } = state;
  if (!mushrooms) return false;

  const boundingBoxes = getKeys(mushrooms.mushrooms).flatMap((id) => {
    const mushroom = mushrooms.mushrooms[id];
    const dimensions = MUSHROOM_DIMENSIONS;

    return {
      x: mushroom.x,
      y: mushroom.y,
      height: dimensions.height,
      width: dimensions.width,
    };
  });

  return boundingBoxes.some((resourceBoundingBox) =>
    isOverlapping(boundingBox, resourceBoundingBox)
  );
}

enum Direction {
  Left,
  Right,
  Top,
  Bottom,
}

/**
 * Detects whether a bounding box collides with a land corner.
 *
 * As corners of a land change depending on how many expansions you have, this function looks for
 * neighbouring expansions in all directions to determine where the corners are and whether the bounding box
 * overlaps with any of them.
 * @param expansions The list of expansions that are not under construction.
 * @param boundingBox
 * @returns boolean
 */
function detectLandCornerCollision(
  expansions: number,
  boundingBox: BoundingBox
) {
  // Mid point coordinates for all land expansions
  const originCoordinatesForExpansions: Coordinates[] = new Array(expansions)
    .fill(null)
    .map((_, i) => EXPANSION_ORIGINS[i]);

  /**
   *
   * @param expansionOrigin Center coordinates for a land expansion
   * @param offset coordinate multiplier to determine direction to check eg bottomLeft = { x: -1, y: -1 }
   * @returns Boolean
   */
  const expansionExistsAtOffset = (
    expansionOrigin: Coordinates,
    offset: {
      x: -1 | 0 | 1;
      y: -1 | 0 | 1;
    }
  ) => {
    return originCoordinatesForExpansions.some((neighbour) => {
      return (
        neighbour.x === expansionOrigin.x + LAND_SIZE * offset.x &&
        neighbour.y === expansionOrigin.y + LAND_SIZE * offset.y
      );
    });
  };

  const hasNeighbouringExpansion = (
    origin: Coordinates,
    direction: Direction
  ) => {
    switch (direction) {
      case Direction.Left:
        return expansionExistsAtOffset(origin, { x: -1, y: 0 });
      case Direction.Right:
        return expansionExistsAtOffset(origin, { x: 1, y: 0 });
      case Direction.Top:
        return expansionExistsAtOffset(origin, { x: 0, y: 1 });
      case Direction.Bottom:
        return expansionExistsAtOffset(origin, { x: 0, y: -1 });
    }
  };

  return originCoordinatesForExpansions.some((originCoordinate) => {
    const overlapsTopLeft = () =>
      !hasNeighbouringExpansion(originCoordinate, Direction.Left) &&
      !hasNeighbouringExpansion(originCoordinate, Direction.Top) &&
      isOverlapping(boundingBox, {
        x: originCoordinate.x - LAND_SIZE / 2,
        y: originCoordinate.y + LAND_SIZE / 2,
        width: 1,
        height: 1,
      });

    const overlapsTopRight = () =>
      !hasNeighbouringExpansion(originCoordinate, Direction.Right) &&
      !hasNeighbouringExpansion(originCoordinate, Direction.Top) &&
      isOverlapping(boundingBox, {
        x: originCoordinate.x + LAND_SIZE / 2 - 1,
        y: originCoordinate.y + LAND_SIZE / 2,
        width: 1,
        height: 1,
      });

    const overlapsBottomLeft = () =>
      !hasNeighbouringExpansion(originCoordinate, Direction.Left) &&
      !hasNeighbouringExpansion(originCoordinate, Direction.Bottom) &&
      isOverlapping(boundingBox, {
        x: originCoordinate.x - LAND_SIZE / 2,
        y: originCoordinate.y - LAND_SIZE / 2 + 1,
        width: 1,
        height: 1,
      });

    const overlapsBottomRight = () =>
      !hasNeighbouringExpansion(originCoordinate, Direction.Right) &&
      !hasNeighbouringExpansion(originCoordinate, Direction.Bottom) &&
      isOverlapping(boundingBox, {
        x: originCoordinate.x + LAND_SIZE / 2 - 1,
        y: originCoordinate.y - LAND_SIZE / 2 + 1,
        width: 1,
        height: 1,
      });

    return (
      overlapsTopLeft() ||
      overlapsTopRight() ||
      overlapsBottomLeft() ||
      overlapsBottomRight()
    );
  });
}

export function detectCollision(state: GameState, position: Position) {
  const expansions = state.inventory["Basic Land"]?.toNumber() ?? 3;

  return (
    detectWaterCollision(expansions, position) ||
    detectPlaceableCollision(state, position) ||
    detectLandCornerCollision(expansions, position) ||
    detectChickenCollision(state, position) ||
    detectMushroomCollision(state, position)
  );
}
