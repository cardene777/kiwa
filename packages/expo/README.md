# @kiwa-lab/expo

Expo SDK mock harness for kiwa — Expo Router / SecureStore / Notifications / FileSystem / Camera を統一 interface で invoke する in-process mock。

## API

- `createExpoTestEnv(options)` = Expo runtime mock env (router + secure store + notifications + file system + camera を集約)
- `mockExpoRouter(options)` = expo-router の push / replace / back / params / segment mock
- `mockSecureStore(options)` = SecureStore の setItemAsync / getItemAsync / deleteItemAsync mock (in-memory)
- `dispatchNotification(env, payload)` = expo-notifications の scheduleNotificationAsync / addNotificationReceivedListener mock
- `mockFileSystem(options)` = expo-file-system の readAsStringAsync / writeAsStringAsync / getInfoAsync / deleteAsync mock
- `mockCamera(options)` = expo-camera の takePictureAsync / recordAsync / permissions mock
