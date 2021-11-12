/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

Date.prototype.toLocalISOString = () => {
    let tzoffset = new Date().getTimezoneOffset(); //1;//0;//-539;//-541;
    let now = Date.now();
    if (tzoffset === 0) {
        return new Date(now).toISOString();
    }
    let tzoffseth = parseInt(Math.abs(tzoffset / 60));
    let tzoffsethString = tzoffseth < 10 ? '0' + tzoffseth : tzoffseth;
    let tzoffsetm = Math.abs(tzoffset % 60);
    let tzoffsetmString = tzoffsetm < 10 ? '0' + tzoffsetm : tzoffsetm;
    let tzoffsetString;
    if (tzoffset < 0) {
        tzoffsetString = '+' + tzoffsethString + ':' + tzoffsetmString;
    } else {
        tzoffsetString = '-' + tzoffsethString + ':' + tzoffsetmString;
    }
    let tzoffsetms = tzoffset * 60 * 1000;
    let tz = (new Date(now - tzoffsetms)).toISOString().slice(0, -1);
    return tz + tzoffsetString;
};
