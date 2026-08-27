export interface OwnedAssetLike {
  assetId: string;
  quantity: number;
}

export function rememberOwnedAssetIds(
  previousAssetIds: readonly string[],
  positions: readonly OwnedAssetLike[]
): string[] {
  const remembered = new Set(previousAssetIds);

  for (const position of positions) {
    if (position.quantity > 0) remembered.add(position.assetId);
  }

  return [...remembered];
}
