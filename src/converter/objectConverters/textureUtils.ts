const TEXTURE_PLACEHOLDER_PREFIX = 'texture://';
const TEXTURE_REFERENCE_PREFIX = 'texture-ref://';

export type BlendModeValue = 'Cutout' | 'Opaque' | 'Alpha';
export type ColorXValue = { r: number; g: number; b: number; a: number; profile: string };

export function toTexturePlaceholder(identifier: string): string {
  return `${TEXTURE_PLACEHOLDER_PREFIX}${identifier}`;
}

export function toTextureReference(componentId: string): string {
  return `${TEXTURE_REFERENCE_PREFIX}${componentId}`;
}

export function resolveTextureValue(
  identifier?: string,
  textureMap?: Map<string, string>
): string | undefined {
  if (!identifier) {
    return undefined;
  }
  if (textureMap) {
    return textureMap.get(identifier) ?? identifier;
  }
  return toTexturePlaceholder(identifier);
}

export function replaceTexturesInValue(value: unknown, textureMap: Map<string, string>): unknown {
  if (typeof value === 'string') {
    if (!value.startsWith(TEXTURE_PLACEHOLDER_PREFIX)) {
      return value;
    }
    const identifier = value.slice(TEXTURE_PLACEHOLDER_PREFIX.length);
    return textureMap.get(identifier) ?? identifier;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceTexturesInValue(item, textureMap));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const recordValue = value as Record<string, unknown>;
  const replaced: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(recordValue)) {
    replaced[key] = replaceTexturesInValue(item, textureMap);
  }
  return replaced;
}
