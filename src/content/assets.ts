import bearUrl from "@/assets/illustrations/bear.svg";
import blockAUrl from "@/assets/illustrations/block-a.svg";
import blockOneUrl from "@/assets/illustrations/block-one.svg";
import bubbleUrl from "@/assets/illustrations/bubble.svg";
import catUrl from "@/assets/illustrations/cat.svg";
import duckUrl from "@/assets/illustrations/duck.svg";
import fishUrl from "@/assets/illustrations/fish.svg";
import moonUrl from "@/assets/illustrations/moon.svg";
import rocketUrl from "@/assets/illustrations/rocket.svg";
import shellUrl from "@/assets/illustrations/shell.svg";
import starUrl from "@/assets/illustrations/star.svg";
import whaleUrl from "@/assets/illustrations/whale.svg";

export const assetRegistry = {
  bear: bearUrl,
  "block-a": blockAUrl,
  "block-one": blockOneUrl,
  bubble: bubbleUrl,
  cat: catUrl,
  duck: duckUrl,
  fish: fishUrl,
  moon: moonUrl,
  rocket: rocketUrl,
  shell: shellUrl,
  star: starUrl,
  whale: whaleUrl,
} as const;

export type AssetId = keyof typeof assetRegistry;
