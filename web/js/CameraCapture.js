/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/*
 * Original source URL:
 * https://github.com/mganeko/webrtcexpjp/blob/master/basic2016/camera_new.html
 */

class CameraCapturer {

    // クラス呼び出し時にグローバル変数 lecalVideo, localStream を宣言
    constructor(videoElement) { 
        this.localVideo = videoElement;
        this.localStream = null;
    }

// start local video
    async startVideo() { // async 非同期関数の宣言 他の関数とは別に実行され暗黙の Promise(関数終了通知) を返す
        if (!this.localVideo) { // videoElement が未定義ならエラー
            throw new Error("Video element is not specified.");
        }
        try {
            // await: async funcion によって Promise が返されるのを待機
            // async funcion の実行を一時停止し、Promise の解決または拒否を待機
            // navigator.mediaDevices.getUserMedia: 接続されたメディア入力装置へのアクセスを提供
            let stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
            this.localStream = stream;
            // typeof: 未評価のオペランドの型を返す
            if (typeof this.localVideo.srcObject == "object") { // localVideo.srcObject の型が "object" なら true
                this.localVideo.srcObject = stream;
            } else {
                // window: 現在表示しているWebページの位置情報
                // URL.createObjectURL(): 引数で指定されたオブジェクトを表す URL を含む DOMString を生成
                this.localVideo.src = window.URL.createObjectURL(stream); // 
            }
            this.localVideo.onloadedmetadata = (evt) => {
                this.localVideo.play();
            };
        } catch (error) {
            throw new Error("Failed to get media stream. " + error);
        }
    }

// stop local video
    stopVideo() {
        if ((!this.localVideo) || (!this.localStream)) {
            return;
        }
        this.localStream.getTracks().forEach((track) => { track.stop(); });
        this.localStream = null;
        this.localVideo.pause();
        if (typeof this.localVideo.srcObject == "object") {
            this.localVideo.srcObject = null;
        } else {
            window.URL.revokeObjectURL(this.localVideo.src);
            this.localVideo.src = '';
        }
    }

}