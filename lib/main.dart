import 'package:flutter/material.dart';

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'dart:html' as html;

import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
// import 'package:audio_stream/audio_stream.dart';
// import 'package:connectivity_plus/connectivity_plus.dart';
// import 'package:flutter/cupertino.dart';
// import 'package:permission_handler/permission_handler.dart';
// import 'package:flutter_web_client/language.dart';
// import 'package:flutter_web_client/language_info.dart';
// import 'package:shared_preferences/shared_preferences.dart';
// import 'package:system_proxy/system_proxy.dart';
// import 'package:web_socket_channel/io.dart';
// import 'package:web_socket_channel/web_socket_channel.dart';
// import 'package:microphone/microphone.dart';
// import 'package:just_audio/just_audio.dart';

// import 'package:flutter_js/flutter_js.dart';
// import 'package:js/js.dart';
// import 'navigator.dart';
// import 'test.dart';
import 'connect_js.dart';

// import 'http_overrides.dart';

// void main() async {
//   WidgetsFlutterBinding.ensureInitialized();
//   SystemChrome.setSystemUIOverlayStyle(
//       SystemUiOverlayStyle(statusBarColor: Colors.black));
//   //横向き指定
//   SystemChrome.setPreferredOrientations(
//       [DeviceOrientation.landscapeLeft, DeviceOrientation.landscapeRight]);
//   //端末のプロキシ設定を取得
//   Map<String, String>? proxy = await SystemProxy.getProxySettings();
//   if (proxy != null) {
//     //アプリ全体に端末のプロキシ設定を適用する
//     HttpOverrides.global =
//         new ProxiedHttpOverrides(proxy['host'], proxy['port']);
//   }
//   runApp(MyApp());
// }

void main() {
  runApp(MyApp());
}

var subTitleTextStyle = TextStyle(
  color: Colors.black,
  fontWeight: FontWeight.w800,
  // letterSpacing: 0.5,
  fontSize: 28.0,
);

class DisableOne with ChangeNotifier {
  var disableOneVideo = false;
  var disableOneAudio = false;

  void video() {
    disableOneVideo = !disableOneVideo;
    notifyListeners();
  }

  void audio() {
    disableOneAudio = !disableOneAudio;
    notifyListeners();
  }
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // platformViewRegistryはAndroid Studioで赤くなるがビルドはできる
    ui.platformViewRegistry.registerViewFactory('videoView', (int viewId) {
      // ここはWebのJavaScriptの世界
      // videoタグとエラー表示のためのspanタグを重ねて表示するためのdiv要素
      final div = html.DivElement();
      div.style.position = 'relative';
      // エラーメッセージ表示spanタグ
      final span = html.SpanElement();
      span.style.position = 'absolute';
      span.style.color = '#ff1744';
      span.style.fontSize = '20px';
      span.style.left = '16px';
      span.style.top = '16px';
      // HTMLのvideoタグ
      final video = html.VideoElement();
      video.width = 1920;
      video.height = 1080;
      video.style.backgroundColor = '#000';
      video.style.width = '100%';
      video.style.height = '100%';
      // ソースが設定されたら自動再生
      video.autoplay = true;
      // Webカメラを要求する
      html.window.navigator.getUserMedia(video: true).then((stream) {
        // Webカメラへの接続が成功
        video.srcObject = stream;
      }).catchError((error) {
        // Webカメラに接続出来ないケース
        if (error is html.DomException) {
          if (error.name == 'NotFoundError')
            span.innerText = 'カメラがありません';
          else if (error.name == 'NotAllowedError')
            span.innerText = 'カメラが許可されていません';
          else
            span.innerText = '未知のエラーです';
        }
      });
      div.append(video);
      div.append(span);
      return div;
    });
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'ライブ音声翻訳サーバ Webクライアント',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: ChangeNotifierProvider(
        create: (context) => DisableOne(),
        child: MyHomePage(),
      ),
    );
  }
}

class MyHomePage extends StatefulWidget {
  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> with WidgetsBindingObserver {
  var _jsmain = JsMain();

  // 音声認識と音声翻訳の結果のテキスト
  var srResult = '';
  var mtResult = '';

  Widget widget1() {
    final _disableOneAudio =
        context.select((DisableOne one) => one.disableOneAudio);
    return Container(
      margin: EdgeInsets.only(left: 20.0, top: 40.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            'リクエストJSONデータ',
            style: subTitleTextStyle,
          ),
          Container(
              width: 400,
              height: 200,
              margin: EdgeInsets.only(top: 20.0, bottom: 10.0),
              decoration: BoxDecoration(
                border: Border.all(
                  color: Colors.black,
                  width: 1.0,
                ),
              ),
              // color: Colors.white,
              child: Scrollbar(
                  isAlwaysShown: false,
                  child: SingleChildScrollView(
                    child: Container(
                      child: Text(
                        _jsmain.area,
                        style: TextStyle(color: Colors.black, fontSize: 14),
                        overflow: TextOverflow.fade,
                      ),
                    ),
                  ))),
          Row(children: <Widget>[
            ElevatedButton(
              onPressed: _disableOneAudio
                  ? null
                  : () {
                      context.read<DisableOne>().audio();
                      try {
                        print('push button 開始 ture');
                        _jsmain.doStart();
                      } on PlatformException {
                        print('push button 開始 false');
                        var e = _jsmain.doClose();
                        _jsmain.doFinish();
                        context.read<DisableOne>().audio();
                      }
                      // 録音停止
                      // 再生停止
                    },
              child: const Text(
                '実行',
              ),
            ),
            Container(
              width: 10,
            ),
            ElevatedButton(
              onPressed: !_disableOneAudio
                  ? null
                  : () {
                      context.read<DisableOne>().audio();
                      try {
                        print('push button 終了 ture');
                        _jsmain.doFinish();
                      } on PlatformException {
                        print('push button 終了 false');
                        _jsmain.doClose();
                        context.read<DisableOne>().audio();
                      }
                    },
              child: const Text(
                '終了',
              ),
            ),
          ]),
        ],
      ),
    );
  }

  Widget widget2() {
    final _disableOneVideo =
        context.select((DisableOne one) => one.disableOneVideo);
    return Container(
      margin: EdgeInsets.only(left: 20.0, top: 40.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            'カメラ',
            style: subTitleTextStyle,
          ),
          Container(
            width: 400,
            height: 200,
            margin: EdgeInsets.only(top: 20.0, bottom: 10.0),
            decoration: BoxDecoration(
              border: Border.all(
                color: Colors.black,
                width: 1.0,
              ),
            ),
            // color: Colors.white,
            child: !_disableOneVideo
                ? null
                : HtmlElementView(viewType: 'videoView'),
          ),
          Row(children: <Widget>[
            ElevatedButton(
              onPressed: _disableOneVideo
                  ? null
                  : () {
                      context.read<DisableOne>().video();
                    },
              child: const Text(
                'オン',
              ),
            ),
            Container(
              width: 10,
            ),
            ElevatedButton(
              onPressed: !_disableOneVideo
                  ? null
                  : () {
                      context.read<DisableOne>().video();
                    },
              child: const Text(
                'オフ',
              ),
            ),
          ]),
        ],
      ),
    );
  }

  Widget widget3() {
    return Container(
      margin: EdgeInsets.only(left: 20.0, top: 30.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            '音声認識結果',
            style: subTitleTextStyle,
          ),
          Container(
              width: 400,
              height: 200,
              margin: EdgeInsets.only(top: 20.0, bottom: 10.0),
              decoration: BoxDecoration(
                border: Border.all(
                  color: Colors.black,
                  width: 1.0,
                ),
              ),
              // color: Colors.white,
              child: Scrollbar(
                  isAlwaysShown: false,
                  child: SingleChildScrollView(
                    child: Container(
                      child: Text(
                        _jsmain.srResult,
                        style: TextStyle(color: Colors.black, fontSize: 30),
                        overflow: TextOverflow.fade,
                      ),
                    ),
                  ))),
        ],
      ),
    );
  }

  Widget widget4() {
    return Container(
      margin: EdgeInsets.only(left: 20.0, top: 30.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            '翻訳結果',
            style: subTitleTextStyle,
          ),
          Container(
              width: 400,
              height: 200,
              margin: EdgeInsets.only(top: 20.0, bottom: 10.0),
              decoration: BoxDecoration(
                border: Border.all(
                  color: Colors.black,
                  width: 1.0,
                ),
              ),
              // color: Colors.white,
              child: Scrollbar(
                  isAlwaysShown: false,
                  child: SingleChildScrollView(
                    child: Container(
                      child: Text(
                        _jsmain.mtResult,
                        style: TextStyle(color: Colors.black, fontSize: 30),
                        overflow: TextOverflow.fade,
                      ),
                    ),
                  ))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ライブ音声翻訳サーバ Webクライアント Demo'),
      ),
      body: Column(
        children: <Widget>[
          Row(
            children: <Widget>[
              widget1(),
              widget2(),
            ],
          ),
          Row(
            children: <Widget>[
              widget3(),
              widget4(),
            ],
          ),
        ],
      ),
    );
  }
}

    // var _soundRecorder = SoundRecorder(16000, allowInterop((message) {
    //   doSend(message);
    // }));
    // _soundRecorder.start();