class JsMain {

    constructor() {
        // wsUri = getRootUri() + "/sipp/si";
        this.wsUri = "wss://sdodev103.nict.go.jp/PF/wsapp/sipp/si";
        this.websocket = null;
        this.timeoutId = -1;
        this.soundRecorder = null;
        this.soundPlayer = null;
        this.cameraCapturer = null;
        // disableOneAudio = null;
        // disableOneVideo = null;
        this.trace = false;

        // this.output = '';
        this.area = function(){/*
            {
                "version": "1.0",
                "dateTime": "2020-10-29T14:12:38.792+09:00",
                "user": {
                    "name": "NICT"
                },
                "speechTranslation": {
                    "speechDetectionOptions": {
                        "enabled": true
                    },
                    "recognitionOptions": {
                        "outputTemp": true,
                        "outputPartial": true
                    },
                    "translationUnitOptions": {
                        "enabled": true,
                        "outputLog": true
                    },
                    "language": "ja",
                    "into": "en",
                    "utterance": "1"
                }
            }
            */}.toString().split("\n").slice(1,-1).join("\n");
        this.srResult = '';
        this.mtResult = '';
        this.srDiv = document.createElement("div");
        this.srDiv.value = '';
        this.mtDiv = document.createElement("div");
        this.mtDiv.value = '';

        // let c = document.createElement("div");
        // let r = c.value;
        let r = this.area;
        let j = JSON.parse(r);
        j.dateTime = new Date().toLocalISOString();
        this.area = JSON.stringify(j, null, "    ");
    }

    getRootUri() {
        return "wss://" + (document.location.hostname === "" ? "localhost" : document.location.hostname) + ":" +
                (document.location.port === "" ? "8848" : document.location.port);
    }

    // function init() {
    //     output = document.getElementById("output");
    //     area = document.getElementById("command");

    //     startButton = document.getElementById("run");
    //     stopButton = document.getElementById("end");
        
    //     disableOneAudio = new DisableOne([startButton, stopButton], stopButton);
        
    //     startButton.addEventListener("click", (evt) => {
    //         if (startButton.disabled) {
    //             return;
    //         }
            
    //         document.getElementById("srResult").innerHTML = '';
    //         document.getElementById("mtResult").innerHTML = '';

    //         disableOneAudio.disable(startButton);
    //         try {
    //             doStart();
    //         } catch (e) {
    //             doClose();
    //             doFinish();
    //             disableOneAudio.disable(stopButton);
    //         }
    //     });
    //     stopButton.addEventListener("click", (evt) => {
    //         if (stopButton.disabled) {
    //             return;
    //         }
    //         disableOneAudio.disable(stopButton);
    //         try {
    //             doFinish();
    //         } catch (e) {
    //             doClose();
    //             disableOneAudio.disable(startButton);
    //         }
    //     });
        
    //     vStartButton = document.getElementById("vrun");
    //     vStopButton = document.getElementById("vend");
        
    //     disableOneVideo = new DisableOne([vStartButton, vStopButton], vStopButton);
        
    //     vStartButton.addEventListener("click", async (evt) => {
    //         try {
    //             disableOneVideo.disable(vStartButton);
                
    //             if (this.cameraCapturer === null) {
    //                 this.cameraCapturer = new CameraCapturer(
    //                         document.getElementById("localVideo"));
    //             }                        
    //             await this.cameraCapturer.startVideo();
            
    //         } catch (error) {
    //             console.error("Could not capture camera.", error);
    //             this.cameraCapturer.stopVideo();
    //             disableOneVideo.disable(vStopButton);
    //         }
    //     });
    //     vStopButton.addEventListener("click", (evt) => {
    //         try {
    //             disableOneVideo.disable(vStopButton);
    //             this.cameraCapturer.stopVideo();
            
    //         } catch (e) {
    //             disableOneVideo.disable(vStartButton);
    //         }
    //     });

    doStart() {
        if (this.trace) {
            console.log("doStart()");
        }
        if(this.doClose()) {
            this.doFinish();
            // disableOneAudio.disable(stopButton);
            alert("Previous execution was living and killed.");
            return;
        }

        this.websocket = new WebSocket(this.wsUri);
        this.websocket.binaryType = 'arraybuffer';
        this.websocket.onopen = function (evt) {
            if (this.trace) {
                console.log("onopen()");
            }
            onOpen(evt);
        };
        this.websocket.onmessage = function (evt) {
            if (this.trace) {
                console.log("onmessage()");
            }
            this.onMessage(evt);
        };
        this.websocket.onerror = function (evt) {
            if (this.trace) {
                console.log("onerror()");
            }
            this.onError(evt);
        };
        this.websocket.onclose = function (evt) {
            if (this.trace) {
                console.log("onclose()");
            }
            onClose(evt);
        };
    }

    onOpen(evt) {
        this.writeToScreen("$$ CONNECTED");
        // disableOneAudio.disable(startButton);
        this.doSend(this.area);
        this.doRecordAndSend();
        this.timeoutId = setTimeout(
                () => {
                    this.doFinish();
                    // disableOneAudio.disable(stopButton);
                },
                3600000);
    }

    onClose(evt) {
        console.log("onClose(" + evt.code + ", " + evt.reason + ")");
        this.writeToScreen("$$ CLOSED");
        this.doClose();
        this.doFinish();
        // disableOneAudio.disable(stopButton);
    }

    onMessage(evt) {
        if (this.trace) {
            console.log("onMessage()");
        }
        this.writeToScreen("$$ MESSAGE:");
        if (evt.data instanceof Blob) {
            this.writeToScreen("$$ Blob was received. size=" + evt.data.size);
        } else if (evt.data instanceof ArrayBuffer) {
            this.writeToScreen("$$ ArrayBuffer was received. length=" + evt.data.byteLength);
            this.soundPlayer.play(evt.data);
        } else if (typeof evt.data === "string") {
            this.writeToScreen("$$ Json was received: " + evt.data);
            this.processJson(evt.data);
        } else {
            console.error("Unknown event type was received by way of WebSocket binary message.");
        }
    }

    onError(evt) {
        if (this.trace) {
            console.log("onError()");
        }
        this.writeToScreen("$$ ERROR: " + evt.data);
        this.doFinish();
        // disableOneAudio.disable(stopButton);
    }

    doSend(message) {
        if (this.trace) {
            console.log("doSend()");
        }

        if (this.websocket !== null && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(message);
            this.writeToScreen("$$ SENT: " + message);
        } else {
            console.error("Could not send message because websocket was not ready.");
            this.doClose();
            this.doFinish();
            // disableOneAudio.disable(stopButton);
        }
    }

    async doRecordAndSend() {
        if (this.trace) {
            console.log("doRecordAndSend()");
        }

        if (this.soundPlayer === null) {
            let isChrome = window.navigator.userAgent.indexOf("Chrome") >= 0;
            let up = isChrome ? 16000 : 44100;
            console.log("Play frequency is " + up);
            this.soundPlayer = new SoundPlayer(16000, up);
        }
        this.soundPlayer.stop();

        if (this.soundRecorder === null) {
            this.soundRecorder = new SoundRecorder(16000, doSend);
        }
        try {
            await this.soundRecorder.start();
        } catch (error) {
            console.error("Could not record voice.", error);
            this.doClose();
            this.doFinish();
            // disableOneAudio.disable(stopButton);
        }
    }

    doClose() {
        if (this.trace) {
            console.log("doClose()");
        }

        if (this.websocket !== null) {
            if (this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.close();
            }
            this.websocket = null;
            return true;
        }
        return false;
    }

    doFinish() {
        if (this.trace) {
            console.log("doFinish()");
        }
        
        if (this.soundRecorder) {
            this.soundRecorder.stop();
        }
        if (this.timeoutId !== -1) {
            clearTimeout(this.timeoutId);
            this.timeoutId = -1;
        }
    }

    writeToScreen(message) {
        console.log(message);
        
        //output.innerText = message;
        if (false) {
            var pre = document.createElement("span");
            pre.style.wordWrap = "break-word";
            pre.innerHTML = message;
            output.appendChild(pre);
            var br = document.createElement("br");
            output.appendChild(br);
        }
    }

    processJson(jsonString) {
        try {
            var json = JSON.parse(jsonString);
            if (json.recognitionResult) {
                let r = json.recognitionResult; /* 音声認識の結果に関する詳細情報 */
                let s = '';
                let delimiter = r.output.nBest[0].sentence[0].delimiter; /* delimiter:区切り文字 */
                if (delimiter) {
                    r.output.nBest[0].sentence.forEach((v) => {
                        if (s.length > 0) {
                            s += delimiter;
                        }
                        s += v.surface;
                    });
                } else {
                    r.output.nBest[0].sentence.forEach((v) => {
                        s += v.surface;
                    });
                }
                let t = r.resultType; /* 結果タイプ */
                this.writeSrResult(s, t, delimiter);

            } else if (json.translationResult) {
                let r = json.translationResult;
                let s = '';
                let delimiter = r.output.nBest[0].sentence[0].delimiter;
                if (delimiter) {
                    r.output.nBest[0].sentence.forEach((v) => {
                        if (s.length > 0) {
                            s += delimiter;
                        }
                        s += v.surface;
                    });
                } else {
                    r.output.nBest[0].sentence.forEach((v) => {
                        s += v.surface;
                    });
                }
                this.writeMtResult(s, delimiter);

            } else if (json.synthesisResult) {
                //omited.
                
            } else if (json.error) {
                let e = json.error;
                let m =  '';
                if (e.type) {
                    m += 'Type ' + e.type;
                }
                if (e.code) {
                    if (m.length > 0) {
                        m += ', ';
                    }
                    m += 'Code ' + e.code;
                }
                if (e.message) {
                    if (m.length > 0) {
                        m += ', ';
                    }
                    m += 'Message: ' + e.message;
                }
                if (e.description) {
                    if (m.length > 0) {
                        m += ', ';
                    }
                    m += 'Description: ' + e.description;
                }
                if (e.type === 'translation' || e.type === 'synthesis') {
                    this.writeMtResult(m);
                } else {
                    this.writeSrResult(m);
                }
            }
        } catch (syntaxError) {
            console.log(syntaxError);
            this.writeToScreen("!!" + syntaxError);
        }
    }

    lastSrSpan = null; /* フラグ */

    /* ？区切り文字の追加？ */
    addDelimiter(parent, delimiter) {
        if (delimiter && delimiter.length > 0) {
            let d = document.createElement("span");
            d.innerText = delimiter;
            d = parent.appendChild(d);
        }
    }

    /* 「音声認識結果」の欄に入力 */
    writeSrResult(message, type, delimiter) {
        let srdiv = this.srDiv;
        let s;
        if (lastSrSpan === null) {
            s = document.createElement("span");
            s = srdiv.appendChild(s);
            // s.scrollIntoView();
            this.srResult = srdiv.value;
        } else {
            s = lastSrSpan; /* 前回実行時にタイプが'temp'だったらsのClassNameを'redColor'に */
        }
        s.innerText = message;

        if (type === 'temp') {
            s.className = 'redColor';
            lastSrSpan = s; /* 音声認識の結果タイプが'temp'だったらフラグをsに */
        }
        if (type === 'partial') {
            s.className = 'blackColor';
            lastSrSpan = null;
            
            this.addDelimiter(srdiv, delimiter);
            this.srResult = srdiv.value;

        } else if (type === 'last' || type === 'all') {
            s.className = 'blackColor';
            lastSrSpan = null;

            this.addDelimiter(srdiv, delimiter);
            this.srResult = srdiv.value;
        }
    }

    writeMtResult(message, delimiter) {
        let mtdiv = this.mtDiv;
        let s = document.createElement("span");
        s.innerText = message;
        s.className = 'blackColor';
        s = mtdiv.appendChild(s);
        // s.scrollIntoView();

        this.addDelimiter(mtdiv, delimiter);
        this.mtResult = mtdiv.value;
    }
}
window.JsMain = JsMain;
// window.addEventListener("load", init, false);