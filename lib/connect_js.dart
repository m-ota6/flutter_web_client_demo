@JS()
library sound_recorder; // ここの記述を変更しても結果に変化なし

// import 'dart:html';
import 'package:js/js.dart';

// @JS()
// class SoundRecorder {
//   external factory SoundRecorder(num frequency, Function provide);
//   external num get frequency;
//   external Function get provide;
//   external void start();
//   external void stop();
// }

// var _soundRecorder = SoundRecorder(16000, allowInterop((message) {
//   doSend(message);
// }));
// _soundRecorder.start();

// @JS()
// class SoundPlayer {
//   external factory SoundPlayer(num frequency, num upFrequency);
//   external num get frequency;
//   external num get upFrequency;
//   external void play();
//   external void stop();
// }

@JS()
class JsMain {
  external factory JsMain();
  external String area;
  external String srResult;
  external String mtResult;
  // external void getRootUri();
  external void doStart();
  external bool doClose();
  external void doFinish();
}
