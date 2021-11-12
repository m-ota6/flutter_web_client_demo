/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//require('./resampler.js');
//require('./util.js');

class SoundRecorder {

    constructor(frequency, provide) {

        this.isEndianBig = SoundRecorder.isBigEndian();
        if (this.isEndianBig === true) {
            throw new Error("This running environment endian is big, that is not supported.");
        }

        this.frequency = frequency;
        this.provide = provide;
        
        this.context = new (window.AudioContext || window.webkitAudioContext);
        this.resultArray = [];
        this.stream = null;
        this.processor = null;
        this.microphone = null;
        this.trace = false;
    }

    //---------------------------------------
    
    handleFailure(error) {
        throw new Error("Failed to get media stream. " + error);
    }

    handleSuccess(stream) {
        console.log("Got media stream.");
        this.stream = stream;
        
        const bufferLength = 16384;//4096;
        const inputArray = new Float32Array(bufferLength);
        this.microphone = this.context.createMediaStreamSource(stream);
        this.processor = this.context.createScriptProcessor(bufferLength, 1, 1);
        const resampler = new Resampler(this.context.sampleRate, this.frequency, 1, inputArray);

        this.processor.onaudioprocess = (event) => {
            if (this.trace) {
                console.log("onaudioprocess()");
            }

            const recordedArray = event.inputBuffer.getChannelData(0);
            for (let i = 0; i < recordedArray.length; i++) {
                inputArray[i] = recordedArray[i];
            }
            const outLength = resampler.resampler(recordedArray.length);
            const outArray = resampler.outputBuffer;

            if (this.trace) {
                console.log(outLength);
            }

            if (outLength === 0) {
                console.log("resampler returned no data.");
                return;
            }

            for (let i = 0; i < outLength; i++) {
                this.resultArray.push.call(this.resultArray, outArray[i]);
            }

            if (this.trace) {
                console.log("Data length is " + this.resultArray.length);
            }

            if (this.resultArray.length > 16000) { //1s=16000, 0.5s=8000;
                // Send!!
                if (this.trace) {
                    console.log("Data in the buffer become more than the threshold.");
                }
                
                const float32Array = this.toFloat32ArrayFromArray(this.resultArray);
                const int32Array = this.toInt16Array(float32Array);
                this.provide(int32Array.buffer);

                this.resultArray = [];

            } else {
                // Wait until the condition is filled.
                if (this.trace) {
                    console.log("Data were stored in the buffer.");
                }
            }
        }

        this.microphone.connect(this.processor);
        this.processor.connect(this.context.destination);
    }

    async start() {
        if (this.trace) {
            console.log("SoundRecorder#start()");
        }    
        stop();
        this.resultArray = [];
        
//        navigator.mediaDevices.getUserMedia({audio: true, video: false})
//                .then((stream) => { this.handleSuccess(stream); })
//                .catch((error) => { this.handleFailure(error); });
        try {
            let stream = await navigator.mediaDevices.getUserMedia(
                    {
                        audio: {
                            echoCancellation: true,
                            echoCancellationType: 'system',
                            noiseSuppression: true
                        },
                        video: false
                    });
                    //System echo cancellation is enabled from Chrome M71 only on Windows and Mac OS. 
            this.handleSuccess(stream);
        } catch(error) {
            this.handleFailure(error);
        }
        return true;
    }

    stop() {
        if (this.trace) {
            console.log("SoundRecorder#stop()");
        }

        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }

        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach((track) => { track.stop(); });
            this.stream = null;
        } else {
            return false;
        }        
        
        //送り残し分のデータを送る。
        if (this.resultArray.length > 0) {
            if (this.trace) {
                console.log("will last data.");
            }

            const float32Array = this.toFloat32ArrayFromArray(this.resultArray);
            const int32Array = this.toInt16Array(float32Array);
            this.provide(int32Array.buffer);
        }
        if (this.trace) {
            console.log("will send Zero data.");
        }

        //必ず空データを送る。
        var uint8Array = new Uint8Array(0);
        this.provide(uint8Array.buffer);
        
        return true;
    }
    
    toFloat32ArrayFromArray(array) {
        let float32Array = new Float32Array(array.length);
        for (let i = 0; i < array.length; i++) {
            float32Array[i] = array[i];
        }
        return float32Array;
    }

    toInt16Array(float32Array) {
        return floatTo16BitPCM(float32Array);
    }

    //https://qiita.com/kareharide/items/93f0257ee5c31e239e63
    static isBigEndian() {
        let uInt32 = new Uint32Array([0x11223344]);
        let uInt8 = new Uint8Array(uInt32.buffer);
        return (uInt8[0] === 0x11);
    }
}