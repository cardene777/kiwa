export type CameraPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface CapturedPicture {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  exif?: Record<string, unknown>;
}

export interface CapturedVideo {
  uri: string;
  durationMs: number;
}

export interface CameraOptions {
  initialPermission?: CameraPermissionStatus;
  defaultWidth?: number;
  defaultHeight?: number;
  uriPrefix?: string;
}

export interface CameraMock {
  requestCameraPermissionsAsync: () => Promise<{ status: CameraPermissionStatus; granted: boolean }>;
  getCameraPermissionsAsync: () => Promise<{ status: CameraPermissionStatus; granted: boolean }>;
  takePictureAsync: (options?: { base64?: boolean; exif?: boolean }) => Promise<CapturedPicture>;
  recordAsync: (options?: { maxDurationMs?: number }) => Promise<CapturedVideo>;
  setPermission: (status: CameraPermissionStatus) => void;
  getCapturedPictures: () => CapturedPicture[];
  getRecordedVideos: () => CapturedVideo[];
  clear: () => void;
}

/**
 * expo-camera mock。 permission request + takePicture + recordVideo を deterministic に返す。
 * 実 camera 起動なしで permission flow + capture pipeline の test を書ける。
 */
export function mockCamera(options: CameraOptions = {}): CameraMock {
  let permission: CameraPermissionStatus = options.initialPermission ?? 'undetermined';
  const width = options.defaultWidth ?? 1920;
  const height = options.defaultHeight ?? 1080;
  const uriPrefix = options.uriPrefix ?? 'file:///mock/camera/';
  const pictures: CapturedPicture[] = [];
  const videos: CapturedVideo[] = [];
  let pictureCounter = 0;
  let videoCounter = 0;

  return {
    async requestCameraPermissionsAsync() {
      if (permission === 'undetermined') permission = 'granted';
      return { status: permission, granted: permission === 'granted' };
    },
    async getCameraPermissionsAsync() {
      return { status: permission, granted: permission === 'granted' };
    },
    async takePictureAsync(opts?: { base64?: boolean; exif?: boolean }): Promise<CapturedPicture> {
      if (permission !== 'granted') throw new Error(`Camera permission not granted (status=${permission})`);
      pictureCounter += 1;
      const picture: CapturedPicture = {
        uri: `${uriPrefix}picture-${pictureCounter}.jpg`,
        width,
        height,
      };
      if (opts?.base64) picture.base64 = Buffer.from(`mock-${pictureCounter}`).toString('base64');
      if (opts?.exif) picture.exif = { Make: 'kiwa-mock', Model: 'test-camera' };
      pictures.push(picture);
      return picture;
    },
    async recordAsync(opts?: { maxDurationMs?: number }): Promise<CapturedVideo> {
      if (permission !== 'granted') throw new Error(`Camera permission not granted (status=${permission})`);
      videoCounter += 1;
      const video: CapturedVideo = {
        uri: `${uriPrefix}video-${videoCounter}.mp4`,
        durationMs: opts?.maxDurationMs ?? 5000,
      };
      videos.push(video);
      return video;
    },
    setPermission(status: CameraPermissionStatus) {
      permission = status;
    },
    getCapturedPictures() {
      return [...pictures];
    },
    getRecordedVideos() {
      return [...videos];
    },
    clear() {
      pictures.length = 0;
      videos.length = 0;
      pictureCounter = 0;
      videoCounter = 0;
    },
  };
}
