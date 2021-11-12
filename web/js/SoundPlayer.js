/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//require('./resampler.js');
//require(./util.js);

class SoundPlayer {

    constructor(frequency, upFrequency) {
        
        this.isEndianBig = SoundPlayer.isBigEndian();
        if (this.isEndianBig === true) {
            throw new Error("This running environment endian is big, that is not supported.");
        }
 
        this.frequency = frequency;
        this.outFrequency =upFrequency;//TODO:>=22050;
        
        this.context = new (window.AudioContext || window.webkitAudioContext);
        this.initial_delay_sec = 0;
        this.scheduled_time = 0;
        this.audioSrc = null;
    }

    play(arrayBuffer) {

        let int16 = this.toInt16Array(arrayBuffer);
        let float32 = this.toFloat32Array(int16);

        this.playAudioStream(float32);
    }

    stop() {
        if (this.audioSrc) {
            this.audioSrc.stop();
        }
        this.audioSrc = null;
    }

    //---------------------------------------

    toInt16Array(arrayBuffer) {
        return new Int16Array(arrayBuffer);
    }

    toFloat32Array(int16Array) {
        let pcm16000Hz = int16ToFloat32BitPCM(int16Array);
        let pcmBrowserSupportedHz = pcm16000Hz; //TODO:resampling.
        return pcmBrowserSupportedHz;
    }

    playChunk(audio_src, scheduled_time) {
        if (audio_src.start) {
            audio_src.start(scheduled_time);
        } else {
            audio_src.noteOn(scheduled_time);
        }
    }

    playAudioStream(audio_f32) {

        //stop();
        if (audio_f32.length === 0) {
            return;
        }
        
        const inputArray = new Float32Array(audio_f32.length);
        const resampler = new Resampler(this.frequency, this.outFrequency, 1, inputArray);

        for (let i = 0; i < audio_f32.length; i++) {
            resampler.inputBuffer[i] = audio_f32[i];
        }

        const outLength = resampler.resampler(audio_f32.length);
        const outArray = resampler.outputBuffer;        
        console.log(outLength);

        let audio_buf = this.context.createBuffer(1, outLength, this.outFrequency);
        let audio_src = this.context.createBufferSource();
        let current_time = this.context.currentTime;

        //audio_buf.getChannelData(0).set(outArray);//audio_f32);
        let abuffer = audio_buf.getChannelData(0);
        for (let i = 0; i < outLength; i++) {
            abuffer[i] = outArray[i];
        }

        audio_src.buffer = audio_buf;
        audio_src.connect(this.context.destination);

        this.audioSrc = audio_src;

        if (current_time < this.scheduled_time) {
            this.playChunk(audio_src, this.scheduled_time);
            this.scheduled_time += audio_buf.duration;
        } else {
            this.playChunk(audio_src, current_time);
            this.scheduled_time = current_time + audio_buf.duration + this.initial_delay_sec;
        }
    }
    
    //https://qiita.com/kareharide/items/93f0257ee5c31e239e63
    static isBigEndian() {
        let uInt32 = new Uint32Array([0x11223344]);
        let uInt8 = new Uint8Array(uInt32.buffer);
        return (uInt8[0] === 0x11);
    }
}

