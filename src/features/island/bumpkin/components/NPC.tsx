import React, { useEffect, useState } from "react";
import Spritesheet from "components/animation/SpriteAnimator";
import classNames from "classnames";
import {
  BumpkinBody,
  BumpkinHair,
  BumpkinBackground,
  BumpkinShoe,
  BumpkinTool,
} from "features/game/types/bumpkin";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { buildNPCSheet } from "features/bumpkins/actions/buildNPCSheet";
import { BumpkinParts } from "lib/utils/tokenUriBuilder";

import shadow from "assets/npcs/shadow.png";
import silhouette from "assets/npcs/silhouette.webp";

const FRAME_WIDTH = 180 / 9;
const FRAME_HEIGHT = 19;
const STEPS = 9;

type NPCParts = Omit<
  BumpkinParts,
  "background" | "hair" | "body" | "shoes" | "tool"
> & {
  background: BumpkinBackground;
  hair: BumpkinHair;
  body: BumpkinBody;
  shoes: BumpkinShoe;
  tool: BumpkinTool;
};

/**
 * These parts are required as part of the image building process. They will be overriden
 * by any parts passed in as props.
 */
const DEFAULT_PARTS: NPCParts = {
  background: "Farm Background",
  body: "Dark Brown Farmer Potion",
  hair: "Basic Hair",
  shoes: "Black Farmer Boots",
  tool: "Farmer Pitchfork",
};

export interface NPCProps {
  parts: Partial<NPCParts>;
}

export const NPC: React.FC<NPCProps & { onClick?: () => void }> = ({
  parts,
  onClick,
}) => {
  const [sheetSrc, setSheetSrc] = useState<string>();

  // make sure all body parts are synchronized
  useEffect(() => {
    const load = async () => {
      const sheet = await buildNPCSheet({
        parts: { ...DEFAULT_PARTS, ...parts },
      });

      setSheetSrc(sheet);
    };

    load();
  }, []);

  return (
    <>
      <div
        className={classNames(`absolute `, {
          "cursor-pointer hover:img-highlight": !!onClick,
        })}
        onClick={() => !!onClick && onClick()}
        style={{
          width: `${PIXEL_SCALE * 16}px`,
          height: `${PIXEL_SCALE * 32}px`,
        }}
      >
        {!sheetSrc && (
          <img
            src={silhouette}
            style={{
              width: `${PIXEL_SCALE * 15}px`,
              top: `${PIXEL_SCALE * 8}px`,
              left: `${PIXEL_SCALE * 1}px`,
            }}
            className="absolute pointer-events-none npc-loading"
          />
        )}

        {sheetSrc && (
          <>
            <img
              src={shadow}
              style={{
                width: `${PIXEL_SCALE * 15}px`,
                top: `${PIXEL_SCALE * 20}px`,
                left: `${PIXEL_SCALE * 1}px`,
              }}
              className="absolute pointer-events-none"
            />
            <Spritesheet
              className="absolute w-full inset-0 pointer-events-none"
              style={{
                width: `${PIXEL_SCALE * 20}px`,
                top: `${PIXEL_SCALE * 5}px`,
                left: `${PIXEL_SCALE * -2}px`,
                imageRendering: "pixelated" as const,
              }}
              image={sheetSrc}
              widthFrame={FRAME_WIDTH}
              heightFrame={FRAME_HEIGHT}
              steps={STEPS}
              fps={14}
              autoplay={true}
              loop={true}
            />
          </>
        )}
      </div>
    </>
  );
};

export const NPCFixed: React.FC<NPCProps & { width: number }> = ({
  parts,
  width,
}) => {
  const [sheetSrc, setSheetSrc] = useState<string>();

  useEffect(() => {
    const load = async () => {
      const sheet = await buildNPCSheet({
        parts: { ...DEFAULT_PARTS, ...parts },
      });

      setSheetSrc(sheet);
    };

    load();
  }, []);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        imageRendering: "pixelated" as const,
        width: `${width}px`,
        height: `${width}px`,
      }}
    >
      <img
        src={sheetSrc}
        className="block absolute"
        style={{
          transform: "scale(9)",
          top: `${PIXEL_SCALE * 6}px`,
          left: "400%",
        }}
      />
    </div>
  );
};
