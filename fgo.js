"use strict";
const AnyProxy = require("anyproxy");
const exec = require('child_process').exec;
const fs = require("fs");

// 检查并生成根证书（已生成则不会再次生成）
if (!AnyProxy.utils.certMgr.ifRootCAFileExists()) {
    AnyProxy.utils.certMgr.generateRootCA((error, keyPath) => {
        if (!error) {
            const certDir = require('path').dirname(keyPath);
            console.log('根证书路径: ', certDir);
            const isWin = /^win/.test(process.platform);
            if (isWin) {
                exec('start .', { cwd: certDir });
            }
        } else {
            console.error('根证书生成失败', error);
        }
    });
}

// 自定义规则
const options = {
    port: 8001,
    rule: {
        summary: "Fate/Grand Order",
        *beforeSendRequest(requestDetail) {
    
            let requestData = requestDetail.requestData.toString();
            let newRequestData = requestData;

            // 撤退胜利
            let verify1 = (requestDetail.requestData.indexOf("key=battleresult")>0);
            let verify2 = (requestDetail.url.indexOf("ac.php")>0);
            if (verify1 && verify2) {
    
                // 拆分requestData
                let data = requestData.split("&");
    
                // 获取result
                data[11]= customUrlDecode(data[11]);
                let temp = data[11].substring(7);
                // 获取json
                let json=JSON.parse(temp);
                if(json.battleResult == 3){

                    // 获取用户ID
                    let userId = data[12].substring(7);
                    let fileName = userId+".txt";
                    // 从文件中读取随机数
                    let randomNum = parseInt(fs.readFileSync(fileName), 10);

                    newRequestData = "";
                    // 修改撤退为胜利
                    json.battleResult = 1;
                    // 修改回合数为前面生成的随机数
                    json.elapsedTurn = randomNum;
                    // 修改为无敌方存活
                    json.aliveUniqueIds = [];
                    temp=JSON.stringify(json);
                    // 重新拼接requestData
                    data[11]= "result="+customUrlEncode(temp);
                    let i=1;
                    data.forEach( value => {
                        newRequestData += value;
                        if(i<data.length){
                            newRequestData+="&";
                            ++i;
                        }
                    });
                }
    
                return {
                    requestData: newRequestData
                };
            }

            // 随机生成撤退胜利的回合数，这里的字符串填xfgo里填写的地址的host部分
            // 如xfgo里填写的是 http://com.locbytes.xfgo.random/ 那么对应的字符串如下
            const randomServerAddress="com.locbytes.xfgo.random";
            if(requestDetail.url.indexOf(randomServerAddress)>0){
                let userId=requestDetail.requestOptions.path.substring(2);
                // 生成3~17的随机数
                let randomNum=3+parseInt(Math.random()*15, 10);
                // 将随机数写入txt文件，文件名为用户ID
                let fileName=userId+".txt";
                fs.writeFileSync(fileName,randomNum);
                // 将生成的随机数发回给客户端
                return {
                    response: {
                        statusCode: 200,
                        header: { 'Content-Type': 'text/html' },
                        body: randomNum.toString()
                    }
                };
            }

        },
        *beforeSendResponse(requestDetail, responseDetail) {
    
            let response = Object.assign({}, responseDetail.response);
            let verify1 = (requestDetail.requestData.indexOf("key=battlesetup")>0);
            let verify2 = (requestDetail.requestData.indexOf("key=battleresume")>0);
            let verify3 = (requestDetail.url.indexOf("ac.php")>0);

            if( (verify1||verify2) && verify3 ){
    
                let rawBody = response.body.toString();
                rawBody = rawBody.replace(/%3D/g, "=");
                let jsonStr = new Buffer(rawBody, "base64").toString();
                let json = JSON.parse(jsonStr);

                // 需要使用我的xfgo模块，否则数据错误201
                json.sign="";
    
                // 计算友方数量+礼装数量+敌方数量
                let Num=json.cache.replaced.battle[0].battleInfo.userSvt.length;
                // 计算友方数量
                let friendNum=json.cache.replaced.battle[0].battleInfo.myDeck.svts.length;
                // 计算礼装数量
                let equipNum=json.cache.replaced.battle[0].battleInfo.myUserSvtEquip.length;
                // 计算战斗回合数
                let battleNum=json.cache.replaced.battle[0].battleInfo.enemyDeck.length;
                // 计算敌方数量
                let i=0;
                let enemyNum=0;
                while(i<battleNum){
                    enemyNum=enemyNum+json.cache.replaced.battle[0].battleInfo.enemyDeck[i].svts.length;
                    ++i;
                }
                
                // 修改敌方数据
                i=0;
                i=friendNum+equipNum;
                while(i<Num){
                    // 修改敌方生命值
                    json.cache.replaced.battle[0].battleInfo.userSvt[i].hp="1000";
                    // 修改敌方攻击力
                    json.cache.replaced.battle[0].battleInfo.userSvt[i].atk="1";
                    ++i;
                }
                
                // 修改己方英灵数据
                i=0;
                while(i<friendNum){
                    // 修改己方生命值
                    json.cache.replaced.battle[0].battleInfo.userSvt[i].hp="500000";
                    // 修改己方攻击力
                    json.cache.replaced.battle[0].battleInfo.userSvt[i].atk="50000";
                    // 修改己方宝具五宝
                    json.cache.replaced.battle[0].battleInfo.userSvt[i].treasureDeviceLv="5";
                    // 修改己方技能满级
                    json.cache.replaced.battle[0].battleInfo.userSvt[i].skillLv1="10";
                    json.cache.replaced.battle[0].battleInfo.userSvt[i].skillLv2="10";
                    json.cache.replaced.battle[0].battleInfo.userSvt[i].skillLv3="10";
                    // 修改己方技能为高速神言
                    //json.cache.replaced.battle[0].battleInfo.userSvt[i].skillId1="89550";
                    //json.cache.replaced.battle[0].battleInfo.userSvt[i].skillId2="89550";
                    //json.cache.replaced.battle[0].battleInfo.userSvt[i].skillId3="89550";
                    ++i;
                }
    
                let newJsonStr = JSON.stringify(json);
    
                // 还原中文Unicode数据
                let cnReg = /[\u0391-\uFFE5]/gm;
                if (cnReg.test(newJsonStr)) {
                    newJsonStr = newJsonStr.replace(cnReg,
                    function(str) {
                        return "\\u" + str.charCodeAt(0).toString(16)
                    });
                }
                newJsonStr=newJsonStr.replace(/\//g, "\\\/");
    
                let newBodyStr = new Buffer(newJsonStr).toString("base64");
                newBodyStr = newBodyStr.replace(/=/g, "%3D");
                let newBody = new Buffer(newBodyStr);
                response.body = newBody;
            }
    
            return {
                response: response
            };
        },
        *beforeDealHttpsRequest(requestDetail) {
    
            // iOS设备
            if(requestDetail.host.indexOf("s2-ios-fate.bilibiligame.net")>=0){
                // iOS设备暂时无可用的科技解决方案
                return false;
            }
    
            // Android设备
            if(requestDetail.host.indexOf("s2-bili-fate.bilibiligame.net")>=0){
                return true;
            }
        },
    },
    silent: true
};
const proxyServer = new AnyProxy.ProxyServer(options);
proxyServer.start();
console.log( "代理已启动，端口号：" + options.port);

// 因使用decodeURI和encodeURI会出现未知错误造成201错误，故使用自定义转换
function customUrlEncode(data) {
    data=data.replace(/"/g,'%22');
    data=data.replace(/'/g,'%27');
    data=data.replace(/:/g,'%3a');
    data=data.replace(/,/g,'%2c');
    data=data.replace(/\[/g,'%5b');
    data=data.replace(/]/g,'%5d');
    data=data.replace(/{/g,'%7b');
    data=data.replace(/}/g,'%7d');
    return data;
}

function customUrlDecode(data) {
    data=data.replace(/%22/g,'"');
    data=data.replace(/%27/g,"'");
    data=data.replace(/%3a/g,':');
    data=data.replace(/%2c/g,',');
    data=data.replace(/%5b/g,'[');
    data=data.replace(/%5d/g,']');
    data=data.replace(/%7b/g,'{');
    data=data.replace(/%7d/g,'}');
    return data;
}

function randomNum(minNum,maxNum){ 
    switch(arguments.length){ 
        case 1: 
            return parseInt(Math.random()*minNum+1,10); 
            break; 
        case 2: 
            return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10); 
            break; 
        default: 
            return 0; 
            break; 
    }
} 
