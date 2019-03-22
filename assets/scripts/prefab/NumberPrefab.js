
cc.Class({
    extends: cc.Component,

    properties: {
        // bgColorNode:cc.Node,
        // numberLabel:cc.Label,
        number:0,
        bg:cc.Sprite,
        animationNode: cc.Node,
    },

    onLoad () {
        // this.colorDic = {
        //     0:{color:'#7c736a',bgColor:'#ccc0b2',fontSize:90},
        //     2:{color:'#7c736a',bgColor:'#eee4da',fontSize:90},
        //     4:{color:'#7c736a',bgColor:'#ece0c8',fontSize:90},
        //     8:{color:'#fff7eb',bgColor:'#f2b179',fontSize:90},
        //     16:{color:'#fff7eb',bgColor:'#f59563',fontSize:90},
        //     32:{color:'#fff7eb',bgColor:'#f57c5f',fontSize:90},
        //     64:{color:'#fff7eb',bgColor:'#f65d3b',fontSize:90},
        //     128:{color:'#fff7eb',bgColor:'#edce71',fontSize:70},
        //     256:{color:'#fff7eb',bgColor:'#edcc61',fontSize:70},
        //     512:{color:'#fff7eb',bgColor:'#ecc850',fontSize:70},
        //     1024:{color:'#fff7eb',bgColor:'#edc53f',fontSize:60},
        //     2048:{color:'#fff7eb',bgColor:'#eec22e',fontSize:60}
        // };
    },

    setNumberAndColor:function(value, spriteFrame){
        this.number = value;
        this.bg.spriteFrame = spriteFrame;
        // this.numberLabel.string = value>0 ? value : '';
        // let color = this.colorDic[value].color;
        // let bgColor = this.colorDic[value].bgColor;
        // let fontSize = this.colorDic[value].fontSize;
        // this.numberLabel.fontSize = fontSize;
        // this.numberLabel.node.color = new cc.Color().fromHEX(color);
        // this.bgColorNode.color = new cc.Color().fromHEX(bgColor);
    },
});
