
import Configure from '../service/Configure';

cc.Class({
    extends: cc.Component,

    properties: {
        //数字方块预制板
        numberPrefab: {default: null, type: cc.Prefab},
        //数字方块的背景图数组
        numberBgArray: {default: [], type: cc.SpriteFrame},
    },

    onLoad () {
        //获取父节点脚本组件
        this.parent = this.node.parent.getComponent('Start');

        //方块的宽度
        this.nodeWidth = (this.node.width-18*5)/4;

        //16个节点脚本
        this.nodeArray = [];
        //记录移动前的board
        this.beforeMoveBoard = [];
        //记录每个位置应该移动到的位置
        this.moveToArr = [];
        //记录每个位置移动后是否需要执行动画
        this.isNeedAnimateArr = [];
        //最终的board
        this.board = [];
        //记录每次移动中合并过一次的节点，1:合并过一次，0:没有合并过，为了实现一次移动中一个节点只合并一次
        this.mergeredOnceBoard = [];

        //数组初始化
        for (let i = 0; i < 16; i++) {
            let node = cc.instantiate(this.numberPrefab);
            let k = parseInt(i/4);
            let j = i%4;
            node.position = this.getNodePos(k,j);
            node.width = this.nodeWidth;
            node.height = this.nodeWidth;
            this.node.addChild(node);
            let numberPrefab = node.getComponent('NumberPrefab');
            numberPrefab.setNumberAndColor(0, this.getNumberBgForValue(0));
            this.nodeArray.push(numberPrefab);
            this.beforeMoveBoard.push(0);
            this.moveToArr.push(-1);
            this.isNeedAnimateArr.push(0);
            this.board.push(0);
            this.mergeredOnceBoard.push(0);
        }

        //本次移动是否有merge
        this.canMerge = false;
        //本次是否能移动
        this.canMove = false;
        //记录分数
        this.currentScore = 0;
        //记录步数
        this.step = 0;

        //重置
        this.reset();
    },

    //获取第i行、第j列的位置
    getNodePos: function (i, j) {
        let w = this.nodeWidth;
        return cc.p(18*(j+1)+w*j+w/2, -(18*(i+1)+w*i+w/2));
    },

    //获取对应数值的数字方块的背景图
    getNumberBgForValue: function (value) {
        let index = 0;
        switch (value) {
        case 0: index = 0; break;
        case 2: index = 1; break;
        case 4: index = 2; break;
        case 8: index = 3; break;
        case 16: index = 4; break;
        case 32: index = 5; break;
        case 64: index = 6; break;
        case 128: index = 7; break;
        case 256: index = 8; break;
        case 512: index = 9; break;
        case 1024: index = 10; break;
        case 2048: index = 11; break;
        case 4096: index = 12; break;
        case 8192: index = 13; break;
        case 16384: index = 14; break;
        case 32768: index = 15; break;
        }
        return this.numberBgArray[index];
    },

    //重置
    reset: function () {
        //参数重置
        for (let i = 0; i < 16; i++) {
            let numberPrefab = this.nodeArray[i];
            numberPrefab.setNumberAndColor(0, this.getNumberBgForValue(0));
            this.board[i] = 0;
            this.beforeMoveBoard[i] = 0;
            this.moveToArr[i] = -1;
            this.isNeedAnimateArr[i] = 0;
            this.mergeredOnceBoard[i] = 0;
        }
        this.canMerge = false;
        this.canMove = false;
        this.currentScore = 0;
        this.step = 0;

        //随机生成两个数字
        this.newNodeShowAnimation = false;
        this.randomNode();
        this.randomNode();
        this.newNodeShowAnimation = true;

        //允许操作
        this.enableTouch();

        //通知上层游戏开始
        this.parent.gameStart();
    },

    //非0位置随机出一个数:2或4（比赛模式为8或16）
    randomNode: function () {
        let zeroArr = [];
        for (let i = 0; i < this.nodeArray.length; i++) {
            if (this.nodeArray[i].number === 0) {
                zeroArr.push(i);
            }
        }
        if (zeroArr.length !== 0) {
            let index = Math.floor(Math.random() * zeroArr.length);
            if (index === zeroArr.length) {
                index = zeroArr.length - 1;
            }
            let ranNum = Math.random() < 0.7 ? 2 : 4;
            this.board[zeroArr[index]] = ranNum;
            let tmpNumberPrefab = this.nodeArray[zeroArr[index]];
            tmpNumberPrefab.setNumberAndColor(ranNum, this.getNumberBgForValue(ranNum));
            if (this.newNodeShowAnimation) {
                let node = tmpNumberPrefab.node;
                node.scale = 0.1;
                let action1 = cc.scaleTo(0.05,1.0,1.0).easing(cc.easeInOut(3));
                node.runAction(action1);
            }
        }
    },

    enableTouch: function () {
        this.node.parent.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.parent.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    },

    disableTouch: function () {
        this.node.parent.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.parent.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    },

    onTouchStart: function (event) {
        this.startPos = event.getLocation();
    },

    onTouchEnd: function (event) {
        let endPos = event.getLocation();
        let deltaX = endPos.x - this.startPos.x;
        let deltaY = endPos.y - this.startPos.y;
        let offset = 100;
        if (Math.abs(deltaX) < offset && Math.abs(deltaY) < offset) {
            return;
        }
        let direction;
        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
            direction = deltaX>0 ? 'right' : 'left';
        } else {
            direction = deltaY>0 ? 'up' : 'down';
        }
        this.move(direction);
    },

    //移动
    move: function (direction) {
        //记录移动前的board
        for(let i = 0; i < 16; i++) {
            this.beforeMoveBoard[i] = this.board[i];
            this.moveToArr[i] = -1;
            this.isNeedAnimateArr[i] = 0;
            this.mergeredOnceBoard[i] = 0;
        }
        this.canMerge = false;
        this.canMove = false;
        //计算移动
        switch(direction){
        case 'up':
            this.canMove = this.canMoveUp();
            if(this.canMove){
                this.moveUp();
            }
            break;
        case 'down':
            this.canMove = this.canMoveDown();
            if(this.canMove){
                this.moveDown();
            }
            break;
        case 'left':
            this.canMove = this.canMoveLeft();
            if(this.canMove){
                this.moveLeft();
            }
            break;
        case 'right':
            this.canMove = this.canMoveRight();
            if(this.canMove){
                this.moveRight();
            }
            break;
        }
        //开始移动
        if (this.canMove) {
            this.step++;
            this.showMoveAnimation();
            if (this.canMerge) {
                Configure.playAudio('merge');
            } else {
                Configure.playAudio('move');
            }
            this.scheduleOnce(()=>{
                this.updateBoard();
                this.showScaleAnimation(direction);
                if (!this.isOver()) {
                    this.randomNode();
                    if (this.isOver()) {
                        this.disableTouch();
                        // 通知上层游戏结束
                        this.parent.gameOver();
                    }
                }
            }, 0.05);
        }
    },

    canMoveLeft: function () {
        for (let i = 0; i <= 12; i += 4) {
            for (let k = 1; k < 4; k++) {
                if (this.board[i+k] !== 0) {
                    if (this.board[i+k-1] === 0 || this.board[i+k] === this.board[i+k-1]) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    canMoveRight: function () {
        for (let i = 3; i <= 15; i += 4) {
            for (let k = 1; k < 4; k++) {
                if (this.board[i-k] !== 0) {
                    if (this.board[i-k+1] === 0 || this.board[i-k] === this.board[i-k+1]) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    canMoveUp: function () {
        for (let i = 0; i < 4; i++) {
            for (let k = 1; k < 4; k++) {
                if (this.board[i+4*k] !== 0) {
                    if (this.board[i+4*(k-1)] === 0 || this.board[i+4*k] === this.board[i+4*(k-1)]) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    canMoveDown: function () {
        for (let i = 12; i < 16; i++) {
            for (let k = 1; k < 4; k++) {
                if (this.board[i-4*k] !== 0) {
                    if (this.board[i-4*(k-1)] === 0 || this.board[i-4*k] === this.board[i-4*(k-1)]) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    moveUp: function () {
        // 调整层级
        for (let i = 0; i < 12; i++) {
            this.nodeArray[i+4].node.zIndex = this.nodeArray[i].node.zIndex+1;
        }
        //计算最终board
        let j;
        for (let i = 4; i < this.nodeArray.length; i++) {
            j = i;
            while (j >= 4) {
                this.merge(j-4, j);
                j -= 4;
            }
        }
        //计算每个位置应该移动到的位置
        for (let i = 0; i < 4; i++) {
            let si = 0;
            let ei = 0;
            let sum = 0;
            for (let k = 0; k < 4; k++) {
                let cur = this.board[i+4*k];
                if (cur !== 0) {
                    while (ei < 4 && sum < cur) {
                        sum += this.beforeMoveBoard[i+4*ei];
                        ei++;
                        if (cur === sum) {
                            let noneZero = 0;
                            for (let m = si; m < ei; m++) {
                                if (this.beforeMoveBoard[i+4*m] !== 0) {
                                    noneZero++;
                                    this.moveToArr[i+4*m] = i+4*k;
                                }
                            }
                            if (noneZero > 1) {
                                this.isNeedAnimateArr[i+4*k] = 1;
                            }
                            si = ei;
                            sum = 0;
                            break;
                        }
                    }
                }
            }
        }
    },

    moveDown: function () {
        for (let i = 15; i > 3; i--) {
            this.nodeArray[i-4].node.zIndex = this.nodeArray[i].node.zIndex+1;
        }
        let j;
        for (let i = 11; i >= 0; i--) {
            j = i;
            while (j <= 11) {
                this.merge(j+4, j);
                j += 4;
            }
        }
        for (let i = 12; i < 16; i++) {
            let si = 0;
            let ei = 0;
            let sum = 0;
            for (let k = 0; k < 4; k++) {
                let cur = this.board[i-4*k];
                if (cur !== 0) {
                    while (ei < 4 && sum < cur) {
                        sum += this.beforeMoveBoard[i-4*ei];
                        ei++;
                        if (cur === sum) {
                            let noneZero = 0;
                            for (let m = si; m < ei; m++) {
                                if (this.beforeMoveBoard[i-4*m] !== 0) {
                                    noneZero++;
                                    this.moveToArr[i-4*m] = i-4*k;
                                }
                            }
                            if (noneZero > 1) {
                                this.isNeedAnimateArr[i-4*k] = 1;
                            }
                            si = ei;
                            sum = 0;
                            break;
                        }
                    }
                }
            }
        }
    },

    moveLeft: function () {
        for (let i = 0; i <= 12; i += 4) {
            for (let k = 0; k < 3; k++) {
                this.nodeArray[i+k+1].node.zIndex = this.nodeArray[i+k].node.zIndex+1;
            }
        }
        let j;
        for (let i = 1; i < this.nodeArray.length; i++) {
            j=i;
            while (j%4 !== 0) {
                this.merge(j-1, j);
                j -= 1;
            }
        }
        for(let i = 0; i <= 12; i += 4) {
            let si = 0;
            let ei = 0;
            let sum = 0;
            for (let k = 0; k < 4; k++) {
                let cur = this.board[i+k];
                if (cur !== 0) {
                    while (ei < 4 && sum < cur) {
                        sum += this.beforeMoveBoard[i+ei];
                        ei++;
                        if (cur === sum) {
                            let noneZero = 0;
                            for (let m = si; m < ei; m++) {
                                if (this.beforeMoveBoard[i+m] !== 0) {
                                    noneZero++;
                                    this.moveToArr[i+m] = i+k;
                                }
                            }
                            if (noneZero > 1) {
                                this.isNeedAnimateArr[i+k] = 1;
                            }
                            si = ei;
                            sum = 0;
                            break;
                        }
                    }
                }
            }
        }
    },

    moveRight: function () {
        for (let i = 3; i <= 15; i += 4) {
            for (let k = 0; k < 3; k++) {
                this.nodeArray[i-k-1].node.zIndex = this.nodeArray[i-k].node.zIndex+1;
            }
        }
        let j;
        for (let i = 14; i >= 0; i--) {
            j = i;
            while (j%4 !== 3) {
                this.merge(j+1, j);
                j += 1;
            }
        }
        for (let i = 3; i <= 15; i += 4) {
            let si = 0;
            let ei = 0;
            let sum = 0;
            for(let k = 0; k < 4; k++) {
                let cur = this.board[i-k];
                if (cur !== 0) {
                    while (ei < 4 && sum < cur) {
                        sum += this.beforeMoveBoard[i-ei];
                        ei++;
                        if (cur === sum) {
                            let noneZero = 0;
                            for (let m = si; m < ei; m++) {
                                if (this.beforeMoveBoard[i-m] !== 0) {
                                    noneZero++;
                                    this.moveToArr[i-m] = i-k;
                                }
                            }
                            if (noneZero > 1) {
                                this.isNeedAnimateArr[i-k] = 1;
                            }
                            si = ei;
                            sum = 0;
                            break;
                        }
                    }
                }
            }
        }
    },

    //移动动画
    showMoveAnimation: function () {
        for (let i = 0; i < this.moveToArr.length; i++) {
            if (this.moveToArr[i] !== -1) {
                let pre = this.moveToArr[i];
                let cur = i;
                let node = this.nodeArray[cur].node;
                let pos = this.getNodePos(parseInt(pre/4), pre%4);
                node.runAction(cc.moveTo(0.05, pos));
            }
        }
    },

    //刷新界面
    updateBoard: function () {
        for (let i = 0; i < this.nodeArray.length; i++) {
            let k = parseInt(i/4);
            let j = i%4;
            let numberPrefab = this.nodeArray[i];
            numberPrefab.node.position = this.getNodePos(k,j);
            numberPrefab.setNumberAndColor(this.board[i], this.getNumberBgForValue(this.board[i]));
        }
    },

    //合并动画
    showScaleAnimation: function (direction) {
        for (let i = 0; i < this.isNeedAnimateArr.length; i++) {
            if (this.isNeedAnimateArr[i] !== 0) {
                //缩放动画
                let node = this.nodeArray[i].node;
                let action1 = cc.scaleTo(0.05, 1.2, 1.2);
                let action2 = cc.scaleTo(0.05, 1.0, 1.0);
                node.runAction(cc.sequence(action1, action2));
                //碰撞动画、缓冲动画
                let animationNode = this.nodeArray[i].animationNode;
                let positon3 = cc.p(node.x, node.y);
                let positon4 = cc.p(node.x, node.y);
                let amplitude = 10;
                switch(direction){
                case 'up':
                    animationNode.rotation = 90;
                    positon3 = cc.p(node.x, node.y + amplitude);
                    break;
                case 'down':
                    animationNode.rotation = -90;
                    positon3 = cc.p(node.x, node.y - amplitude);
                    break;
                case 'left':
                    animationNode.rotation = 0;
                    positon3 = cc.p(node.x - amplitude, node.y);
                    break;
                case 'right':
                    animationNode.rotation = 180;
                    positon3 = cc.p(node.x + amplitude, node.y);
                    break;
                }
                animationNode.active = true;
                Configure.playAnimation(animationNode, 'impact', 'Normal', function () {
                    animationNode.active = false;
                });
                let action3 = cc.moveTo(0.05, positon3);
                let action4 = cc.moveTo(0.05, positon4);
                node.runAction(cc.sequence(action3, action4));
            }
        }
    },

    //当前最大的数
    maxNumber: function () {
        let max = 0;
        for (let i = 0; i < this.board.length; i++) {
            if (max < this.board[i]) {
                max = this.board[i];
            }
        }
        return max;
    },

    //是否无法移动了
    isOver: function () {
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[i] === 0) {
                return false;
            }
            if (i%4 !== 3) {
                if (this.board[i] === this.board[i+1]) {
                    return false;
                }
            }
            if (i < 12) {
                if (this.board[i] === this.board[i+4]) {
                    return false;
                }
            }
        }
        return true;
    },

    //合并两个格子的数, pre: 要移动到的index，cur：即将要移动的index
    merge: function (pre, cur) {
        if (this.board[cur] !== 0) {
            if (this.board[pre] === 0) {
                this.mergeredOnceBoard[pre] = this.mergeredOnceBoard[cur];
                this.mergeredOnceBoard[cur] = 0;
                this.board[pre] = this.board[cur];
                this.board[cur] = 0;
            } else if (this.board[pre] === this.board[cur]) {
                if (this.mergeredOnceBoard[pre] === 0 && this.mergeredOnceBoard[cur] === 0) {
                    this.mergeredOnceBoard[pre] = 1;
                    this.canMerge = true;
                    this.board[pre] += this.board[cur];
                    this.board[cur] = 0;
                    //通知上层拼成256或更大的数
                    if (this.board[pre] >= 128) {
                        this.parent.chubuSmile(this.board[pre]);
                    }
                    //刷新当前分数
                    this.currentScore += this.board[pre];
                    //通知上层刷新分数
                    this.parent.updateScore(this.currentScore);
                }
            }
        }
    },

});
