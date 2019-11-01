'use strict';

function updatePopupList(){
  
};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
    var target;
    
    if(request.data != undefined){
      target = request.data;
    }

    // select message
    switch(request.msg){
      case "init":
        chrome.storage.local.get(["data"], (result)=>{
          if(Object.keys(result).length === 0){
            var jsonObj = {};
            jsonObj["data"] = target;
            chrome.storage.local.set(jsonObj, function(){
              sendResponse(undefined);
            });
          }else{
            console.log("retrieved data");
            console.table(result["data"]);
            sendResponse(result["data"]);
          }
        });
        break;

      case "wipeAll":
        // 모든 차단 리스트, 옵션 삭제
        chrome.storage.local.clear(function(){
          var error = chrome.runtime.lastError;
          if (error){
            console.error(error);
            sendResponse(false);
          }else{
            sendResponse(true);
          }
        });
        break;

      case "addBlockMember":
        chrome.storage.local.get(["data"], function(result){
          var data;
          if(Object.keys(result).length === 0){
            data = undefined;
          }else{
            data = result["data"];

            var blocked_members = data.blocked_members;
            var idx = blocked_members.findIndex(x => x.member_num == target);

            // target = a member number to add on list
            if(idx === -1){
              blocked_members.push(target);
              data.blocked_members = blocked_members;
              
              var jsonObj = {};
              jsonObj["data"] = data;
              chrome.storage.local.set(jsonObj, function(){
                sendResponse(true);
              })
              }else{
              sendResponse(false);
              }
          }
        });
        break;

      case "deleteBlockMember":
        var target = request.data;
        chrome.storage.local.get(["data"], function(result){
          var data;

          if(Object.keys(result).length === 0){
            data = undefined;
          }
          else{
            data = result["data"];

            var blocked_members = data.blocked_members;
            var idx = blocked_members.findIndex(x => x.member_num == target);

            if(idx > -1){
              blocked_members.splice(idx, 1);
              data.blocked_members = blocked_members;

              var jsonObj = {};
              jsonObj["data"] = data;
              chrome.storage.local.set(jsonObj, function(){
                sendResponse(jsonObj["data"]);
              })
            }
          }
        });
        break;
        case "importData":
          var target = request.data;

          chrome.storage.local.clear(function(){
            chrome.storage.local.set(target, function(res){
              var error = chrome.runtime.lastError;
              if(error){
                sendResponse(false);
              }else{
                sendResponse(true);
              }
            });
          });
      default:
        console.log(request.msg);
    }

    return true;
});

