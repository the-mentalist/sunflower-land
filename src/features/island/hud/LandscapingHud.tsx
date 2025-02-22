import React, { useContext, useEffect, useState } from "react";
import { Balance } from "components/Balance";
import { useActor, useSelector } from "@xstate/react";
import { Context } from "features/game/GameProvider";
import { BlockBucks } from "./components/BlockBucks";
import Decimal from "decimal.js-light";
import { PIXEL_SCALE } from "features/game/lib/constants";

import { SUNNYSIDE } from "assets/sunnyside";
import scarecrow from "assets/icons/scarecrow.png";
import bush from "assets/icons/decoration.png";
import chest from "assets/icons/chest.png";
import lightning from "assets/icons/lightning.png";

import { useIsMobile } from "lib/utils/hooks/useIsMobile";

import {
  MachineInterpreter,
  MachineState,
  placeEvent,
} from "features/game/expansion/placeable/landscapingMachine";
import { Label } from "components/ui/Label";
import { PlaceableController } from "features/farming/hud/components/PlaceableController";
import { LandscapingChest } from "./components/LandscapingChest";
import { getChestItems } from "./components/inventory/utils/inventory";
import { getKeys } from "features/game/types/craftables";
import { CraftDecorationsModal } from "./components/decorations/CraftDecorationsModal";
import { CraftEquipmentModal } from "./components/equipment/CraftEquipmentModal";
import { CraftBuildingModal } from "./components/buildings/CraftBuildingModal";
import { ITEM_DETAILS } from "features/game/types/images";
import { LandscapingIntroduction } from "./components/LandscapingIntroduction";
import { getRemoveAction } from "../collectibles/MovableComponent";
import { InventoryItemName } from "features/game/types/game";

const compareBalance = (prev: Decimal, next: Decimal) => {
  return prev.eq(next);
};

const compareBlockBucks = (prev: Decimal, next: Decimal) => {
  const previous = prev ?? new Decimal(0);
  const current = next ?? new Decimal(0);
  return previous.eq(current);
};

const selectMovingItem = (state: MachineState) => state.context.moving;
const isIdle = (state: MachineState) => state.matches({ editing: "idle" });

const LandscapingHudComponent: React.FC<{ isFarming: boolean }> = () => {
  const { gameService } = useContext(Context);
  const [isMobile] = useIsMobile();

  const [showDecorations, setShowDecorations] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  const [showBuildings, setShowBuildings] = useState(false);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);

  const child = gameService.state.children.landscaping as MachineInterpreter;

  const balance = useSelector(
    gameService,
    (state) => state.context.state.balance,
    compareBalance
  );

  const blockBucks = useSelector(
    gameService,
    (state) => state.context.state.inventory["Block Buck"] ?? new Decimal(0),
    compareBlockBucks
  );

  const selectedItem = useSelector(child, selectMovingItem);
  const idle = useSelector(child, isIdle);

  console.log({ idle });
  const showRemove =
    isMobile && selectedItem && getRemoveAction(selectedItem.name);

  useEffect(() => {
    setShowRemoveConfirmation(false);
  }, [selectedItem]);

  const remove = () => {
    const action = getRemoveAction(selectedItem?.name as InventoryItemName);
    if (!action) {
      return;
    }

    if (showRemoveConfirmation) {
      child.send("REMOVE", {
        event: action,
        id: selectedItem?.id,
        name: selectedItem?.name,
      });
    } else {
      setShowRemoveConfirmation(true);
    }
  };

  return (
    <div
      data-html2canvas-ignore="true"
      aria-label="Hud"
      className="absolute z-40"
    >
      <Balance balance={balance} />
      <BlockBucks blockBucks={blockBucks} isFullUser={false} />

      <LandscapingIntroduction />

      <>
        {idle && (
          <>
            <div
              className="fixed flex z-50 flex-col"
              style={{
                marginLeft: `${PIXEL_SCALE * 2}px`,
                marginBottom: `${PIXEL_SCALE * 25}px`,
                width: `${PIXEL_SCALE * 22}px`,
                right: `${PIXEL_SCALE * 3}px`,
                top: `${PIXEL_SCALE * 38}px`,
              }}
            >
              <div
                onClick={() => child.send("CANCEL")}
                className="w-full z-10 cursor-pointer hover:img-highlight relative"
                style={{
                  width: `${PIXEL_SCALE * 22}px`,
                  height: `${PIXEL_SCALE * 22}px`,
                  marginBottom: `${PIXEL_SCALE * 4}px`,
                }}
              >
                <img
                  src={SUNNYSIDE.ui.round_button}
                  className="absolute"
                  style={{
                    width: `${PIXEL_SCALE * 22}px`,
                  }}
                />
                <img
                  src={SUNNYSIDE.icons.cancel}
                  className="absolute"
                  style={{
                    top: `${PIXEL_SCALE * 5}px`,
                    left: `${PIXEL_SCALE * 5}px`,
                    width: `${PIXEL_SCALE * 12}px`,
                  }}
                />
              </div>
              <div
                onClick={() => setShowEquipment(true)}
                className="w-full z-10 cursor-pointer hover:img-highlight relative"
                style={{
                  width: `${PIXEL_SCALE * 22}px`,
                  height: `${PIXEL_SCALE * 22}px`,
                  marginBottom: `${PIXEL_SCALE * 4}px`,
                }}
              >
                <img
                  src={SUNNYSIDE.ui.round_button}
                  className="absolute"
                  style={{
                    width: `${PIXEL_SCALE * 22}px`,
                  }}
                />
                <img
                  src={scarecrow}
                  className="absolute"
                  style={{
                    top: `${PIXEL_SCALE * 3}px`,
                    left: `${PIXEL_SCALE * 5}px`,
                    width: `${PIXEL_SCALE * 12}px`,
                  }}
                />
                <img
                  src={lightning}
                  className="absolute"
                  style={{
                    top: `${PIXEL_SCALE * 2}px`,
                    right: `${PIXEL_SCALE * 3}px`,
                    width: `${PIXEL_SCALE * 6}px`,
                  }}
                />
              </div>
              <div
                onClick={() => setShowBuildings(true)}
                className="w-full z-10 cursor-pointer hover:img-highlight relative"
                style={{
                  width: `${PIXEL_SCALE * 22}px`,
                  height: `${PIXEL_SCALE * 22}px`,
                  marginBottom: `${PIXEL_SCALE * 4}px`,
                }}
              >
                <img
                  src={SUNNYSIDE.ui.round_button}
                  className="absolute"
                  style={{
                    width: `${PIXEL_SCALE * 22}px`,
                  }}
                />
                <img
                  src={ITEM_DETAILS["Water Well"].image}
                  className="absolute"
                  style={{
                    top: `${PIXEL_SCALE * 4}px`,
                    left: `${PIXEL_SCALE * 5}px`,
                    width: `${PIXEL_SCALE * 12}px`,
                  }}
                />
              </div>
              <div
                onClick={() => setShowDecorations(true)}
                className="w-full z-10 cursor-pointer hover:img-highlight relative"
                style={{
                  width: `${PIXEL_SCALE * 22}px`,
                  height: `${PIXEL_SCALE * 22}px`,
                  marginBottom: `${PIXEL_SCALE * 4}px`,
                }}
              >
                <img
                  src={SUNNYSIDE.ui.round_button}
                  className="absolute"
                  style={{
                    width: `${PIXEL_SCALE * 22}px`,
                  }}
                />
                <img
                  src={bush}
                  className="absolute"
                  style={{
                    top: `${PIXEL_SCALE * 5}px`,
                    left: `${PIXEL_SCALE * 5}px`,
                    width: `${PIXEL_SCALE * 12}px`,
                  }}
                />
              </div>
              <Chest
                onPlaceChestItem={(selected) => {
                  child.send("SELECT", {
                    action: placeEvent(selected),
                    placeable: selected,
                    multiple: true,
                  });
                }}
              />
            </div>
          </>
        )}
      </>

      {showRemove && (
        <div
          onClick={() => remove()}
          className="fixed flex z-50 flex-col cursor-pointer"
          style={{
            marginLeft: `${PIXEL_SCALE * 2}px`,
            marginBottom: `${PIXEL_SCALE * 25}px`,
            width: `${PIXEL_SCALE * 22}px`,
            right: `${PIXEL_SCALE * 3}px`,
            bottom: `${PIXEL_SCALE * 3}px`,
          }}
        >
          <div
            className="absolute"
            style={{
              top: `${PIXEL_SCALE * -10}px`,
              right: `${PIXEL_SCALE * -2}px`,
            }}
          >
            <Label type="danger">Remove</Label>
          </div>
          <img
            src={SUNNYSIDE.ui.round_button}
            className="absolute"
            style={{
              width: `${PIXEL_SCALE * 22}px`,
            }}
          />
          {showRemoveConfirmation ? (
            <img
              className="absolute"
              src={SUNNYSIDE.icons.confirm}
              style={{
                width: `${PIXEL_SCALE * 12}px`,
                right: `${PIXEL_SCALE * 4.5}px`,
                top: `${PIXEL_SCALE * 5}px`,
              }}
            />
          ) : (
            <img
              className="absolute"
              src={ITEM_DETAILS["Rusty Shovel"].image}
              style={{
                width: `${PIXEL_SCALE * 14}px`,
                right: `${PIXEL_SCALE * 4.5}px`,
                top: `${PIXEL_SCALE * 4.5}px`,
              }}
            />
          )}
        </div>
      )}

      <CraftDecorationsModal
        onHide={() => setShowDecorations(false)}
        show={showDecorations}
      />

      <CraftEquipmentModal
        onHide={() => setShowEquipment(false)}
        show={showEquipment}
      />

      <CraftBuildingModal
        onHide={() => setShowBuildings(false)}
        show={showBuildings}
      />

      <PlaceableController />
    </div>
  );
};

const Chest: React.FC<{
  onPlaceChestItem: (item: InventoryItemName) => void;
}> = ({ onPlaceChestItem }) => {
  const { gameService } = useContext(Context);
  const [gameState] = useActor(gameService);

  const [showChest, setShowChest] = useState(false);

  const chestItems = getChestItems(gameState.context.state);

  return (
    <>
      <div
        onClick={() => setShowChest(true)}
        className="z-50 cursor-pointer hover:img-highlight relative"
        style={{
          width: `${PIXEL_SCALE * 22}px`,
          height: `${PIXEL_SCALE * 22}px`,
          marginBottom: `${PIXEL_SCALE * 4}px`,
        }}
      >
        <img
          src={SUNNYSIDE.ui.round_button}
          className="absolute"
          style={{
            width: `${PIXEL_SCALE * 22}px`,
          }}
        />
        <img
          src={chest}
          className="absolute"
          style={{
            top: `${PIXEL_SCALE * 5}px`,
            left: `${PIXEL_SCALE * 5}px`,
            width: `${PIXEL_SCALE * 12}px`,
          }}
        />
        <Label
          type="default"
          className="px-0.5 text-xxs absolute -top-2 -right-2"
        >
          {getKeys(chestItems).reduce(
            (acc, key) => acc + (chestItems[key]?.toNumber() ?? 0),
            0
          )}
        </Label>
      </div>

      <LandscapingChest
        state={gameState.context.state}
        onHide={() => setShowChest(false)}
        show={showChest}
        onPlace={onPlaceChestItem}
      />
    </>
  );
};

export const LandscapingHud = React.memo(LandscapingHudComponent);
