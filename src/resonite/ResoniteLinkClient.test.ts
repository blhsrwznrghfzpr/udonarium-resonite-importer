import { describe, it, expect, vi, beforeEach } from 'vitest';

const TEST_PORT = 12345;

const createMockLink = () => ({
  socket: { readyState: 1, OPEN: 1, close: vi.fn() },
  call: vi.fn(),
  slotAdd: vi.fn(),
  slotUpdate: vi.fn(),
  slotGet: vi.fn(),
  slotRemove: vi.fn(),
  componentAdd: vi.fn(),
  componentUpdate: vi.fn(),
  componentGet: vi.fn(),
  importTexture2DFile: vi.fn(),
  importTexture2DRawData: vi.fn(),
});

let mockLink = createMockLink();
const connectMock = vi.fn();

vi.mock('@eth0fox/tsrl', () => {
  class MockResoniteLink {
    static connect = connectMock;
  }
  return { ResoniteLink: MockResoniteLink };
});

import { ResoniteLinkClient } from './ResoniteLinkClient';

describe('ResoniteLinkClient', () => {
  let client: ResoniteLinkClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLink = createMockLink();
    connectMock.mockResolvedValue(mockLink);
    client = new ResoniteLinkClient({ port: TEST_PORT });
  });

  it('connect/disconnect works', async () => {
    await client.connect();
    expect(client.isConnected()).toBe(true);

    client.disconnect();
    expect(mockLink.socket.close).toHaveBeenCalled();
    expect(client.isConnected()).toBe(false);
  });

  it('addSlot sends addSlot call with field wrappers', async () => {
    await client.connect();
    mockLink.call.mockResolvedValue({ success: true });

    const id = await client.addSlot({
      id: 'slot-id',
      parentId: 'Root',
      name: 'Test',
      position: { x: 0, y: 0, z: 0 },
      tag: 'tagged',
    });

    expect(id).toBe('slot-id');
    expect(mockLink.call).toHaveBeenCalledTimes(1);
    const [payload] = mockLink.call.mock.calls[0] as [Record<string, unknown>];
    expect(payload.$type).toBe('addSlot');
    const data = payload.data as Record<string, unknown>;
    expect(data.id).toBe('slot-id');
    expect(data.parent).toEqual(expect.objectContaining({ targetId: 'Root' }));
    expect(data.tag).toEqual(expect.objectContaining({ value: 'tagged' }));
  });

  it('throws when not connected', async () => {
    await expect(client.importTexture('/tmp/a.png')).rejects.toThrow(
      'Not connected to ResoniteLink'
    );
  });

  it('captureTransformAndRemoveRootChildrenByTag removes only matching', async () => {
    await client.connect();
    mockLink.slotGet
      .mockResolvedValueOnce({ id: 'Root', children: [{ id: 'slot-a' }, { id: 'slot-b' }] })
      .mockResolvedValueOnce({ id: 'slot-a', tag: { value: 'keep' } })
      .mockResolvedValueOnce({
        id: 'slot-b',
        tag: { value: 'delete-me' },
      })
      .mockResolvedValueOnce({
        id: 'slot-b',
        position: { value: { x: 1, y: 2, z: 3 } },
        rotation: { value: { x: 0, y: 0.5, z: 0, w: 0.866 } },
        scale: { value: { x: 4, y: 5, z: 6 } },
      });

    const result = await client.captureTransformAndRemoveRootChildrenByTag('delete-me');

    expect(result.removedCount).toBe(1);
    expect(result.transform).toEqual({
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 0, y: 0.5, z: 0, w: 0.866 },
      scale: { x: 4, y: 5, z: 6 },
    });
    expect(mockLink.slotRemove).toHaveBeenCalledWith('slot-b');
  });
});
