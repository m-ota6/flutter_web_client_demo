/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


class DisableOne {
    
    constructor(array, firstDisabled) {
        this.objects = array;
        for (let i in this.objects) {
            const o = this.objects[i];
            if (o === firstDisabled) {
                o.disabled = true;
            } else {
                o.disabled = false;
            }
        }
    }
    
    disable(disabled) {
        for (let i in this.objects) {
            const o = this.objects[i];
            if (o === disabled) {
                o.disabled = true;
            } else {
                o.disabled = false;
            }
        }
    }
    
}