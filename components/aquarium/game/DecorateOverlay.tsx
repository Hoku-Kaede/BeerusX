"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import {
  BALANCE,
  decorById,
  plantById,
} from "./config";
import { useGame } from "./GameContext";
import type { PlacedDecor, PlacedPlant } from "./types";

type Props = {
  active: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onExit: () => void;
};

type DragState = {
  id: string;
  kind: "plant" | "decor";
  pointerId: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function DecorateOverlay({
  active,
  selectedId,
  onSelect,
  onExit,
}: Props) {
  const { state, dispatch, notify } = useGame();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const [dropping, setDropping] = useState(false);

  const selected =
    state.placedPlants.find((item) => item.instanceId === selectedId) ??
    state.placedDecor.find((item) => item.instanceId === selectedId) ??
    null;
  const selectedKind = state.placedPlants.some(
    (item) => item.instanceId === selectedId,
  )
    ? "plant"
    : "decor";

  const move = useCallback(
    (id: string, kind: "plant" | "decor", nx: number, ny: number) => {
      dispatch({
        type: kind === "plant" ? "updatePlant" : "updateDecor",
        instanceId: id,
        patch: { nx, ny },
      });
    },
    [dispatch],
  );

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selectedId) onSelect(null);
        else onExit();
        return;
      }
      if (!selectedId) return;
      const step = BALANCE.decorate.gridSnap;
      const nudge: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const delta = nudge[event.key];
      if (!delta) return;
      event.preventDefault();
      const item = selected as PlacedPlant | PlacedDecor | null;
      if (!item) return;
      move(
        selectedId,
        selectedKind,
        clamp(item.nx + delta[0], BALANCE.decorate.minX, BALANCE.decorate.maxX),
        clamp(item.ny + delta[1], BALANCE.decorate.minY, BALANCE.decorate.maxY),
      );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, selectedId, selected, selectedKind, move, onSelect, onExit]);

  if (!active) return null;

  const point = (clientX: number, clientY: number) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return { nx: 0.5, ny: 0.5 };
    return {
      nx: clamp(
        (clientX - rect.left) / Math.max(1, rect.width),
        BALANCE.decorate.minX,
        BALANCE.decorate.maxX,
      ),
      ny: clamp(
        (clientY - rect.top) / Math.max(1, rect.height),
        BALANCE.decorate.minY,
        BALANCE.decorate.maxY,
      ),
    };
  };

  const placeFromInventory = (
    instanceId: string,
    kind: "plant" | "decor",
    nx: number,
    ny: number,
  ) => {
    dispatch({
      type: kind === "plant" ? "placePlant" : "placeDecor",
      instanceId,
      nx,
      ny,
    });
    onSelect(instanceId);
  };

  // A tap has no coordinates of its own, so new pieces land on a loose lattice
  // instead of stacking on one another. Drag and drop still wins where used.
  const freeSpot = (kind: "plant" | "decor") => {
    const count =
      kind === "plant" ? state.placedPlants.length : state.placedDecor.length;
    return {
      nx: 0.18 + (count % 5) * 0.16,
      ny:
        kind === "plant"
          ? 0.66 + Math.floor(count / 5) * 0.1
          : 0.83 - Math.floor(count / 5) * 0.08,
    };
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDropping(false);
    const id = event.dataTransfer.getData("text/kyoko-item");
    const kind = event.dataTransfer.getData("text/kyoko-kind") as
      | "plant"
      | "decor";
    if (!id || !kind) return;
    const { nx, ny } = point(event.clientX, event.clientY);
    placeFromInventory(id, kind, nx, ny);
  };

  const items = [
    ...state.placedPlants.map((item) => ({ ...item, kindType: "plant" as const })),
    ...state.placedDecor.map((item) => ({ ...item, kindType: "decor" as const })),
  ];

  const unplacedPlants = state.ownedPlants.filter((item) => !item.placed);
  const unplacedDecor = state.ownedDecor.filter((item) => !item.placed);

  return (
    <div
      className="aq-decorate"
      ref={overlayRef}
      data-dropping={dropping ? "true" : "false"}
      onDragOver={(event) => {
        event.preventDefault();
        setDropping(true);
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={handleDrop}
      onPointerDown={(event) => {
        if (event.target === overlayRef.current) onSelect(null);
      }}
    >
      <div className="aq-decorate__grid" aria-hidden="true" />
      <p className="aq-decorate__hint">
        Drag to move · tap to select · arrows nudge · Esc exits
      </p>
      <button
        type="button"
        className="aq-decorate__done"
        onClick={onExit}
      >
        Done
      </button>

      {items.map((item) => {
        const isPlant = item.kindType === "plant";
        const def = isPlant
          ? plantById(item.itemId)
          : decorById(item.itemId);
        return (
          <button
            key={item.instanceId}
            type="button"
            className="aq-decorate__item"
            data-selected={selectedId === item.instanceId ? "true" : "false"}
            data-kind={item.kind}
            style={{
              left: `${item.nx * 100}%`,
              top: `${item.ny * 100}%`,
              transform: `translate(-50%, -50%) rotate(${item.rotation}rad) scale(${item.scale})`,
            }}
            aria-label={`Move ${def.name}`}
            onPointerDown={(event) => {
              event.stopPropagation();
              try {
                event.currentTarget.setPointerCapture(event.pointerId);
              } catch {
                // Synthetic pointers and older engines may refuse the capture.
              }
              dragRef.current = {
                id: item.instanceId,
                kind: item.kindType,
                pointerId: event.pointerId,
              };
              onSelect(item.instanceId);
            }}
            onPointerMove={(event) => {
              const drag = dragRef.current;
              if (!drag || drag.id !== item.instanceId) return;
              const { nx, ny } = point(event.clientX, event.clientY);
              move(item.instanceId, drag.kind, nx, ny);
            }}
            onPointerUp={() => {
              dragRef.current = null;
            }}
            onClick={() => onSelect(item.instanceId)}
            onFocus={() => onSelect(item.instanceId)}
          >
            {!isPlant && item.kind === "rocks" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/assets/aistudio/rock_93425470.png" alt="" />
            ) : (
              <span className="aq-decorate__dot" data-kind={item.kind} />
            )}
          </button>
        );
      })}

      {selected ? (
        <div className="aq-inspector" role="toolbar" aria-label="Selected item">
          <span className="aq-inspector__name">
            {plantById((selected as PlacedPlant).itemId)?.name ??
              decorById((selected as PlacedDecor).itemId)?.name}
          </span>
          <button
            type="button"
            className="aq-inspector__btn"
            onClick={() =>
              dispatch({
                type: selectedKind === "plant" ? "updatePlant" : "updateDecor",
                instanceId: selected.instanceId,
                patch: { rotation: selected.rotation - BALANCE.decorate.rotateStep },
              })
            }
          >
            ↺
          </button>
          <button
            type="button"
            className="aq-inspector__btn"
            onClick={() =>
              dispatch({
                type: selectedKind === "plant" ? "updatePlant" : "updateDecor",
                instanceId: selected.instanceId,
                patch: { rotation: selected.rotation + BALANCE.decorate.rotateStep },
              })
            }
          >
            ↻
          </button>
          <button
            type="button"
            className="aq-inspector__btn"
            onClick={() =>
              dispatch({
                type: selectedKind === "plant" ? "updatePlant" : "updateDecor",
                instanceId: selected.instanceId,
                patch: { scale: selected.scale - 0.1 },
              })
            }
          >
            −
          </button>
          <button
            type="button"
            className="aq-inspector__btn"
            onClick={() =>
              dispatch({
                type: selectedKind === "plant" ? "updatePlant" : "updateDecor",
                instanceId: selected.instanceId,
                patch: { scale: selected.scale + 0.1 },
              })
            }
          >
            +
          </button>
          <button
            type="button"
            className="aq-inspector__sell"
            onClick={() => {
              dispatch({
                type: selectedKind === "plant" ? "sellPlant" : "sellDecor",
                instanceId: selected.instanceId,
              });
              onSelect(null);
              notify("Item sold for 50%");
            }}
          >
            Sell
          </button>
        </div>
      ) : null}

      <div className="aq-inventory">
        <div className="aq-inventory__head">
          <span>Inventory</span>
          <span>
            {state.placedDecor.length}/{BALANCE.pond.decorSlots[Math.min(state.upgrades.pond, 4)]} decor ·{" "}
            {state.placedPlants.length}/{BALANCE.pond.plantSlots[Math.min(state.upgrades.pond, 4)]} plants
          </span>
        </div>
        <div className="aq-inventory__rail">
          {[...unplacedPlants, ...unplacedDecor].length === 0 ? (
            <p className="aq-inventory__empty">
              Everything is placed. Buy more in the shop.
            </p>
          ) : null}
          {unplacedPlants.map((item) => {
            const def = plantById(item.itemId);
            return (
              <button
                key={item.instanceId}
                type="button"
                className="aq-inventory__item"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/kyoko-item", item.instanceId);
                  event.dataTransfer.setData("text/kyoko-kind", "plant");
                }}
                onClick={() => {
                  const spot = freeSpot("plant");
                  placeFromInventory(item.instanceId, "plant", spot.nx, spot.ny);
                }}
              >
                <span className="aq-inventory__swatch" data-kind={def.kind} />
                <span>{def.name}</span>
              </button>
            );
          })}
          {unplacedDecor.map((item) => {
            const def = decorById(item.itemId);
            return (
              <button
                key={item.instanceId}
                type="button"
                className="aq-inventory__item"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/kyoko-item", item.instanceId);
                  event.dataTransfer.setData("text/kyoko-kind", "decor");
                }}
                onClick={() => {
                  const spot = freeSpot("decor");
                  placeFromInventory(item.instanceId, "decor", spot.nx, spot.ny);
                }}
              >
                {def.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={def.imageUrl} alt="" />
                ) : (
                  <span className="aq-inventory__swatch" data-kind={def.kind} />
                )}
                <span>{def.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
