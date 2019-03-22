
/*
--------------------函数中使用方法------------------
注意父节点content的Anchor坐标是(0.5, 1),不需要添加layout
如果不服用则添加layout

使用方法：
    const ScrollViewManager = require('ListViewManager');
初始化
    // spawnCount = 15; // 实际创建的项数量
    this.ScrollViewManager = new ScrollViewManager(this.itemTemplate, this.scrollContent, this.scrollView, this, 15);
    this.updateTimer = 0;
    // 复用列表初始化，content不添加layout
    this.ScrollViewManager.initialize(dataArr);
    //不复用时候使用这个函数初始化，content添加layout
    this.ScrollViewManager.reloadData(dataArr);
设置item参数
    convertCell: function (cell, data, index) {
        cell.getComponent('Item').updateItem(data.index, index);
    },
更新位置
给scrollView添加监听滚动事件，有回调时候处理
    scrollEvent: function(sender, event) {
        this.updateTimer ++;
        if (this.updateTimer < 3) {
            return; // we don't need to do the math every frame
        }
        this.updateTimer = 0;    
        //更新位置和数据
        this.ScrollViewManager.updatePosition(this.rankList);
    },

    
*/

const ScrollViewManager = function (cellPrefab, listViewContent, scrollView, target, spawnCount) {
    this.spawnCount = spawnCount; // 实际创建的项数量
    // this.totalCount = totalCount; // 在列表中显示的项数量
    this.spacing = 0; // 项之间的间隔大小

    this.itemTemplate = cc.instantiate(cellPrefab);
    this.itemPrefab = cellPrefab;
    this.scrollView = scrollView;

    this.content = listViewContent;
    this.items = []; // 存储实际创建的项数组
    this.updateTimer = 0;  
    this.updateInterval = 0.2;
    // 使用这个变量来判断滚动操作是向上还是向下
    this.lastContentPosY = 0; 

    // 设定缓冲矩形的大小为实际创建项的高度累加，当某项超出缓冲矩形时，则更新该项的显示内容
    this.bufferZone = this.spawnCount * (this.itemTemplate.height + this.spacing) / 2;

    // 复用列表初始化，content不添加layout
    this.initialize = function (dataArr) {
        // 获取整个列表的高度
        this.content.height = dataArr.length * (this.itemTemplate.height + this.spacing) + this.spacing;
        
        this.content.removeAllChildren();
        this.items = [];
        
        let actualItemNum = this.spawnCount > dataArr.length ? dataArr.length : this.spawnCount;
        for (let i = 0; i < actualItemNum; ++i) { // spawn items, we only need to do this once
            let item = cc.instantiate(this.itemPrefab);
            this.content.addChild(item);
            
            // 设置该item的坐标（注意父节点content的Anchor坐标是(0.5, 1)，所以item的y坐标总是负值）
            item.setPositionY(-item.height * (0.5 + i));
            if (typeof target.convertCell === 'function') {
                target.convertCell(item, dataArr[i], i);
            }
            item.reuse = 0;
            this.items.push(item);
        }
        this.scrollView.scrollToTop(0.1);
    };

    //不复用时候使用这个函数初始化，content添加layout
    this.reloadData = function (dataArr){
        this.content.removeAllChildren();
        let actualItemNum = this.spawnCount > dataArr.length ? dataArr.length : this.spawnCount;
        for (let i = 0; i < actualItemNum; ++i) { // spawn items, we only need to do this once
            let item = cc.instantiate(this.itemPrefab);
            this.content.addChild(item);
            
            if (typeof target.convertCell === 'function') {
                target.convertCell(item, dataArr[i], i);
            }
        }
    };

    // 返回item在ScrollView空间的坐标值
    this.getPositionInView = function (item) {
        let worldPos = item.parent.convertToWorldSpaceAR(item.position);
        let viewPos = this.scrollView.node.convertToNodeSpaceAR(worldPos);
        return viewPos;
    };

    // 每帧调用一次。根据滚动位置动态更新item的坐标和显示(所以spawnCount可以比totalCount少很多)
    this.updatePosition = function(dataArr) {
        // this.updateTimer += dt;
        // if (this.updateTimer < this.updateInterval) {
        //     return; // we don't need to do the math every frame
        // }
        // this.updateTimer = 0;
        let items = this.items;
        // 如果当前content的y坐标小于上次记录值，则代表往下滚动，否则往上。
        let isDown = this.content.y < this.lastContentPosY;
        // 实际创建项占了多高（即它们的高度累加）
        let offset = (this.itemTemplate.height + this.spacing) * items.length;
        let newY = 0;

        if(isDown){
            for (let i = 0; i < items.length; ++i) {
                let viewPos = this.getPositionInView(items[i]);
                // 提前计算出该item的新的y坐标
                newY = items[i].y + offset;
                // 如果往下滚动时item已经超出缓冲矩形，且newY未超出content上边界，
                // 则更新item的坐标（即上移了一个offset的位置），同时更新item的显示内容
                if (viewPos.y < -this.bufferZone && newY < 0) {
                    items[i].reuse --;
                    if (typeof target.convertCell === 'function') {
                        target.convertCell(items[i], dataArr[this.spawnCount*items[i].reuse + i], i);
                        items[i].setPositionY(newY);
                        
                    }
                    
                }
            }
        }else{
            for (let i = 0; i < items.length; ++i) {
                let viewPos = this.getPositionInView(items[i]);
                // 提前计算出该item的新的y坐标
                newY = items[i].y - offset;
                // 如果往上滚动时item已经超出缓冲矩形，且newY未超出content下边界，
                // 则更新item的坐标（即下移了一个offset的位置），同时更新item的显示内容
                if (viewPos.y > this.bufferZone && newY > -this.content.height) {
                    items[i].reuse++;
                    if (typeof target.convertCell === 'function') {
                        target.convertCell(items[i], dataArr[this.spawnCount*items[i].reuse + i], i);
                        items[i].setPositionY(newY);
                    }
                    
                }
            }
        }
        
        // 更新lastContentPosY和总项数显示
        this.lastContentPosY = this.content.y;
        
    };

};

module.exports = ScrollViewManager;