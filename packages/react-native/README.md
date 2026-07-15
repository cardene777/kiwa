# @kiwa-lab/react-native

React Native platform mock harness for kiwa — AsyncStorage / React Navigation / Platform / Linking / Dimensions 5 primitive を統一 interface で invoke する in-process mock。 real device / simulator なしで RN app の platform-dependent path の test を書ける。

## API

- `createRNTestEnv({ platform })` = RN test env (asyncStorage / navigation / platform / linking / dimensions を bundle)
- `mockAsyncStorage(initial)` = @react-native-async-storage/async-storage 互換 mock
- `mockNavigation(initialRoute)` = @react-navigation/native の navigation / route mock
- `dispatchLinkingUrl(env, url)` = Linking.getInitialURL / addEventListener 経路の event 発火
- `setPlatform(env, { os, version })` = Platform.OS / Platform.Version の値差替
