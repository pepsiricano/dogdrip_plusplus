window.onload = function(){
    console.log("opened" + this.Date());
    document.getElementById('wipeall-btn').onclick = () =>{
        this.wipeAllData();
    }
    postblocklist();

    addActions();
}

//var content = document.getElementById('content-div');

var tools = {
    datenow : function(){
        var d = new Date();
        return d.getFullYear() + "/" 
             + d.getMonth() + "/" 
             + d.getDate();
    },
    reloadPage : function(){
        chrome.tabs.reload();
    }
}

var postblocklist = () => {
    console.log("postblocklist() called");
    chrome.storage.local.get(["data"], function(result){
        var members;
        if(Object.keys(result).length === 0){
            members = [];
        }else{
            members = result["data"].blocked_members;
            var i,j;
            console.log(members);
            var table = document.querySelector("#data-table>tbody");
            if(members.length != 0){
                var properties = ['date', 'member_num', 'memo']
                for(i=0; i<members.length; i++){
                    var row = document.createElement('tr');
                    for(j=0; j<=properties.length; j++){
                        var cell = document.createElement('td');
                        
                        if(j === 2){
                            // memo
                            var input = document.createElement('input');
                            input.value = members[i][properties[j]];
                            input.className = "memo-input";

                            cell.className = "input-td";
                            cell.appendChild(input);
                        }else if(j === 3){
                            //remove btn
                            var btn = document.createElement('button');
                            btn.className = "remove-btn";
                            btn.innerHTML = "X";
                            cell.appendChild(btn);
                        }
                        else{
                            cell.innerHTML = members[i][properties[j]];
                        }
                        row.appendChild(cell);
                    }
                    table.appendChild(row);
                }
            }
        }
    });
}

var wipeAllData = () => {
    if(window.confirm("초기화 하시겠습니까?")){
        chrome.runtime.sendMessage({msg: "wipeAll"}, (result)=>{
            if(result){
                location.reload();
                tools.reloadPage();
                // update block list
                postblocklist();
            }
        });
    }
}

var addActions = () => {
    var btns = document.getElementsByClassName('remove-btn');


    // 차단 목록 버튼 클릭 이벤트 핸들러
    document.addEventListener('click', function(evt){
        console.log(evt);
        
        // 차단 항목 삭제 버튼
        if(evt.srcElement.className == "remove-btn"){
            var row = evt.path[2];
            var num = evt.path[2].children[1].innerText;

            row.parentNode.removeChild(row);
            
            chrome.runtime.sendMessage({msg:"deleteBlockMember", data: num},function(result){
                console.log(result);
                location.reload();
                tools.reloadPage();
            });
        }

        // 상단 메뉴 선택
        if(evt.srcElement.className == "pure-menu-link"){
            var menu_items = ["menu-0", "menu-1", "menu-about"];
            var idx = menu_items.findIndex(x => x == evt.srcElement.id);
            
            if(idx != -1){
                var div = [
                    document.getElementById("block-content"),
                    document.getElementById("block-option-content"),
                    document.getElementById("about-content")
                ];
                var buttons = document.getElementById("button-div");

                switch(idx){
                    case 0:
                        //block
                        div[0].hidden = false;
                        div[1].hidden = true;
                        div[2].hidden = true;
                        buttons.hidden = false;
                        break;
                    
                    case 1:
                        // block options
                        div[0].hidden = true;
                        div[1].hidden = false;
                        div[2].hidden = true;
                        buttons.hidden = false;
                        break;
                        
                    case 2:
                        // about
                        div[0].hidden = true;
                        div[1].hidden = true;
                        div[2].hidden = false;
                        buttons.hidden = true;
                        break;
                    default:
                        console.log("nothing happens");
                }
            }
        }
    });

    // export
    document.getElementById('save-btn').addEventListener('click', ()=>{
        chrome.storage.local.get(["data"], function(res){
            var data = res["data"];
            var bl = new Blob([JSON.stringify(data)], {
                type: "text/html"
            });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(bl);
            a.download = tools.datenow() + '-export-data.json';
            a.hidden = true;
            document.body.appendChild(a);
            a.innerHTML = "";
            a.click();
        })
    });
    // import
    document.getElementById('load-btn').addEventListener('click', ()=>{
        var input = document.createElement('input');
        input.type = "file";
        input.onchange = (evt) =>{
            var file = evt.target.files[0];
            
            var reader = new FileReader();
            reader.onload = (e) => {
                var jsonObj = {};
                var data = JSON.parse(e.target.result);
                console.log(data);
                
                jsonObj["data"] = data;
                chrome.runtime.sendMessage({msg:"importData", data: jsonObj},function(response){
                    if(response){
                        location.reload();
                        tools.reloadPage();
                    }else{
                        console.log(response);
                        alert("error occured");
                    }
                })
            }
            reader.readAsText(file, 'UTF-8');
            console.log(file);
        }
        input.click()
    });
}