import React, { useContext, useEffect, useRef, useState } from "react";

import { PIXEL_SCALE } from "features/game/lib/constants";
import { SUNNYSIDE } from "assets/sunnyside";
import { Context } from "features/game/GameProvider";
import Spritesheet, {
  SpriteSheetInstance,
} from "components/animation/SpriteAnimator";

const FIFTEEN_SECONDS = 15000;
const getDelay = () => Math.random() * FIFTEEN_SECONDS;

interface Props {
  id: string;
  isFirstRender: boolean;
}

export const Mushroom: React.FC<Props> = ({ id, isFirstRender }) => {
  const { gameService } = useContext(Context);
  const [grow, setGrow] = useState(false);

  const mushroomGif = useRef<SpriteSheetInstance>();

  const pickMushroom = () => {
    gameService.send("mushroom.picked", { id });
  };

  useEffect(() => {
    setGrow(!isFirstRender);
  }, []);

  return (
    <>
      <div
        className="relative w-full h-full cursor-pointer hover:img-highlight flex items-center justify-center"
        onClick={() => pickMushroom()}
      >
        <div className={grow ? "mushroom" : ""}>
          <Spritesheet
            className="relative group-hover:img-highlight pointer-events-none z-10"
            style={{
              imageRendering: "pixelated",
              width: `${PIXEL_SCALE * 10}px`,
            }}
            getInstance={(spritesheet) => {
              mushroomGif.current = spritesheet;
            }}
            image={SUNNYSIDE.resource.wild_mushroom_sheet}
            widthFrame={10}
            heightFrame={12}
            fps={10}
            timeout={getDelay()}
            endAt={5}
            steps={5}
            direction={`forward`}
            autoplay={true}
            loop={true}
            onLoopComplete={(spritesheet) => {
              spritesheet.pause();
              setTimeout(() => spritesheet.play(), getDelay());
            }}
          />
        </div>
      </div>
    </>
  );
};
